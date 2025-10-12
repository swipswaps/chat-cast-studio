import type { ScriptSegment, VoiceSetting } from '../types';
import { browserTextToSpeech } from './browserTtsService';
import logger from './loggingService';

let isPlaying = false;
let stopFlag = false;
let onSegmentStartCallback: ((index: number) => boolean) | null = null;
let onFinishCallback: (() => void) | null = null;
let onErrorCallback: ((error: string) => void) | null = null;
let currentCancelResolver: (() => void) | null = null;
let stopPromiseResolver: (() => void) | null = null;

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

function cleanupState(wasStoppedByUser: boolean) {
    logger.info('Cleaning up audio service state.');
    
    // Only call the finish callback if one is attached.
    if (onFinishCallback) {
        if(wasStoppedByUser) {
            logger.info('Stop initiated by user, calling onFinish to reset UI.');
        } else {
             logger.info('Script playback finished naturally.');
        }
        onFinishCallback();
    }

    isPlaying = false;
    stopFlag = false; // Reset for the next play
    stopSpeechPing();
    
    // Unblock any pending playback promise
    if (currentCancelResolver) {
        logger.warn('Force-resolving a hanging playback promise.');
        currentCancelResolver();
    }
    
    // Unblock any pending stop promise
    if (stopPromiseResolver) {
        stopPromiseResolver();
    }

    currentCancelResolver = null;
    onSegmentStartCallback = null;
    onFinishCallback = null;
    onErrorCallback = null;
    stopPromiseResolver = null;
}

export async function playScript(
  segments: ScriptSegment[],
  voiceMapping: Map<string, VoiceSetting>,
  onSegmentStart: (index: number) => boolean,
  onFinish: () => void,
  onError: (error: string) => void,
  startIndex = 0
) {
  if (isPlaying) {
    logger.warn('playScript called while already playing. Awaiting stop...');
    // Don't trigger the onFinish callback, as a new playback is starting immediately.
    await stopPlayback(false);
  }
  
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    logger.info('Clearing any previous utterances from the speech queue.');
    window.speechSynthesis.cancel();
  }
  
  logger.info(`Starting script playback with ${segments.length} segments from index ${startIndex}.`);
  isPlaying = true;
  stopFlag = false; // Ensure stop flag is reset before starting
  onSegmentStartCallback = onSegmentStart;
  onFinishCallback = onFinish;
  onErrorCallback = onError;
  startSpeechPing();

  for (let i = startIndex; i < segments.length; i++) {
    if (stopFlag) {
      logger.info(`Playback stopped at segment ${i}.`);
      cleanupState(true);
      return;
    }

    const segment = segments[i];
    const voiceSetting = voiceMapping.get(segment.speaker);
    logger.info(`Processing segment ${i}: Speaker '${segment.speaker}'`);

    if (onSegmentStartCallback && !onSegmentStartCallback(i)) {
      logger.info(`onSegmentStart callback returned false. Stopping playback.`);
      cleanupState(true);
      return;
    }

    if (voiceSetting?.voiceId) {
      const textToSpeak = segment.editedLine ?? segment.line.replace(/`/g, '');
      const playbackOptions = {
        rate: segment.rate,
        pitch: segment.pitch,
        volume: segment.volume,
      };
      const playbackPromise = browserTextToSpeech(textToSpeak, voiceSetting.voiceId, playbackOptions);
      const cancelPromise = new Promise<void>(resolve => {
        currentCancelResolver = resolve;
      });

      try {
        await Promise.race([playbackPromise, cancelPromise]);
      } catch (e) {
        if (stopFlag) {
          // This is an expected "interrupted" error from stopPlayback cancelling the synth.
          logger.info(`Speech for segment ${i} was interrupted by stop request.`);
          cleanupState(true);
          return;
        }

        let errorMessage = 'An unknown playback error occurred.';
        if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'string') {
            errorMessage = e;
        } else {
            errorMessage = JSON.stringify(e);
        }
        logger.error(`Speech synthesis failed for segment ${i}: ${errorMessage}`, e);
        if (onErrorCallback) {
          onErrorCallback(errorMessage);
        }
        cleanupState(false); // Ensure we stop fully on error
        return; // Exit the loop and function
      } finally {
        currentCancelResolver = null;
      }
    } else {
        logger.warn(`No voice setting found for speaker '${segment.speaker}'. Skipping segment.`);
    }
  }
  
  if (!stopFlag) {
    cleanupState(false);
  }
}


export function stopPlayback(shouldCallback = true): Promise<void> {
  if (!isPlaying) {
    return Promise.resolve();
  }
  
  logger.info('stopPlayback called.');
  
  return new Promise((resolve) => {
    stopPromiseResolver = resolve;
    
    // This is the signal for the main loop to stop.
    stopFlag = true;

    if (!shouldCallback) {
        onFinishCallback = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
        logger.info('Cancelling active speech synthesis.');
        window.speechSynthesis.cancel();
    }
    
    // The cancel() call above will cause the awaited browserTextToSpeech promise to reject,
    // which is caught in the main loop and triggers the cleanup, which then resolves this promise.
    // We also resolve the current cancel promise as a fallback.
    if (currentCancelResolver) {
        currentCancelResolver();
    }
  });
}