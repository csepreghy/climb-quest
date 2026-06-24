import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadSavedState, applyGlobalCss } from "./components/admin/cardLabPresets";

// Rehydrate Card Lab global override (admin-only playground; no-op when off).
const saved = loadSavedState();
if (saved.global) applyGlobalCss(saved.config);

createRoot(document.getElementById("root")!).render(<App />);

