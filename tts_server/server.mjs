// File: tts_server/server.mjs
// PRF-COMPLIANT — Local Audio Generation Server for Chat Cast Studio
// Provides /voices and /synthesize endpoints for frontend TTS integration.

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Example backend voices (can be replaced with actual TTS API names)
const voices = [
  { name: "en-US-Standard-A", lang: "en-US", gender: "FEMALE" },
  { name: "en-GB-Standard-B", lang: "en-GB", gender: "MALE" },
  { name: "en-AU-Standard-C", lang: "en-AU", gender: "MALE" },
];

// Endpoint: list voices
app.get("/voices", (req, res) => {
  res.json(voices);
});

// Endpoint: synthesize (mock output, placeholder for real TTS)
app.post("/synthesize", async (req, res) => {
  const { text, voice } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  console.log(`[TTS SERVER] Synthesize requested with voice: ${voice}`);

  // Mock file (in real setup, call Google TTS, OpenAI, or ElevenLabs)
  const outputDir = path.join(process.cwd(), "tts_server", "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const filename = `${Date.now()}_${voice || "default"}.txt`;
  fs.writeFileSync(path.join(outputDir, filename), text, "utf8");

  res.json({
    message: "Mock synthesis complete.",
    file: `/tts_server/output/${filename}`,
  });
});

// Health check
app.get("/", (_, res) => res.send("TTS server online. Endpoints: /voices, /synthesize"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ TTS server running at http://localhost:${PORT}`));
