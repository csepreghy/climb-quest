import { useEffect, useRef, useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Download, Copy, RefreshCw, Save, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RowMeta {
  updated_at: string | null;
  level: number;
  logs: number;
  strength_sessions: number;
  total_chalk_earned: number;
}

interface Snapshot {
  user_id?: string;
  taken_at?: string;
  game: any;
  gyms: any;
}

const AUTO_SNAP_KEY = "climbquest:admin:autoSnapshot";

function summarize(game: any): Omit<RowMeta, "updated_at"> {
  return {
    level: Number(game?.level ?? 1),
    logs: Array.isArray(game?.logs) ? game.logs.length : 0,
    strength_sessions: Array.isArray(game?.strengthSessions) ? game.strengthSessions.length : 0,
    total_chalk_earned: Number(game?.totalChalkEarned ?? 0),
  };
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function SnapshotsAdmin() {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const [meta, setMeta] = useState<RowMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const [pasted, setPasted] = useState("");
  const [parsed, setParsed] = useState<Snapshot | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [restoring, setRestoring] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [autoSnap, setAutoSnap] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTO_SNAP_KEY) === "1";
  });
  const autoSnapDoneRef = useRef(false);

  async function loadMeta() {
    if (!uid) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_game_state")
      .select("game, updated_at")
      .eq("user_id", uid)
      .maybeSingle();
    setLoading(false);
    if (error) { toast.error("Failed to load row: " + error.message); return; }
    if (!data) { setMeta({ updated_at: null, level: 0, logs: 0, strength_sessions: 0, total_chalk_earned: 0 }); return; }
    setMeta({ updated_at: data.updated_at, ...summarize(data.game) });
  }

  useEffect(() => { loadMeta(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [uid]);

  useEffect(() => {
    if (!autoSnap || !uid || autoSnapDoneRef.current) return;
    autoSnapDoneRef.current = true;
    (async () => {
      const { data } = await supabase
        .from("user_game_state")
        .select("game, gyms, updated_at")
        .eq("user_id", uid)
        .maybeSingle();
      if (!data || !data.game) return;
      const sum = summarize(data.game);
      if (sum.logs === 0 && sum.level <= 1) return;
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadJson(`climbquest-snapshot-${stamp}.json`, {
        user_id: uid, taken_at: new Date().toISOString(),
        game: data.game, gyms: data.gyms,
      });
    })();
  }, [autoSnap, uid]);

  async function handleExport() {
    if (!uid) return;
    const { data, error } = await supabase
      .from("user_game_state")
      .select("game, gyms, updated_at")
      .eq("user_id", uid)
      .maybeSingle();
    if (error || !data) { toast.error("Nothing to export"); return; }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadJson(`climbquest-snapshot-${stamp}.json`, {
      user_id: uid, taken_at: new Date().toISOString(),
      game: data.game, gyms: data.gyms,
    });
    toast.success("Snapshot downloaded");
  }

  async function handleCopy() {
    if (!uid) return;
    const { data, error } = await supabase
      .from("user_game_state")
      .select("game, gyms, updated_at")
      .eq("user_id", uid)
      .maybeSingle();
    if (error || !data) { toast.error("Nothing to copy"); return; }
    await navigator.clipboard.writeText(JSON.stringify(
      { user_id: uid, taken_at: new Date().toISOString(), game: data.game, gyms: data.gyms },
      null, 2,
    ));
    toast.success("Snapshot copied to clipboard");
  }

  function tryParse(text: string) {
    setPasted(text);
    setParseError(null);
    setParsed(null);
    if (!text.trim()) return;
    try {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== "object" || !obj.game || typeof obj.game !== "object") {
        setParseError("JSON must contain a 'game' object"); return;
      }
      if (!obj.gyms || typeof obj.gyms !== "object") {
        setParseError("JSON must contain a 'gyms' object"); return;
      }
      setParsed(obj as Snapshot);
    } catch { setParseError("Not valid JSON"); }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    tryParse(text);
  }

  async function handleRestore() {
    if (!uid || !parsed) return;
    setRestoring(true);
    try {
      const { error } = await supabase.from("user_game_state").upsert({
        user_id: uid,
        game: parsed.game,
        gyms: parsed.gyms,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Restored. Reloading…");
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      toast.error("Restore failed: " + (e?.message ?? String(e)));
    } finally { setRestoring(false); }
  }

  const targetSummary = parsed ? summarize(parsed.game) : null;

  return (
    <div className="space-y-6">
      <GameCard tone="legendary" className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="menu-label">Backup · Export snapshot</div>
            <p className="text-sm text-muted-foreground mt-1">
              Download a full JSON snapshot of your <code>user_game_state</code> row (game + gyms).
              Keep these somewhere safe — they're the only true backup.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadMeta} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs mb-4">
          <Stat label="Level" value={meta?.level ?? "—"} />
          <Stat label="Logs" value={meta?.logs ?? "—"} />
          <Stat label="Strength" value={meta?.strength_sessions ?? "—"} />
          <Stat label="Chalk" value={meta?.total_chalk_earned?.toLocaleString() ?? "—"} />
        </div>
        {meta?.updated_at && (
          <p className="text-[11px] text-muted-foreground mb-3">
            Last updated: {new Date(meta.updated_at).toLocaleString()}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <GameButton onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Download snapshot</GameButton>
          <Button variant="outline" onClick={handleCopy}><Copy className="h-4 w-4 mr-1" /> Copy JSON</Button>
        </div>

        <label className="flex items-center gap-2 mt-4 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoSnap}
            onChange={(e) => {
              setAutoSnap(e.target.checked);
              localStorage.setItem(AUTO_SNAP_KEY, e.target.checked ? "1" : "0");
            }}
          />
          Auto-download a snapshot every time I open the Admin page (browser-only safety net)
        </label>
      </GameCard>

      <GameCard tone="legendary" className="p-5">
        <div className="menu-label mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Restore from snapshot
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Overwrites your <code>game</code> and <code>gyms</code> JSON. This is destructive — make sure
          you've exported the current state first.
        </p>

        <div className="mb-3">
          <Label className="text-xs">Source — file</Label>
          <Input ref={fileInput} type="file" accept="application/json,.json" onChange={handleFile} />
        </div>

        <Label className="text-xs">Source — paste JSON</Label>
        <Textarea
          value={pasted}
          onChange={(e) => tryParse(e.target.value)}
          placeholder='{"game": {...}, "gyms": {...}}'
          className="min-h-[120px] font-mono text-xs"
        />
        {parseError && <p className="text-xs text-destructive mt-1">{parseError}</p>}

        {parsed && targetSummary && (
          <div className="mt-4 rounded-md border border-border p-3 bg-secondary/30 text-xs space-y-2">
            <div className="font-semibold">Preview of restore</div>
            <div className="grid grid-cols-4 gap-2">
              <Compare label="Level" before={meta?.level} after={targetSummary.level} />
              <Compare label="Logs" before={meta?.logs} after={targetSummary.logs} />
              <Compare label="Strength" before={meta?.strength_sessions} after={targetSummary.strength_sessions} />
              <Compare label="Chalk" before={meta?.total_chalk_earned} after={targetSummary.total_chalk_earned} />
            </div>
            {parsed.user_id && parsed.user_id !== uid && (
              <p className="text-amber-500">
                ⚠ Snapshot's user_id ({parsed.user_id.slice(0, 8)}…) doesn't match yours. It will still be
                written to <strong>your</strong> row.
              </p>
            )}
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="mt-4">
              <GameButton disabled={!parsed || restoring}>
                <Save className="h-4 w-4 mr-1" /> Restore
              </GameButton>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Overwrite your data?</AlertDialogTitle>
              <AlertDialogDescription>
                This replaces your current game + gyms data. Type <code>RESTORE</code> below to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="RESTORE" />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirm("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={confirm !== "RESTORE" || restoring}
                onClick={async () => { setConfirm(""); await handleRestore(); }}
              >
                Restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </GameCard>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md bg-secondary/40 px-2 py-1.5 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}

function Compare({ label, before, after }: { label: string; before?: number; after: number }) {
  const changed = before !== after;
  return (
    <div className="rounded-md bg-background/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">{before ?? "—"}</span>
        <span>→</span>
        <span className={changed ? "font-bold text-primary" : "font-bold"}>{after}</span>
      </div>
    </div>
  );
}
