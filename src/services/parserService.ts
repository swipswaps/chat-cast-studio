// src/services/parserService.js
// PRF-Compliant stub (2025-10-21)
// Parses uploaded text or chat logs into structured messages.

export async function parseTextContent(content) {
  // Simulate parsing: split by lines and assume each line is a message
  const messages = content
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map((line, idx) => ({
      id: idx + 1,
      speaker: 'user',
      text: line.trim(),
      timestamp: new Date().toISOString()
    }));

  // If no messages, return as raw script
  if (messages.length === 0) return { script: { content } };

  return { messages };
}
