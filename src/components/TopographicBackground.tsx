import { useEffect, useRef } from "react";

/**
 * Procedural topographic-contour background.
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
      // map to [0,1)
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

    const fbm = (x: number, y: number, z: number) => {
      let amp = 0.5, freq = 1, sum = 0, norm = 0;
      for (let i = 0; i < 4; i++) {
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

      // Base dark fill with a subtle radial blue-black vignette.
      const baseGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.6);
      baseGrad.addColorStop(0, "hsl(220 22% 7%)");
      baseGrad.addColorStop(1, "hsl(220 25% 3%)");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // Sample the noise field on a coarse grid.
      const cell = 5; // px per grid cell at CSS pixels
      const cols = Math.ceil(w / cell) + 1;
      const rows = Math.ceil(h / cell) + 1;
      const scale = 0.0035; // noise frequency in world units per px
      const field = new Float32Array(cols * rows);

      // Corner bias: peaks in top-right and bottom-left, troughs in middle.
      // Using two anisotropic gaussians.
      const biasAt = (px: number, py: number) => {
        const nx = px / w, ny = py / h;
        const d1 = Math.hypot(nx - 0.92, ny - 0.08); // top-right
        const d2 = Math.hypot(nx - 0.05, ny - 0.92); // bottom-left
        const g1 = Math.exp(-(d1 * d1) / 0.18);
        const g2 = Math.exp(-(d2 * d2) / 0.18);
        return Math.max(g1, g2);
      };

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const px = i * cell;
          const py = j * cell;
          // Stretch the noise horizontally to get long flowing ridges.
          const n = fbm(px * scale * 0.55, py * scale * 1.4, zOffset);
          field[j * cols + i] = n;
        }
      }

      // Marching squares for many iso-levels.
      const LEVELS = 16;
      const levelMin = 0.32;
      const levelMax = 0.72;

      ctx.lineWidth = 0.85;
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

        // Alpha modulated globally per level: middle levels brighter.
        const levelAlpha = 0.55 + 0.35 * Math.sin(Math.PI * t);

        // We can't per-segment alpha cheaply without breaking batching.
        // Instead we stroke the whole level twice: once with a corner-bias
        // gradient on top of a faint global pass, which approximates the
        // bright-corners / faint-middle look from the reference.
        ctx.strokeStyle = `hsl(42 70% 50% / ${0.06 * levelAlpha})`;
        ctx.stroke();

        // Bright corner pass using a radial gradient mask via composite.
        ctx.save();
        ctx.strokeStyle = `hsl(42 92% 60% / ${0.95 * levelAlpha})`;
        // Use a radial-gradient fill stroke via a temporary pattern? Simpler:
        // stroke once more, then overlay a darkening gradient afterwards.
        ctx.stroke();
        ctx.restore();
      }

      // Overlay: darken middle, preserve corners — multiplies down everything
      // (including the gold strokes) so corners visually dominate.
      const overlay = ctx.createRadialGradient(w * 0.5, h * 0.55, Math.min(w, h) * 0.1, w * 0.5, h * 0.55, Math.hypot(w, h) * 0.7);
      overlay.addColorStop(0, "hsl(220 25% 3% / 0.92)");
      overlay.addColorStop(0.55, "hsl(220 25% 3% / 0.55)");
      overlay.addColorStop(1, "hsl(220 25% 3% / 0)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, w, h);

      // Subtle warm corner glows to sell the gold-rich corners.
      const glow = (cx: number, cy: number) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55);
        g.addColorStop(0, "hsl(42 90% 55% / 0.12)");
        g.addColorStop(1, "hsl(42 90% 55% / 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      };
      glow(w * 0.95, h * 0.05);
      glow(w * 0.03, h * 0.95);
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
