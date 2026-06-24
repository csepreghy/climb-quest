import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  loadSavedState,
  applyGlobalCss,
  applyCachedRemoteCss,
  fetchAndApplyRemoteCss,
} from "./components/admin/cardLabPresets";

async function boot() {
  // 1) Admin-only local override (Card Lab "Live apply" toggle on this browser).
  const saved = loadSavedState();
  if (saved.global) {
    applyGlobalCss(saved.config);
  } else {
    // 2) App-wide remote style from DB. Apply cached copy synchronously so the
    //    first paint matches what the admin pushed — no flicker. If we don't
    //    have a cache yet, wait briefly for the network so first-time visitors
    //    only see the final look.
    const hadCache = applyCachedRemoteCss();
    if (!hadCache) {
      await Promise.race([
        fetchAndApplyRemoteCss(),
        new Promise((r) => setTimeout(r, 1200)),
      ]);
    } else {
      // Refresh in background so later sessions are up to date.
      fetchAndApplyRemoteCss();
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

boot();
