/**
 * PRF-COMPLIANT FILE — ChatCast Studio (2025-10-17)
 * geminiService.ts — Handles all Gemini model interaction and schema validation.
 */

import { GoogleGenAI, Type } from '@google/genai';
import type {
  ChatMessage,
  PodcastConfig,
  GeneratedScript,
  TechnicalityLevel,
  PodcastStyleObject,
} from '../types';

/**
 * Generate a structured podcast script using Gemini.
 */
export async function generatePodcastScript(
  messages: ChatMessage[],
  config: PodcastConfig
): Promise<GeneratedScript> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const chatHistory = messages
    .map((msg) =>
      msg.isCodeBlock
        ? `[CODE BLOCK]\n${msg.content}\n[/CODE BLOCK]`
        : `${msg.role}: ${msg.content}`
    )
    .join('\n\n');

  const voiceMappingString = config.voiceMapping
    ? Array.from(config.voiceMapping.entries())
        .map(([original, voice]) => `'${original}' → '${voice.podcastName}'`)
        .join(', ')
    : 'None';

  const technicalityLevel: TechnicalityLevel =
    typeof config.technicality === 'object'
      ? config.technicality
      : { id: 'default', name: String(config.technicality || 'Normal'), description: '' };

  // --- Normalize style object ---
  const styleObj: PodcastStyleObject =
    typeof config.style === 'string'
      ? { id: config.style, name: config.style, description: '' }
      : config.style;

  const systemInstruction = `
You are an expert podcast scriptwriter.
Podcast Config:
- Style: ${styleObj.name} (${styleObj.description})
- Technicality: ${technicalityLevel.name} (${technicalityLevel.description})
- Voice Mapping: ${voiceMappingString}
- Music: ${config.includeMusic}
- SFX: ${config.includeSfx}

Transform the chat into a polished podcast script with segments, intro hook, and outro.

Raw Chat:
${chatHistory}
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      hook: { type: Type.STRING },
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING },
            line: { type: Type.STRING },
            sfx: { type: Type.STRING },
            type: {
              type: Type.STRING,
              enum: [
                'intro',
                'hook',
                'segment_host',
                'segment_guest',
                'transition',
                'code_explanation',
                'outro',
                'music_bridge',
              ],
            },
          },
          required: ['speaker', 'line', 'type'],
        },
      },
    },
    required: ['title', 'hook', 'segments'],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemInstruction,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.7,
      },
    });

    const parsedJson = JSON.parse(response.text);

    if (!parsedJson.title || !parsedJson.hook || !Array.isArray(parsedJson.segments)) {
      throw new Error('Malformed JSON from Gemini API.');
    }

    return { ...parsedJson, id: '' } as GeneratedScript;
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error instanceof Error && /API key/i.test(error.message)) {
      throw new Error('AI authentication error.');
    }
    throw new Error('Failed to generate podcast script via Gemini API.');
  }
}
