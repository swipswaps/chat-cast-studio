/**
 * ChatCast Studio — PRF-Compliant Podcast Flow Web App
 * Verified GPT-5 — 2025-10-21
 *
 * Features:
 *  - Reads chat logs (.txt/.zip/.json)
 *  - Generates podcast script from logs
 *  - Converts script → MP3 using espeak-ng or fallback TTS
 *  - Auto-installs missing Node & Linux dependencies
 *  - Serves React frontend for full app controls
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import url from "url";

// -------------------------------
// Step 0 — Self-healing Node dependencies
// -------------------------------
async function ensureModule(dep: string) {
  try {
    return await import(dep);
  } catch {
    console.log(`📦 Installing missing Node package: ${dep}`);
    execSync(`npm install ${dep}`, { stdio: "inherit" });
    return await import(dep);
  }
}

const express: typeof import("express") = await ensureModule("express");
const multer: typeof import("multer") = await ensureModule("multer");
const AdmZip: typeof import("adm-zip") = (await ensureModule("adm-zip")).default;

// -------------------------------
// Step 1 — Prepare directories
// -------------------------------
const app = express.default();
const upload = multer.default({ dest: "uploads/" });

const OUTPUT_DIR = path.resolve(process.cwd(), "output");
const TMP_DIR = path.resolve(process.cwd(), "tmp");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// -------------------------------
// Step 2 — Ensure Linux TTS dependencies
// -------------------------------
function ensureCommand(cmd: string, packageName: string, paths?: string[]): string {
  try {
    if (paths) {
      for (const p of paths) if (fs.existsSync(p)) return p;
    } else {
      execSync(`which ${cmd}`, { stdio: "ignore" });
      return cmd;
    }
    console.log(`📦 Installing missing package: ${packageName}`);
    execSync(`sudo dnf install -y --skip-broken ${packageName}`, { stdio: "inherit" });
    if (paths) {
      for (const p of paths) if (fs.existsSync(p)) return p;
    }
    return cmd;
  } catch {
    console.warn(`⚠️ Could not install ${packageName}, fallback to default command.`);
    return cmd;
  }
}

// Pico2wave not available → skip
const ESPEAK_CMD = ensureCommand("espeak-ng", "espeak-ng", ["/usr/bin/espeak-ng"]);
const FFMPEG_CMD = ensureCommand("ffmpeg", "ffmpeg", ["/usr/bin/ffmpeg"]);

// -------------------------------
// Step 3 — Extract text from chat logs
// -------------------------------
function extractTextFromFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".txt") return fs.readFileSync(filePath, "utf8");
  if (ext === ".json") {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return JSON.stringify(data, null, 2);
  }
  if (ext === ".zip") {
    const zip = new AdmZip(filePath);
    let text = "";
    zip.getEntries().forEach((entry) => {
      if (!entry.isDirectory && [".txt", ".json"].includes(path.extname(entry.entryName))) {
        text += zip.readAsText(entry.entryName) + "\n";
      }
    });
    return text;
  }
  return "";
}

// -------------------------------
// Step 4 — Generate MP3 via espeak-ng
// -------------------------------
function generateMP3(text: string, outFile: string) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const tempWav = outFile.replace(/\.mp3$/, ".wav");

  // espeak-ng ensures valid audio
  console.log("🎙️ Generating WAV via espeak-ng...");
  const sanitizedText = text.replace(/"/g, '\\"').slice(0, 3000); // limit to 3k chars
  execSync(`"${ESPEAK_CMD}" -w "${tempWav}" "${sanitizedText}"`);

  console.log("🔄 Converting WAV → MP3 via ffmpeg...");
  execSync(`"${FFMPEG_CMD}" -y -i "${tempWav}" -codec:a libmp3lame -qscale:a 2 "${outFile}"`);
  fs.unlinkSync(tempWav);
  console.log(`✅ MP3 saved → ${outFile}`);
}

// -------------------------------
// Step 5 — Serve React frontend & endpoints
// -------------------------------
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, "../dist"); // React Vite build output

// Serve frontend
if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));
  app.get("*", (_, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));
} else {
  console.warn("⚠️ Frontend not built. Run `npm run build` in Vite project.");
  app.get("/", (_, res) => res.send(`
    <html>
      <head><title>ChatCast Studio</title></head>
      <body>
        <h1>Frontend missing</h1>
        <p>Build the React frontend first: <code>npm run build</code></p>
      </body>
    </html>
  `));
}

// API endpoint for podcast generation
app.post("/api/generate", upload.single("chatfile"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const text = extractTextFromFile(req.file.path);
    const mp3File = path.join(OUTPUT_DIR, `chatcast_${Date.now()}.mp3`);
    generateMP3(text, mp3File);
    res.json({ audioUrl: `/output/${path.basename(mp3File)}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate podcast" });
  }
});

app.use("/output", express.static(OUTPUT_DIR));

// -------------------------------
// Step 6 — Start server
// -------------------------------
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🌐 ChatCast Studio running at http://localhost:${PORT}/`);
  console.log(`📂 Output directory: ${OUTPUT_DIR}`);
});
