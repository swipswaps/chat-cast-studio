// File: src/services/analysisService.ts
// PRF-COMPLIANT FULL VERSION
// Provides summary analytics for both chats and scripts.
// Ensures multi-speaker detection and duration estimation.

import type { ChatMessage, AnalysisResult, GeneratedScript } from "../types";

const WORDS_PER_MINUTE = 150;

/**
 * analyzeChat — counts words, code blocks, and unique speakers
 */
export function analyzeChat(messages: ChatMessage[]): AnalysisResult {
  const speakers = [...new Set(messages.map((m) => m.role || "User"))];
  const messageCount = messages.length;

  let wordCount = 0;
  let codeBlockCount = 0;
  let codeWordCount = 0;

  messages.forEach((msg) => {
    const words = msg.content.split(/\s+/).filter(Boolean);
    wordCount += words.length;
    if (msg.isCodeBlock) {
      codeBlockCount++;
      codeWordCount += words.length;
    }
  });

  const proseWordCount = wordCount - codeWordCount;
  const estimatedDurationMinutes = Math.max(
    1,
    Math.round(proseWordCount / WORDS_PER_MINUTE)
  );

  const proseToCodeRatio =
    wordCount > 0 && codeWordCount > 0
      ? `${Math.round(
          (proseWordCount / wordCount) * 100
        )}% prose / ${Math.round(
          (codeWordCount / wordCount) * 100
        )}% code`
      : "100% prose / 0% code";

  return {
    speakers,
    messageCount,
    wordCount,
    estimatedDurationMinutes,
    codeBlockCount,
    proseToCodeRatio,
  };
}

/**
 * analyzeScript — evaluates a fully generated podcast script
 */
export function analyzeScript(script: GeneratedScript): AnalysisResult {
  const sections = script.sections ?? [];
  const speakers = [
    ...new Set(sections.map((s) => s.speaker || "Narrator")),
  ];
  const wordCount = sections.reduce(
    (sum, seg) =>
      sum + (seg.text?.split(/\s+/).filter(Boolean).length ?? 0),
    0
  );
  const estimatedDurationMinutes = Math.max(
    1,
    Math.round(wordCount / WORDS_PER_MINUTE)
  );

  return {
    speakers,
    messageCount: sections.length,
    wordCount,
    estimatedDurationMinutes,
    codeBlockCount: 0,
    proseToCodeRatio: "N/A",
  };
}
