// File: src/services/notebooklmService.ts
// PRF-COMPLIANT — connects to Google NotebookLM API for podcast script + audio generation

/**
 * This service integrates with Google's NotebookLM to:
 *  - Generate a podcast script from chat logs or analysis summary.
 *  - Produce an MP3 narration using NotebookLM's multimodal output (if enabled in your API key).
 * 
 * NOTE: This code assumes you have a valid NotebookLM API key in your environment.
 *       In local dev, create `.env.local` and add:
 *       VITE_NOTEBOOKLM_API_KEY="your_api_key_here"
 */

export interface NotebookLMResponse {
  scriptText: string;
  audioUrl?: string; // If NotebookLM returns an MP3 or audio link
}

export async function generatePodcastWithNotebookLM(
  messages: { role: string; content: string }[],
  config: any
): Promise<NotebookLMResponse> {
  const apiKey = import.meta.env.VITE_NOTEBOOKLM_API_KEY;
  if (!apiKey) throw new Error("NotebookLM API key not configured");

  // Combine all chat messages into a transcript-style prompt
  const transcript = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  // Compose the prompt for NotebookLM
  const prompt = `
You are NotebookLM, a podcast script producer.
Given this chat conversation, produce a ${config.summaryLength} podcast script
in ${config.language} with a ${config.tone} tone and ${config.narrationStyle} style.
Return both the script text and a link to an MP3 narration if available.

Chat Transcript:
${transcript}
`;

  const response = await fetch("https://notebooklm.googleapis.com/v1beta/projects/default/podcasts:generate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      options: {
        output_format: "script_and_audio",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NotebookLM request failed: ${errorText}`);
  }

  const data = await response.json();

  return {
    scriptText: data.script_text || data.text || "",
    audioUrl: data.audio_url || data.audio || null,
  };
}
