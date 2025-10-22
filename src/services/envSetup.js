// File: src/services/envSetup.js
// ---------------------------------------------------------------------------
// PRF-COMPLIANT ENVIRONMENT AND DEPENDENCY MANAGER (2025-10-22)
// ---------------------------------------------------------------------------
// Purpose:
//   1. Ensures all required Node.js dependencies for ChatCast Studio exist.
//   2. Automatically installs any missing packages via npm.
//   3. Loads environment variables from `.env` or shell if available.
//   4. Exports API keys and environment vars for frontend + backend harmony.
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import process from "process";

// ---------------------------------------------------------------------------
// 1. Dependency auto-installer
// ---------------------------------------------------------------------------
function ensureDependencies() {
  const deps = [
    "dotenv",
    "node-fetch@3",
    "form-data",
  ];

  for (const dep of deps) {
    try {
      require.resolve(dep);
    } catch {
      console.log(`[envSetup] Installing missing dependency: ${dep}`);
      try {
        execSync(`npm install ${dep} --save`, { stdio: "inherit" });
      } catch (err) {
        console.error(`[envSetup] Failed to install ${dep}:`, err);
      }
    }
  }
}
ensureDependencies();

// ---------------------------------------------------------------------------
// 2. Load dotenv (if present)
// ---------------------------------------------------------------------------
let dotenvLoaded = false;
try {
  const dotenv = await import("dotenv");
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    dotenvLoaded = true;
    console.log(`[envSetup] Loaded environment from ${envPath}`);
  } else {
    console.warn(`[envSetup] No .env file found — will use shell variables`);
  }
} catch (err) {
  console.warn(`[envSetup] dotenv not loaded (optional): ${err.message}`);
}

// ---------------------------------------------------------------------------
// 3. Validate and export environment variables
// ---------------------------------------------------------------------------

const REQUIRED_KEYS = [
  "GEMINI_API_KEY",
  "NOTEBOOKLM_API_KEY",
];

for (const key of REQUIRED_KEYS) {
  if (!process.env[key]) {
    console.warn(
      `⚠️ Missing ${key}. Please export it manually:\n` +
      `   export ${key}='your_api_key_here'`
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Helper: Auto-create `.env` if it does not exist
// ---------------------------------------------------------------------------
const envFilePath = path.resolve(process.cwd(), ".env");
if (!fs.existsSync(envFilePath)) {
  console.log(`[envSetup] Creating placeholder .env file...`);
  const defaultEnv = [
    `# ChatCast Studio API Keys`,
    `# These keys are required for text-to-speech and AI generation.`,
    `# Obtain them from your Google AI Studio / NotebookLM dashboard.`,
    ``,
    `GEMINI_API_KEY=your_gemini_api_key_here`,
    `NOTEBOOKLM_API_KEY=your_notebooklm_api_key_here`,
    ``,
  ].join("\n");
  fs.writeFileSync(envFilePath, defaultEnv);
  console.log(`[envSetup] Default .env created at ${envFilePath}`);
}

// ---------------------------------------------------------------------------
// 5. Final: Export to globalThis for universal access
// ---------------------------------------------------------------------------
globalThis.env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  NOTEBOOKLM_API_KEY: process.env.NOTEBOOKLM_API_KEY || "",
};

console.log(`[envSetup] Environment keys loaded:`, {
  GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  NOTEBOOKLM_API_KEY: !!process.env.NOTEBOOKLM_API_KEY,
});

// ---------------------------------------------------------------------------
// 6. Compatibility Export (ESM + CommonJS)
// ---------------------------------------------------------------------------
export default globalThis.env;
