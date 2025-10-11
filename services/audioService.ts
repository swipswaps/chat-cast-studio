import type { ScriptSegment, VoiceSetting } from '../types';
import { browserTextToSpeech } from './browserTtsService';

let isPlaying = false;
let onSegmentStartCallback: ((index: number) => boolean) | null = null;
let onFinishCallback: (() => void) | null = null;
let stopFlag = false;

export async function playScript(
  segments: ScriptSegment[],
  voiceMapping: Map<string, VoiceSetting>,
  onSegmentStart: (index: number) => boolean,
  onFinish: () => void
) {
  stopPlayback(); // Clear any previous state
  isPlaying = true;
  stopFlag = false;
  onSegmentStartCallback = onSegmentStart;
  onFinishCallback = onFinish;

  for (let i = 0; i < segments.length; i++) {
    if (stopFlag) {
      break;
    }

    const segment = segments[i];
    const voiceSetting = voiceMapping.get(segment.speaker);
    
    if (onSegmentStartCallback && !onSegmentStartCallback(i)) {
      stopFlag = true;
      break;
    }

    if (voiceSetting) {
      try {
        await browserTextToSpeech(segment.line, voiceSetting.voiceId);
      } catch (e) {
        console.error(`Speech synthesis failed for segment ${i}:`, e);
        stopFlag = true; // Stop on error
        break;
      }
    }
  }

  // Ensure onFinish is called when the loop completes or is broken
  if (isPlaying) {
    isPlaying = false;
    if (onFinishCallback) {
      onFinishCallback();
    }
  }
}

export function stopPlayback() {
  if (isPlaying) {
    stopFlag = true;
    window.speechSynthesis.cancel();
    isPlaying = false;
    if (onFinishCallback) {
      // Call finish callback to reset UI state
      onFinishCallback();
    }
  }
}
