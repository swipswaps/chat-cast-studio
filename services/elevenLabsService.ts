import type { ElevenLabsVoice } from "../types";

const API_BASE_URL = 'https://api.elevenlabs.io/v1';

/**
 * Fetches the list of available voices from the ElevenLabs API.
 * @param apiKey - The user's ElevenLabs API key.
 * @returns A promise that resolves to an array of voices.
 */
export async function getVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  const response = await fetch(`${API_BASE_URL}/voices`, {
    headers: { 'xi-api-key': apiKey },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch ElevenLabs voices: ${response.statusText} - ${errorData.detail?.message || 'Check your API key.'}`);
  }

  const data = await response.json();
  return data.voices;
}

/**
 * Generates audio for a given text segment using a specific voice.
 * @param apiKey - The user's ElevenLabs API key.
 * @param text - The text to convert to speech.
 * @param voiceId - The ID of the voice to use.
 * @returns A promise that resolves to an audio blob.
 */
export async function textToSpeech(apiKey: string, text: string, voiceId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2', // Or another suitable model
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`ElevenLabs TTS failed: ${response.statusText} - ${errorData.detail?.message || 'An error occurred.'}`);
  }

  return response.blob();
}
