// src/services/ttsService.js
// ---------------------------------------------------------------------------
// Handles text-to-speech synthesis using Gemini API (AI Studio)
// Automatically ensures dependencies, loads .env.local, and exports audio.
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// Step 1: Ensure dependencies exist
// ---------------------------------------------------------------------------
function ensureDependencies() {
  const deps = ["node-fetch", "dotenv"];
  for (const dep of deps) {
    try {
      require.resolve(dep);
    } catch {
      console.log(`[AutoInstall] Installing missing dependency: ${dep}`);
      execSync(`npm install ${dep}`, { stdio: "inherit" });
    }
  }
}
ensureDependencies();

// Import dependencies *after* they exist
import fetch from "node-fetch";
import dotenv from "dotenv";

// ---------------------------------------------------------------------------
// Step 2: Load environment variables from .env.local (if present)
// ---------------------------------------------------------------------------
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  console.log(`[Env] Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn("[Env] No .env.local file found; relying on process.env");
}

// ---------------------------------------------------------------------------
// Step 3: Validate GEMINI_API_KEY
// ---------------------------------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error(
    "\n❌ Missing GEMINI_API_KEY environment variable.\n" +
      "You can fix this by creating a .env.local file in your project root:\n\n" +
      "   echo \"GEMINI_API_KEY='your_api_key_here'\" > .env.local\n\n" +
      "or by exporting it manually:\n\n" +
      "   export GEMINI_API_KEY='your_api_key_here'\n"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 4: Gemini Speech Synthesis Function
// ---------------------------------------------------------------------------
export async function synthesizeSpeech(text, options = {}) {
  const {
    voice = "en-US-Neural2-C",
    language = "en-US",
    speakingRate = 1.0,
    pitch = 0.0,
    outputPath = "./output.mp3",
  } = options;

  console.log(`[TTS] Synthesizing speech for text length: ${text.length}`);

  // Gemini endpoint
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
    GEMINI_API_KEY;

  // Request body: instruct Gemini to return MP3-encoded speech
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Generate speech (MP3) for this text using voice=${voice}, language=${language}, speakingRate=${speakingRate}: ${text}`,
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "audio/mpeg",
    },
  };

  // -------------------------------------------------------------------------
  // Step 5: Perform API Request
  // -------------------------------------------------------------------------
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[TTS Error] ${response.status}: ${errorText}`);
  }

  // -------------------------------------------------------------------------
  // Step 6: Decode and Save Audio
  // -------------------------------------------------------------------------
  const json = await response.json();
  const base64Audio = json?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;

  if (!base64Audio) {
    console.error(json);
    throw new Error("❌ No audio data returned from Gemini API.");
  }

  const buffer = Buffer.from(base64Audio, "base64");
  const absPath = path.resolve(outputPath);
  fs.writeFileSync(absPath, buffer);
  console.log(`[TTS] ✅ MP3 file saved at ${absPath}`);

  return absPath;
}
