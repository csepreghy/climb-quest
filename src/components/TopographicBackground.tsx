import { useEffect, useRef } from "react";

/**
 * Procedural topographic-contour background over a layered stone texture.
 * Pure CSS + Canvas (no images). Static by default; pass `animated` to
 * slowly evolve the noise field via requestAnimationFrame.
 */
export function TopographicBackground({ animated = false }: { animated?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let zOffset = 0;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    /* ---------- value noise (hashed lattice + FBM) ---------- */
    const hash = (x: number, y: number, z: number) => {
      let n = x * 374761393 + y * 668265263 + z * 1442695040;
      n = (n ^ (n >> 13)) * 1274126177;
      n = n ^ (n >> 16);
      return ((n >>> 0) % 1_000_000) / 1_000_000;
    };
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const vnoise = (x: number, y: number, z: number) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const xf = x - xi, yf = y - yi, zf = z - zi;
      const u = smooth(xf), v = smooth(yf), w = smooth(zf);
      const c000 = hash(xi, yi, zi);
      const c100 = hash(xi + 1, yi, zi);
      const c010 = hash(xi, yi + 1, zi);
      const c110 = hash(xi + 1, yi + 1, zi);
      const c001 = hash(xi, yi, zi + 1);
      const c101 = hash(xi + 1, yi, zi + 1);
      const c011 = hash(xi, yi + 1, zi + 1);
      const c111 = hash(xi + 1, yi + 1, zi + 1);
      const x00 = lerp(c000, c100, u);
      const x10 = lerp(c010, c110, u);
      const x01 = lerp(c001, c101, u);
      const x11 = lerp(c011, c111, u);
      const y0 = lerp(x00, x10, v);
      const y1 = lerp(x01, x11, v);
      return lerp(y0, y1, w);
    };

    const fbm = (x: number, y: number, z: number, oct = 4) => {
      let amp = 0.5, freq = 1, sum = 0, norm = 0;
      for (let i = 0; i < oct; i++) {
        sum += amp * vnoise(x * freq, y * freq, z * freq);
        norm += amp;
        amp *= 0.5;
        freq *= 2;
      }
      return sum / norm;
    };

    /* ---------- render ---------- */
    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Solid near-black base
      ctx.fillStyle = "hsl(220 35% 3%)";
      ctx.fillRect(0, 0, w, h);

      /* ---------- Pass A: fine monochrome grain ---------- */
      // Render to a half-resolution offscreen ImageData, then scale up.
      const gw = Math.max(1, Math.floor(w / 2));
      const gh = Math.max(1, Math.floor(h / 2));
      const grain = ctx.createImageData(gw, gh);
      const gd = grain.data;
      // Base luminance ~ hsl(220 35% 3%) → approx rgb(5, 6, 10)
      const baseR = 5, baseG = 6, baseB = 10;
      for (let i = 0; i < gd.length; i += 4) {
        const j = (Math.random() - 0.5) * 22; // ±11 jitter — visible grain
        gd[i]     = Math.max(0, Math.min(255, baseR + j));
        gd[i + 1] = Math.max(0, Math.min(255, baseG + j));
        gd[i + 2] = Math.max(0, Math.min(255, baseB + j + (Math.random() - 0.5) * 4));
        gd[i + 3] = 255;
      }
      // Blit via an offscreen canvas so we can scale.
      const off = document.createElement("canvas");
      off.width = gw; off.height = gh;
      off.getContext("2d")!.putImageData(grain, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, w, h);

      /* ---------- Field sampling for contours + mottle ---------- */
      const cell = 5;
      const cols = Math.ceil(w / cell) + 1;
      const rows = Math.ceil(h / cell) + 1;
      const scale = 0.0035;
      const field = new Float32Array(cols * rows);

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const px = i * cell;
          const py = j * cell;
          const n = fbm(px * scale * 0.55, py * scale * 1.4, zOffset);
          field[j * cols + i] = n;
        }
      }

      /* ---------- Pass B: coarse mottle (lightness shifts) ---------- */
      const mcell = 14;
      for (let py = 0; py < h; py += mcell) {
        for (let px = 0; px < w; px += mcell) {
          const n = fbm(px * 0.0018, py * 0.0018, zOffset + 11.3, 3);
          const shift = (n - 0.5) * 2; // -1..1
          const a = 0.22 * Math.abs(shift);
          if (shift >= 0) {
            ctx.fillStyle = `hsl(220 22% 22% / ${a.toFixed(3)})`;
          } else {
            ctx.fillStyle = `hsl(220 50% 0% / ${(a * 1.3).toFixed(3)})`;
          }
          ctx.fillRect(px, py, mcell, mcell);
        }
      }

      /* ---------- Pass C: sparse dark cracks ---------- */
      const ccell = 2;
      ctx.fillStyle = "hsl(220 50% 0% / 0.9)";
      for (let py = 0; py < h; py += ccell) {
        for (let px = 0; px < w; px += ccell) {
          const n = fbm(px * 0.012, py * 0.012, zOffset + 42.7, 3);
          if (Math.abs(n - 0.5) < 0.022) {
            ctx.fillRect(px, py, ccell, ccell);
          }
        }
      }


      /* ---------- Contours (dim, fewer) ---------- */
      const LEVELS = 8;
      const levelMin = 0.28;
      const levelMax = 0.78;

      ctx.lineWidth = 0.7;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let li = 0; li < LEVELS; li++) {
        const t = li / (LEVELS - 1);
        const iso = levelMin + (levelMax - levelMin) * t;

        ctx.beginPath();
        let segCount = 0;

        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const a = field[j * cols + i];
            const b = field[j * cols + i + 1];
            const c = field[(j + 1) * cols + i + 1];
            const d = field[(j + 1) * cols + i];

            let idx = 0;
            if (a > iso) idx |= 1;
            if (b > iso) idx |= 2;
            if (c > iso) idx |= 4;
            if (d > iso) idx |= 8;
            if (idx === 0 || idx === 15) continue;

            const x0 = i * cell;
            const y0 = j * cell;
            const x1 = x0 + cell;
            const y1 = y0 + cell;

            const top = () => [x0 + ((iso - a) / (b - a)) * cell, y0] as const;
            const right = () => [x1, y0 + ((iso - b) / (c - b)) * cell] as const;
            const bot = () => [x0 + ((iso - d) / (c - d)) * cell, y1] as const;
            const left = () => [x0, y0 + ((iso - a) / (d - a)) * cell] as const;

            const drawSeg = (p: readonly [number, number], q: readonly [number, number]) => {
              ctx.moveTo(p[0], p[1]);
              ctx.lineTo(q[0], q[1]);
              segCount++;
            };

            switch (idx) {
              case 1: case 14: drawSeg(top(), left()); break;
              case 2: case 13: drawSeg(top(), right()); break;
              case 3: case 12: drawSeg(left(), right()); break;
              case 4: case 11: drawSeg(right(), bot()); break;
              case 5: drawSeg(top(), left()); drawSeg(right(), bot()); break;
              case 6: case 9: drawSeg(top(), bot()); break;
              case 7: case 8: drawSeg(left(), bot()); break;
              case 10: drawSeg(top(), right()); drawSeg(left(), bot()); break;
            }
          }
        }

        if (segCount === 0) continue;

        const levelAlpha = 0.6 + 0.4 * Math.sin(Math.PI * t);
        ctx.strokeStyle = `hsl(45 88% 58% / ${(0.4 * levelAlpha).toFixed(3)})`;
        ctx.stroke();
      }

      /* ---------- Vignette ---------- */
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.6);
      vg.addColorStop(0, "hsl(220 40% 1% / 0)");
      vg.addColorStop(1, "hsl(220 40% 1% / 0.25)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    };

    const loop = () => {
      zOffset += 0.0015;
      render();
      rafId = requestAnimationFrame(loop);
    };

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 150);
    };

    render();
    if (animated) rafId = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [animated]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}
