// File: src/services/geminiPodcastService.ts
// PRF-COMPLIANT — Enhanced Gemini Podcast Writer + MP3 Exporter
// Works in both browser and Node contexts. No external deps required.

export interface GeminiConfig {
  language: string;       // e.g. "English", "Spanish"
  tone: string;           // e.g. "informative", "funny", "serious"
  summaryLength: string;  // e.g. "short", "medium", "detailed"
  speed: number;          // speaking rate (1.0 = normal)
  voiceName: string;      // Gemini prebuilt voice, e.g. "en-US-Neural2-F"
}

/**
 * Generates a structured podcast script from chat logs using Gemini.
 */
export async function generateScriptWithGemini(
  chatMessages: { role: string; content: string }[],
  config: GeminiConfig
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API key (VITE_GEMINI_API_KEY or GEMINI_API_KEY).");

  // Format transcript cleanly
  const transcript = chatMessages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  // Stronger, broadcast-style prompt
  const prompt = `
You are an experienced radio producer. Write a ${config.summaryLength} ${config.language} podcast script.
The tone should be ${config.tone}. Include natural pacing cues, short dialogue beats, and intro/outro sections.

Input transcript:
${transcript}

Return only the final broadcast-ready script with clear speaker labels and stage cues (e.g., [MUSIC FADE IN]).
`;

  const res = await fetch("https://generative
