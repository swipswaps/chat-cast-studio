import type { ScriptSegment, VoiceSetting, PlaybackState } from '../types';
import { browserTextToSpeech } from './browserTtsService';
import logger from './loggingService';

// --- State ---
let state: {
  playbackState: PlaybackState;
  segments: ScriptSegment[];
  voiceMapping: Map<string, VoiceSetting>;
  onSegmentStart: (index: number) => void;
  onFinish: () => void;
  onError: (error: string) => void;
  currentIndex: number;
} | null = null;

let speechPingInterval: number | undefined;

// --- Private Functions ---

function startSpeechPing() {
  if (speechPingInterval) return;
  logger.info('Starting speech synthesis keep-alive ping.');
  speechPingInterval = window.setInterval(() => {
    // Only ping if actively speaking. Prevents resuming a user-initiated pause.
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
    logger.info('Cleaning up audio service state.');
    const wasPlaying = state?.playbackState !== 'stopped';
    
    // Cancel any ongoing speech
    if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) {
        window.speechSynthesis.cancel();
    }
    
    stopSpeechPing();
    
    if (state) {
        if (wasPlaying) {
            state.onFinish();
        }
        state = null;
    }
}

async function playbackLoop() {
    if (!state) return;

    for (let i = state.currentIndex; i < state.segments.length; i++) {
        if (state.playbackState === 'stopped') {
            logger.info(`Playback loop terminated by stop state at segment ${i}.`);
            break;
        }

        // FIX: The while loop was causing a TypeScript error due to incorrect type narrowing across an await.
        // This refactoring fixes the error and also handles the case where stopPlayback() nullifies the state during a pause.
        while (state?.playbackState === 'paused') {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // If stopPlayback() was called, state will be null and we should exit.
        if (!state) {
            return;
        }

        // If state was changed to 'stopped' (e.g., via an error during speech), break the loop.
        if (state.playbackState === 'stopped') {
            logger.info(`Playback loop terminated by stop state after pause at segment ${i}.`);
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
                 // If the state is 'stopped', it means a `cancel()` was issued, and this "error" is expected.
                if (state?.playbackState === 'stopped' && errorMessage.includes('interrupted')) {
                    logger.info(`Speech for segment ${i} was intentionally interrupted.`);
                    break;
                } else {
                    logger.error(`Speech synthesis failed for segment ${i}: ${errorMessage}`, e);
                    if (state) {
                        state.onError(`Speech synthesis failed for segment ${i}: ${errorMessage}`);
                        state.playbackState = 'stopped';
                    }
                    break; 
                }
            }
        } else {
            logger.warn(`No voice setting found for speaker '${segment.speaker}'. Skipping segment.`);
        }
    }

    // FIX: This block prevented the onFinish callback from firing correctly on natural playback completion.
    // Removing it fixes the TS error and a logic bug. cleanup() will now correctly handle the end of playback.
    cleanup();
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
  if (state?.playbackState !== 'stopped') {
    logger.warn('playScript called while another playback is active. Please stop first.');
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
  };
  
  startSpeechPing();
  playbackLoop(); // This runs asynchronously
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

export function stopPlayback(): void {
  if (state?.playbackState !== 'stopped') {
    logger.info('Stopping playback.');
    state.playbackState = 'stopped'; // Set state first
    cleanup();
  }
}