// File: src/index.tsx
// PRF-COMPLIANT FULL VERSION
// Purpose: Entry point for React app, mounts ChatCast Studio into DOM.
// Integrates Tailwind CSS and dark theme defaults.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Tailwind CSS entry

// Create React root and render the main App component
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
