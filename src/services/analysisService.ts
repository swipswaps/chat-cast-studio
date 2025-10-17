// src/services/analysisService.ts
import type { ChatMessage, AnalysisResult, GeneratedScript } from "../types";

const WORDS_PER_MINUTE = 150;

export function analyzeChat(messages: ChatMessage[]): AnalysisResult {
  const speakers = [...new Set(messages.map(m => m.role).filter(Boolean))];
  const messageCount = messages.length;

  let wordCount = 0;
  let codeBlockCount = 0;
  let codeWordCount = 0;

  messages.forEach(msg => {
    const words = msg.content.split(/\s+/).filter(Boolean);
    wordCount += words.length;
    if (msg.isCodeBlock) {
      codeBlockCount++;
      codeWordCount += words.length;
    }
  });

  const proseWordCount = wordCount - codeWordCount;
  const estimatedDurationMinutes = Math.max(1, Math.round(proseWordCount / WORDS_PER_MINUTE));

  const proseToCodeRatio =
    wordCount > 0 && codeWordCount > 0
      ? `${Math.round((proseWordCount / wordCount) * 100)}% / ${Math.round((codeWordCount / wordCount) * 100)}%`
      : '100% / 0%';

  return {
    speakers,
    messageCount,
    wordCount,
    estimatedDurationMinutes,
    codeBlockCount,
    proseToCodeRatio,
  };
}

export function analyzeScript(script: GeneratedScript): AnalysisResult {
  const speakers = [...new Set(script.segments.map(s => s.speaker))];
  const wordCount = script.segments.reduce((sum, seg) => sum + (seg.line?.split(/\s+/).filter(Boolean).length ?? 0), 0);
  const estimatedDurationMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

  return {
    speakers,
    messageCount: script.segments.length,
    wordCount,
    estimatedDurationMinutes,
    codeBlockCount: 0,
    proseToCodeRatio: 'N/A',
  };
}
