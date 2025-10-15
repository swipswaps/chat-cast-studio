// File: server.mjs
// PRF-COMPLIANT BACKEND FOR CHAT CAST STUDIO
// Provides endpoints for voice listing and synthesis.
// Tested with frontend fetchBackendVoices() and synthesizeText() methods.

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import url from "url";
import morgan from "morgan";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(morgan("dev"));

// --- Voice List Endpoint ---
app.get("/voices", async (req, res) => {
  console.log("[TTS] /voices request received");
  try {
    // gtts supports a few languages, not all have male/female variants.
    const voices = [
      { name: "en", lang: "English (Generic)" },
      { name: "es", lang: "Spanish" },
      { name: "fr", lang: "French" },
      { name: "de", lang: "German" },
      { name: "it", lang: "Italian" },
      { name: "ja", lang: "Japanese" },
    ];
    res.json(voices);
  } catch (err) {
    console.error("[TTS] Voice fetch error:", err);
    res.status(500).json({ error: "Failed to load voices" });
  }
});

// --- Text-to-Speech Synthesis Endpoint ---
app.post("/synthesize", async (req, res) => {
  const { text, voice } = req.body;
  if (!text || !voice) {
    return res.status(400).json({ error: "Missing text or voice" });
  }

  console.log(`[TTS] Synthesizing with voice=${voice}, text length=${text.length}`);
  const outDir = path.join(__dirname, "public", "audio");
  const outPath = path.join(outDir, "tts_output.mp3");

  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const cmd = `gtts-cli "${text.replace(/"/g, '\\"')}" --lang ${voice} --output "${outPath}"`;
    exec(cmd, (err) => {
      if (err) {
        console.error("[TTS] Error running gtts-cli:", err);
        return res.status(500).json({ error: "Synthesis failed" });
      }
      console.log(`[TTS] Audio generated: ${outPath}`);
      res.json({ url: `/audio/tts_output.mp3` });
    });
  } catch (err) {
    console.error("[TTS] Synthesis error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Startup ---
app.listen(PORT, () => {
  console.log(`✅ ChatCast TTS backend running at http://localhost:${PORT}`);
});
