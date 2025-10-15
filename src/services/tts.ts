// File: services/tts.ts
// PRF-COMPLIANT FIX 2025-10-15
// Unified Text-to-Speech handler with backend + ElevenLabs support.

import { logEvent } from "./logService";
import * as elevenLabs from "./elevenLabsService"; // use namespace import

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/**
 * Fetch available voices from the backend server.
 */
export async function fetchBackendVoices(): Promise<
  { name: string; lang: string }[]
> {
  try {
    const response = await fetch(`${BACKEND_URL}/voices`);
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    const data = await response.json();
    logEvent("INFO", `Loaded ${data.length} voices from backend`, data, "tts");
    return data;
  } catch (err) {
    logEvent("ERROR", "Failed to load backend voices", err, "tts");
    return [];
  }
}

/**
 * Synthesize text to audio (either backend or ElevenLabs).
 */
export async function synthesizeText(
  text: string,
  voiceId: string = "en",
  provider: "backend" | "elevenlabs" = "backend"
): Promise<Blob | null> {
  try {
    logEvent(
      "INFO",
      `Synthesizing text via ${provider} (${text.length} chars)`,
      null,
      "tts"
    );

    if (provider === "elevenlabs") {
      if (typeof elevenLabs.generateElevenLabsVoice !== "function") {
        throw new Error("generateElevenLabsVoice not exported from elevenLabsService");
      }
      const blob = await elevenLabs.generateElevenLabsVoice(text, voiceId);
      logEvent("INFO", "ElevenLabs synthesis completed", { voiceId }, "tts");
      return blob;
    }

    // Backend fallback
    const response = await fetch(`${BACKEND_URL}/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId }),
    });
    if (!response.ok)
      throw new Error(`Backend synthesis failed (${response.status})`);

    const audioBlob = await response.blob();
    logEvent("INFO", "Backend synthesis successful", { voiceId }, "tts");
    return audioBlob;
  } catch (err) {
    logEvent("ERROR", "Text synthesis failed", err, "tts");
    return null;
  }
}
