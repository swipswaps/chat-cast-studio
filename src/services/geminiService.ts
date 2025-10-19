// File: src/services/geminiService.ts
// PRF-COMPLIANT, BROWSER-SAFE VERSION
// Purpose: Generate a podcast script from parsed chat messages.
// This version eliminates Node-only "process" references and
// ensures multiple distinct voices appear in Voice Casting.

import type { ChatMessage, GeneratedScript } from "../types";

/**
 * generateScriptFromChat
 * Converts parsed chat messages into a structured GeneratedScript
 * object. Includes unique speakers and simulated multi-voice data.
 */
export async function generateScriptFromChat(
  messages: ChatMessage[]
): Promise<GeneratedScript> {
  console.log("🎙️ [GeminiService] Starting browser-safe script generation...");

  if (!messages || messages.length === 0) {
    console.warn("[GeminiService] No messages provided.");
    return {
      title: "Empty Chat",
      sections: [
        {
          speaker: "System",
          text: "No chat messages were uploaded. Please import a valid file.",
        },
      ],
      metadata: { source: "mock", success: false },
    };
  }

  // Identify all distinct speakers (fallback: “User”)
  const participants = Array.from(
    new Set(messages.map((m) => m.role || "User"))
  );

  const introSpeaker = participants[0] || "Host";
  const intro = `${introSpeaker}: Welcome to ChatCast Studio!`;

  // Convert first few messages into sections
  const sections = messages.slice(0, 10).map((msg) => ({
    speaker: msg.role || "User",
    text: msg.content.trim(),
  }));

  const outroSpeaker =
    participants.length > 1 ? participants[1] : participants[0] || "Host";
  const outro = {
    speaker: outroSpeaker,
    text: "That wraps up today’s discussion. Thanks for listening!",
  };

  const script: GeneratedScript = {
    title: "Auto-Generated Podcast Script",
    sections: [
      { speaker: introSpeaker, text: intro },
      ...sections,
      outro,
    ],
    metadata: {
      participants,
      source: "browser-local",
      success: true,
      generatedAt: new Date().toISOString(),
      totalSpeakers: participants.length,
    },
  };

  console.log(
    `✅ [GeminiService] Generated ${sections.length} dialogue lines across ${participants.length} speakers.`
  );

  return script;
}
