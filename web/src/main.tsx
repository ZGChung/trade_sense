import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root container #root is missing in index.html");
}

createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
