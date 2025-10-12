import type { ScriptSegment, VoiceSetting, PlaybackState } from '../types';
import { browserTextToSpeech } from './browserTtsService';
import logger from './loggingService';

// --- State ---
type ServiceState = {
  playbackState: PlaybackState;
  segments: ScriptSegment[];
  voiceMapping: Map<string, VoiceSetting>;
  onSegmentStart: (index: number) => void;
  onFinish: () => void;
  onError: (error: string) => void;
  currentIndex: number;
  stopResolver: (() => void) | null;
};

let state: ServiceState | null = null;
let speechPingInterval: number | undefined;

// --- Private Functions ---

function startSpeechPing() {
  if (speechPingInterval) return;
  logger.info('Starting speech synthesis keep-alive ping.');
  speechPingInterval = window.setInterval(() => {
    if (state?.playbackState === 'playing' && window.speechSynthesis.speaking) {
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

function cleanup() {
    if (!state) return;
    
    logger.info('Cleaning up audio service state.');
    const wasPlayingOrPaused = state.playbackState === 'playing' || state.playbackState === 'paused';
    
    if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) {
        window.speechSynthesis.cancel();
    }
    
    stopSpeechPing();
    
    if (state.stopResolver) {
        state.stopResolver();
    }
    
    if (wasPlayingOrPaused) {
        state.onFinish();
    }

    state = null;
}

async function playbackLoop() {
    if (!state) return;

    for (let i = state.currentIndex; i < state.segments.length; i++) {
        while (state?.playbackState === 'paused') {
            await new Promise(resolve => setTimeout(resolve, 100));
            // FIX: This comparison could fail with some TypeScript versions due to type narrowing.
            // Changed to break if no longer paused, which covers 'stopped' and 'playing' (resume) states.
            if (state?.playbackState !== 'paused') break;
        }

        if (!state || state.playbackState === 'stopped') {
            logger.info(`Playback loop terminated by stop state at segment ${i}.`);
            break;
        }
        
        state.currentIndex = i;
        const segment = state.segments[i];
        const voiceSetting = state.voiceMapping.get(segment.speaker);
        
        logger.info(`Processing segment ${i}: Speaker '${segment.speaker}'`);
        state.onSegmentStart(i);

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
                const errorMessage = e instanceof Error ? e.message : String(e);
                if (state?.playbackState !== 'playing') {
                    logger.info(`Speech for segment ${i} was intentionally interrupted.`);
                    break;
                } else {
                    logger.error(`Speech synthesis failed for segment ${i}: ${errorMessage}`, e);
                    if (state) {
                        state.onError(`Speech synthesis failed: ${errorMessage}`);
                        state.playbackState = 'stopped';
                    }
                    break;
                }
            }
        } else {
            logger.warn(`No voice setting found for speaker '${segment.speaker}'. Skipping segment.`);
        }
    }

    // Natural end of playback or loop break
    if (state) {
        const wasStopped = state.playbackState === 'stopped';
        cleanup();
        if (wasStopped) {
            logger.info('Loop finished due to stop command.');
        } else {
            logger.info('Script playback finished naturally.');
        }
    }
}


// --- Public API ---

export function playScript(
  segments: ScriptSegment[],
  voiceMapping: Map<string, VoiceSetting>,
  onSegmentStart: (index: number) => void,
  onFinish: () => void,
  onError: (error: string) => void,
  startIndex = 0
): void {
  if (state) {
    logger.error('playScript called while service is active.');
    return;
  }
  
  if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) {
    logger.info('Clearing any previous utterances from the speech queue.');
    window.speechSynthesis.cancel();
  }
  
  logger.info(`Starting script playback with ${segments.length} segments from index ${startIndex}.`);

  state = {
    playbackState: 'playing',
    segments,
    voiceMapping,
    onSegmentStart,
    onFinish,
    onError,
    currentIndex: startIndex,
    stopResolver: null,
  };
  
  startSpeechPing();
  playbackLoop();
}

export function pausePlayback(): void {
    if (state?.playbackState === 'playing') {
        logger.info('Pausing playback.');
        state.playbackState = 'paused';
        window.speechSynthesis.pause();
    }
}

export function resumePlayback(): void {
    if (state?.playbackState === 'paused') {
        logger.info('Resuming playback.');
        state.playbackState = 'playing';
        window.speechSynthesis.resume();
    }
}

export function stopPlayback(): Promise<void> {
  if (!state || state.playbackState === 'stopped') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    logger.info('Requesting playback stop.');
    if (state) {
        state.playbackState = 'stopped';
        state.stopResolver = resolve;
    }
    
    // This will cause the utterance to error with 'interrupted', breaking the loop.
    window.speechSynthesis.cancel();

    // Fallback timer in case cancel() doesn't fire events correctly (a known browser bug)
    setTimeout(() => {
        if (state?.stopResolver) {
            logger.warn('Stop fallback timer triggered.');
            cleanup();
        }
    }, 250);
  });
}
