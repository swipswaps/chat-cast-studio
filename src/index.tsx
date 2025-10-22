// File: src/index.tsx
/**
 * ChatCast Studio — PRF-Compliant Entry Point (2025-10-21)
 * Mounts App into DOM. Integrates Tailwind CSS.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Tailwind CSS

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
