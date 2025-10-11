
import type { ChatMessage, AnalysisResult } from '../types';

const WORDS_PER_MINUTE = 150; // Average speaking rate

/**
 * Analyzes an array of chat messages to extract key metrics.
 */
export function analyzeChat(messages: ChatMessage[]): AnalysisResult {
  const speakers = [...new Set(messages.map(m => m.role).filter(role => role !== 'unknown' && role))];
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

  const proseToCodeRatio = wordCount > 0 && codeWordCount > 0 
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
