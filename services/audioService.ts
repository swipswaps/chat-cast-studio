import type { ScriptSegment, VoiceSetting } from '../types';
import { browserTextToSpeech } from './browserTtsService';
import logger from './loggingService';

let isPlaying = false;
let stopFlag = false;
let onSegmentStartCallback: ((index: number) => boolean) | null = null;
let onFinishCallback: (() => void) | null = null;
let onErrorCallback: ((error: string) => void) | null = null;
let currentCancelResolver: (() => void) | null = null;

// Workaround for a long-standing Chrome bug where speech synthesis can go silent.
let speechPingInterval: number | undefined;

/**
 * A more robust ping to keep the speech synthesis engine active by speaking a silent utterance.
 * This is more effective than just calling `resume()`.
 */
function startSpeechPing() {
  if (speechPingInterval || typeof window === 'undefined' || !window.speechSynthesis) return;
  logger.info('Starting speech synthesis keep-alive ping.');
  speechPingInterval = window.setInterval(() => {
    if (window.speechSynthesis.speaking) {
      // Don't interrupt if something is already speaking.
      return;
    }
    const utterance = new SpeechSynthesisUtterance(' '); // A single space is enough to wake it up
    utterance.volume = 0; // Make it silent
    utterance.rate = 10; // Speak it as fast as possible
    window.speechSynthesis.speak(utterance);
  }, 12000); // every 12 seconds
}

function stopSpeechPing() {
  if (speechPingInterval) {
    logger.info('Stopping speech synthesis keep-alive ping.');
    window.clearInterval(speechPingInterval);
    speechPingInterval = undefined;
  }
}

function cleanupState() {
    logger.info('Cleaning up audio service state.');
    isPlaying = false;
    stopFlag = true;
    stopSpeechPing();
    
    // Unblock any pending playback promise
    if (currentCancelResolver) {
        logger.warn('Force-resolving a hanging playback promise.');
        currentCancelResolver();
        currentCancelResolver = null;
    }

    onSegmentStartCallback = null;
    onFinishCallback = null;
    onErrorCallback = null;
}

export async function playScript(
  segments: ScriptSegment[],
  voiceMapping: Map<string, VoiceSetting>,
  onSegmentStart: (index: number) => boolean,
  onFinish: () => void,
  onError: (error: string) => void
) {
  if (isPlaying) {
    logger.warn('playScript called while already playing. Stopping previous playback.');
    stopPlayback();
  }
  
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    logger.info('Clearing any previous utterances from the speech queue.');
    window.speechSynthesis.cancel();
  }
  
  logger.info(`Starting script playback with ${segments.length} segments.`);
  isPlaying = true;
  stopFlag = false;
  onSegmentStartCallback = onSegmentStart;
  onFinishCallback = onFinish;
  onErrorCallback = onError;
  startSpeechPing();

  for (let i = 0; i < segments.length; i++) {
    if (stopFlag) {
      logger.info(`Playback stopped at segment ${i}.`);
      break;
    }

    const segment = segments[i];
    const voiceSetting = voiceMapping.get(segment.speaker);
    logger.info(`Processing segment ${i}: Speaker '${segment.speaker}'`);

    if (onSegmentStartCallback && !onSegmentStartCallback(i)) {
      logger.info(`onSegmentStart callback returned false. Stopping playback.`);
      stopFlag = true;
      break;
    }

    if (voiceSetting?.voiceId) {
      const playbackPromise = browserTextToSpeech(segment.line, voiceSetting.voiceId);
      const cancelPromise = new Promise<void>(resolve => {
        currentCancelResolver = resolve;
      });

      try {
        await Promise.race([playbackPromise, cancelPromise]);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown playback error occurred.';
        logger.error(`Speech synthesis failed for segment ${i}: ${errorMessage}`, e);
        if (onErrorCallback) {
          onErrorCallback(errorMessage);
        }
        cleanupState(); // Ensure we stop fully on error
        return; // Exit the loop and function
      } finally {
        currentCancelResolver = null;
      }
    } else {
        logger.warn(`No voice setting found for speaker '${segment.speaker}'. Skipping segment.`);
    }
  }
  
  if (!stopFlag) {
    logger.info('Script playback finished naturally.');
    if (onFinishCallback) {
      onFinishCallback();
    }
  }
  
  cleanupState();
}

export function stopPlayback() {
  if (!isPlaying) {
    return;
  }
  logger.info('stopPlayback called.');
  stopFlag = true;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
      logger.info('Cancelling active speech synthesis.');
      window.speechSynthesis.cancel();
  }

  const wasPlaying = isPlaying;
  
  // Call the finish callback immediately to update UI, before cleanup
  if (wasPlaying && onFinishCallback) { 
    logger.info('Stop initiated by user, calling onFinish to reset UI.');
    onFinishCallback();
  }

  cleanupState();
}