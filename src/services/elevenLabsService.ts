// File: services/elevenLabsService.ts
// PRF-COMPLIANT FIX 2025-10-14
// ElevenLabs TTS client with safe logging and error handling.

import { logEvent } from "./logService";

const ELEVEN_LABS_API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function generateElevenLabsVoice(
  text: string,
  voiceId: string = "EXAVITQu4vr4xnSDxMaL",
  model: string = "eleven_multilingual_v2"
): Promise<Blob | null> {
  try {
    logEvent("INFO", `Generating ElevenLabs voice for text length=${text.length}`);

    const response = await fetch(`${ELEVEN_LABS_URL}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_LABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const msg = `ElevenLabs API error ${response.status}`;
      logEvent("ERROR", msg);
      return null;
    }

    const audioBlob = await response.blob();
    logEvent("INFO", "ElevenLabs voice generation successful");
    return audioBlob;
  } catch (err) {
    logEvent("ERROR", "Error in generateElevenLabsVoice()", err);
    return null;
  }
}
