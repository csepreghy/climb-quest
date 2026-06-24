import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  loadSavedState,
  applyGlobalCss,
  applyCachedRemoteCss,
  fetchAndApplyRemoteCss,
} from "./components/admin/cardLabPresets";
import { loadTopoLocal, fetchAndApplyRemoteTopo } from "./components/admin/topoPresets";

// Apply card styles SYNCHRONOUSLY before first paint — no await, no flicker.
const saved = loadSavedState();
if (saved.global) {
  applyGlobalCss(saved.config);
} else {
  applyCachedRemoteCss();
}

// Apply topo background config from cache synchronously so the canvas mounts
// with the correct settings already in place.
loadTopoLocal();

// Render immediately so the user sees the loading screen instantly with the
// correct background and card styles already in place.
createRoot(document.getElementById("root")!).render(<App />);

// Refresh remote style + topo in the background so changes propagate.
if (!saved.global) {
  fetchAndApplyRemoteCss();
}
fetchAndApplyRemoteTopo();

