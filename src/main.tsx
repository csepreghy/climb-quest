import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  loadSavedState,
  applyGlobalCss,
  applyCachedRemoteCss,
  fetchAndApplyRemoteCss,
} from "./components/admin/cardLabPresets";

// Apply card styles SYNCHRONOUSLY before first paint — no await, no flicker.
const saved = loadSavedState();
if (saved.global) {
  applyGlobalCss(saved.config);
} else {
  applyCachedRemoteCss();
}

// Render immediately so the user sees the loading screen instantly with the
// correct background and card styles already in place.
createRoot(document.getElementById("root")!).render(<App />);

// Refresh remote style in the background so changes propagate on later loads.
if (!saved.global) {
  fetchAndApplyRemoteCss();
}
