// File: src/services/parserService.ts
// PRF-COMPLIANT FULL VERSION
// Purpose: Parse uploaded chat logs or pasted text into structured ChatMessage arrays.
// Detects multiple speakers automatically and identifies code blocks accurately.

import type { ChatMessage } from "../types";

/**
 * Parses raw text input into structured chat messages.
 * Automatically detects speaker names, code blocks, and roles.
 *
 * @param text - Raw text content from file or pasted input
 * @returns { messages: ChatMessage[] }
 */
export async function parseTextContent(text: string): Promise<{ messages: ChatMessage[] }> {
  console.log("🧩 [ParserService] Parsing chat text...");

  const messages: ChatMessage[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  let currentSpeaker = "User";
  let currentContent = "";
  let insideCodeBlock = false;

  for (const line of lines) {
    // Detect start/end of code blocks (triple backticks)
    if (/^```/.test(line.trim())) {
      insideCodeBlock = !insideCodeBlock;
      currentContent += "\n" + line;
      continue;
    }

    // Detect speaker prefixes like "User:", "Assistant:", "Host:", etc.
    const speakerMatch = line.match(/^([A-Z][A-Za-z0-9 _-]{1,20}):\s*(.*)$/);

    if (speakerMatch && !insideCodeBlock) {
      // If we were already collecting for a previous speaker, push it
      if (currentContent.trim().length > 0) {
        messages.push({
          role: currentSpeaker,
          content: currentContent.trim(),
          isCodeBlock: /```/.test(currentContent),
        });
      }

      // Start a new message block
      currentSpeaker = speakerMatch[1].trim();
      currentContent = speakerMatch[2].trim();
    } else {
      // Continue collecting text
      currentContent += "\n" + line;
    }
  }

  // Push last message if any
  if (currentContent.trim().length > 0) {
    messages.push({
      role: currentSpeaker,
      content: currentContent.trim(),
      isCodeBlock: /```/.test(currentContent),
    });
  }

  console.log(`✅ [ParserService] Parsed ${messages.length} messages from ${new Set(messages.map(m => m.role)).size} speakers.`);
  return { messages };
}
