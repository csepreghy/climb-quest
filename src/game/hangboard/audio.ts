// Tiny Web Audio helper for hangboard countdown cues.
// 3 short beeps for the final 3 seconds of a phase; a longer, lower beep on
// the actual transition (start of next phase). No asset files.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Call from a user gesture (start button) to unlock audio on Safari/iOS. */
export function primeAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

const MUTE_KEY = "hangboard.mute";

export function isMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
}
export function setMuted(m: boolean) {
  try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch {}
}

function tone(freq: number, durationMs: number, gain = 0.18) {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.02);
}

/** Short high beep — for "3, 2, 1" countdown ticks. */
export function tickBeep() {
  tone(880, 120);
}
/** Long low beep — for phase transitions (hang→rest or rest→hang). */
export function transitionBeep() {
  tone(523, 600, 0.22);
}
/** Final celebratory pair when the whole workout finishes. */
export function finishBeep() {
  tone(784, 200);
  setTimeout(() => tone(1046, 450, 0.22), 220);
}
