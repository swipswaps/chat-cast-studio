import { GoogleGenAI, Type } from '@google/genai';
import type { ChatMessage, PodcastConfig, GeneratedScript } from '../types';

/**
 * Generates a podcast script using the Gemini API.
 * @param messages - The array of chat messages.
 * @param config - The user's podcast configuration.
 * @returns A promise that resolves to the generated script.
 */
export async function generatePodcastScript(
  messages: ChatMessage[],
  config: PodcastConfig
): Promise<GeneratedScript> {
  // FIX: API key must be from process.env.API_KEY per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const chatHistory = messages
    .map(msg => {
      let content = msg.isCodeBlock ? `[CODE BLOCK]\n${msg.content}\n[/CODE BLOCK]` : msg.content;
      return `${msg.role}: ${content}`;
    })
    .join('\n\n');

  const voiceMappingString = Array.from(config.voiceMapping.entries())
    .map(([original, voiceSetting]) => `'${original}' (original) will be voiced by '${voiceSetting.podcastName}' (podcast voice).`)
    .join(' ');
  
  const systemInstruction = `
You are an expert podcast scriptwriter and producer. Your task is to transform a raw chat log into a polished, engaging podcast script.

**Podcast Configuration:**
- **Style:** ${config.style.name} (${config.style.description})
- **Technicality Level:** ${config.technicality.name} (${config.technicality.description})
- **Voice Mapping:** ${voiceMappingString}
- **Include Background Music:** ${config.includeMusic}
- **Include Sound Effects:** ${config.includeSfx}

**Your Mission:**
1.  **Create a Narrative:** Do not just read the chat log. Create a compelling narrative flow. The "user" role should be adapted into a curious Host asking questions, and the "assistant" role into an expert Guest providing answers.
2.  **Add Structure:**
    *   **Catchy Title:** Create a short, engaging title for the episode.
    *   **Hook (Intro):** Write a 15-20 second hook to grab the listener's attention. Tease the main topic and what they will learn.
    *   **Segments:** Break the conversation into logical segments. Use the assigned podcast names to introduce topics and provide transitions.
    *   **Outro:** Write a brief outro summarizing the key takeaways and thanking the listener.
3.  **Handle Code Blocks:** Based on the technicality level:
    *   **Beginner:** Do not read code. Describe what the code does in simple, high-level terms.
    *   **Intermediate:** Explain the purpose of complex code blocks, but summarize simpler ones.
    *   **Advanced:** Explain the code's function and may include very short, key snippets verbatim if they are critical to the explanation.
4.  **Refine Dialogue:**
    *   Rewrite the raw chat content into natural-sounding speech.
    *   Ensure the dialogue reflects the assigned podcast names (e.g., 'Host' is inquisitive, 'Guest' is knowledgeable).
    *   Break up long monologues.
5.  **Add Production Cues (Optional but encouraged):**
    *   Where appropriate, suggest non-intrusive sound effects (SFX) like '[SFX: gentle keyboard typing]' or '[SFX: a subtle 'aha' sound effect]'.
    *   Suggest music cues like '[MUSIC: intro theme fades in]' or '[MUSIC: thoughtful bed fades out]'.
6.  **Output Format:** Adhere STRICTLY to the provided JSON schema. Ensure every segment has a speaker, line, and type. The speaker names must be the mapped podcast voices (e.g., "Host", "Guest"), NOT the original roles ("user", "assistant").

**Input Chat Log:**
---
${chatHistory}
---
Now, generate the podcast script based on these instructions.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "An engaging title for the podcast episode." },
      hook: { type: Type.STRING, description: "A short, compelling introduction (1-2 sentences) to grab the listener's attention." },
      segments: {
        type: Type.ARRAY,
        description: "An array of script segments, each representing a line of dialogue or a production cue.",
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING, description: "The speaker's name (e.g., Host, Guest). Use 'NARRATOR' for scene-setting or transitions." },
            line: { type: Type.STRING, description: "The dialogue or narration for this segment." },
            sfx: { type: Type.STRING, description: "An optional sound effect cue, e.g., 'soft keyboard typing'." },
            type: { 
                type: Type.STRING, 
                description: "The type of segment, for structural context.",
                enum: ['intro', 'hook', 'segment_host', 'segment_guest', 'transition', 'code_explanation', 'outro', 'music_bridge']
            },
          },
          required: ["speaker", "line", "type"],
        },
      },
    },
    required: ["title", "hook", "segments"],
  };

  try {
    const response = await ai.models.generateContent({
      // FIX: Use recommended model per guidelines.
      model: 'gemini-2.5-flash',
      contents: systemInstruction,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const jsonString = response.text;
    const parsedJson = JSON.parse(jsonString);
    
    // Basic validation
    if (!parsedJson.title || !parsedJson.hook || !Array.isArray(parsedJson.segments)) {
      throw new Error("Received malformed JSON from API.");
    }

    // FIX: Property 'id' is missing in type 'Omit<GeneratedScript, "id">' but required in type 'GeneratedScript'.
    // The Gemini API response does not include an ID. Add a placeholder ID to satisfy the
    // GeneratedScript type. The calling component will overwrite this with a real ID.
    return { ...parsedJson, id: '' } as GeneratedScript;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('Your Gemini API key is not valid. Please check it and try again.');
    }
    throw new Error('Failed to communicate with the Gemini API. Please check your network connection and API key.');
  }
}