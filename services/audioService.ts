import type { ScriptSegment, VoiceSetting } from '../types';
import { browserTextToSpeech } from './browserTtsService';
import logger from './loggingService';

let playbackState: 'playing' | 'paused' | 'stopped' = 'stopped';
let stopRequest = false;
let onSegmentStartCallback: ((index: number) => boolean) | null = null;
let onFinishCallback: (() => void) | null = null;
let onErrorCallback: ((error: string) => void) | null = null;
let stopPromiseResolver: (() => void) | null = null;
let pausePromiseResolver: (() => void) | null = null;
let resumePromiseResolver: (() => void) | null = null;
let speechPingInterval: number | undefined;

function startSpeechPing() {
  // This is a workaround for a Chrome bug where the speech synthesis engine can go silent.
  if (speechPingInterval) return;
  logger.info('Starting speech synthesis keep-alive ping.');
  speechPingInterval = window.setInterval(() => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }
  }, 12000);
}

function stopSpeechPing() {
  if (speechPingInterval) {
    logger.info('Stopping speech synthesis keep-alive ping.');
    window.clearInterval(speechPingInterval);
    speechPingInterval = undefined;
  }
}

function cleanupState(naturalFinish: boolean) {
    if (playbackState === 'stopped' && !stopRequest) return; // Already cleaned up
    
    logger.info('Cleaning up audio service state.');
    
    if (onFinishCallback) {
        if (naturalFinish) logger.info('Script playback finished naturally.');
        onFinishCallback();
    }

    playbackState = 'stopped';
    stopRequest = false;
    stopSpeechPing();
    
    if (stopPromiseResolver) {
        stopPromiseResolver();
    }

    onSegmentStartCallback = null;
    onFinishCallback = null;
    onErrorCallback = null;
    stopPromiseResolver = null;
    pausePromiseResolver = null;
    resumePromiseResolver = null;
}

export async function playScript(
  segments: ScriptSegment[],
  voiceMapping: Map<string, VoiceSetting>,
  onSegmentStart: (index: number) => boolean,
  onFinish: () => void,
  onError: (error: string) => void,
  startIndex = 0
): Promise<void> {
  if (playbackState !== 'stopped') {
    logger.warn('playScript called while not stopped. Stopping previous playback first.');
    await stopPlayback();
  }
  
  if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) {
    logger.info('Clearing any previous utterances from the speech queue.');
    window.speechSynthesis.cancel();
  }
  
  logger.info(`Starting script playback with ${segments.length} segments from index ${startIndex}.`);
  playbackState = 'playing';
  stopRequest = false;
  onSegmentStartCallback = onSegmentStart;
  onFinishCallback = onFinish;
  onErrorCallback = onError;
  startSpeechPing();

  for (let i = startIndex; i < segments.length; i++) {
    if (stopRequest) {
      logger.info(`Playback loop terminated by stop request at segment ${i}.`);
      break;
    }

    // FIX: A TypeScript control-flow issue could incorrectly narrow the type of `playbackState`,
    // causing a compile error on this line. This loop correctly polls for the 'paused' state,
    // which is set by an external UI event.
    while (playbackState === 'paused') {
      await new Promise(resolve => setTimeout(resolve, 100));
      if(stopRequest) {
         logger.info(`Playback loop terminated by stop request while paused at segment ${i}.`);
         cleanupState(false);
         return;
      }
    }

    const segment = segments[i];
    const voiceSetting = voiceMapping.get(segment.speaker);
    logger.info(`Processing segment ${i}: Speaker '${segment.speaker}'`);

    onSegmentStartCallback?.(i);

    if (voiceSetting?.voiceId) {
      const textToSpeak = segment.editedLine ?? segment.line.replace(/`/g, '');
      const playbackOptions = {
        rate: segment.rate,
        pitch: segment.pitch,
        volume: segment.volume,
      };
      
      try {
        await browserTextToSpeech(textToSpeak, voiceSetting.voiceId, playbackOptions);
      } catch (e) {
        // If a stop was requested, the 'interrupted' error is expected and should not be treated as a real error.
        if (stopRequest) {
          logger.info(`Speech for segment ${i} was intentionally interrupted.`);
          break; // Exit the loop gracefully
        } else {
            const errorMessage = e instanceof Error ? e.message : String(e);
            logger.error(`Speech synthesis failed for segment ${i}: ${errorMessage}`, e);
            onErrorCallback?.(`Speech synthesis failed for segment ${i}: ${errorMessage}`);
            cleanupState(false);
            return; 
        }
      }
    } else {
        logger.warn(`No voice setting found for speaker '${segment.speaker}'. Skipping segment.`);
    }
  }
  
  cleanupState(!stopRequest);
}

export function pausePlayback(): Promise<void> {
    return new Promise(resolve => {
        if (playbackState === 'playing') {
            logger.info('Pausing playback.');
            pausePromiseResolver = resolve;
            playbackState = 'paused';
            window.speechSynthesis.pause();
            // In some browsers, pause doesn't have a callback. We resolve after a short delay.
            setTimeout(() => {
                if (pausePromiseResolver) pausePromiseResolver();
            }, 50);
        } else {
            resolve();
        }
    });
}

export function resumePlayback(): Promise<void> {
    return new Promise(resolve => {
        if (playbackState === 'paused') {
            logger.info('Resuming playback.');
            resumePromiseResolver = resolve;
            playbackState = 'playing';
            window.speechSynthesis.resume();
             setTimeout(() => {
                if (resumePromiseResolver) resumePromiseResolver();
            }, 50);
        } else {
            resolve();
        }
    });
}

export function stopPlayback(): Promise<void> {
  if (playbackState === 'stopped' && !stopRequest) {
    return Promise.resolve();
  }
  
  logger.info('stopPlayback called.');
  
  return new Promise((resolve) => {
    stopPromiseResolver = resolve;
    stopRequest = true;

    if (playbackState === 'paused') {
      window.speechSynthesis.resume(); // Must resume to cancel
    }
    
    playbackState = 'stopped';
    window.speechSynthesis.cancel();
    
    // The main loop will detect stopRequest and call cleanup.
    // This timeout is a fallback to ensure resolution even if the loop is stuck.
    setTimeout(() => {
        if (!stopPromiseResolver) return;
        logger.info('Force-resolving a hanging playback promise.');
        cleanupState(false);
    }, 150);
  });
}
