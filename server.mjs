// server.mjs
// ---------------------------------------------------------------------------
// ChatCast Studio Backend
// Provides /api/tts (generate speech) and /api/voices (list voices)
// ---------------------------------------------------------------------------

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Ensure backend dependencies exist automatically
function ensureDependencies() {
  const deps = ["express", "cors", "dotenv"];
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

// Now safely import (works in ESM)
import dotenv from "dotenv";
import { synthesizeSpeech } from "./src/services/ttsService.js";

// Load environment if present
dotenv.config({ path: ".env.local" });

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ---------------------------------------------------------------------------
// Utility: static voice options (for UI dropdown)
// ---------------------------------------------------------------------------
const defaultVoices = [
  { id: "en-US-Neural2-A", name: "US Female (A)" },
  { id: "en-US-Neural2-C", name: "US Female (C)" },
  { id: "en-US-Neural2-D", name: "US Male (D)" },
  { id: "en-GB-Neural2-B", name: "UK Male (B)" },
  { id: "en-AU-Neural2-A", name: "AU Female (A)" },
];

// ---------------------------------------------------------------------------
// Endpoint: GET /api/voices
// ---------------------------------------------------------------------------
app.get("/api/voices", (req, res) => {
  res.json(defaultVoices);
});

// ---------------------------------------------------------------------------
// Endpoint: POST /api/tts
// Body: { text: "...", voice: "...", speakingRate, pitch }
// ---------------------------------------------------------------------------
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice, speakingRate, pitch } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing 'text' in request body." });
    }

    console.log(`[API] /api/tts text length=${text.length}`);

    // Generate MP3
    const outputPath = `./output_${Date.now()}.mp3`;
    const absPath = await synthesizeSpeech(text, {
      voice: voice || "en-US-Neural2-C",
      speakingRate: speakingRate || 1.0,
      pitch: pitch || 0.0,
      outputPath,
    });

    // Stream back the audio
    res.setHeader("Content-Type", "audio/mpeg");
    const stream = fs.createReadStream(absPath);
    stream.pipe(res);
    stream.on("close", () => {
      fs.unlink(absPath, () => {}); // cleanup temp file
    });
  } catch (err) {
    console.error("[API /api/tts] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Launch server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ ChatCast Studio backend running at http://localhost:${PORT}`);
});
