
import { browserTextToSpeech } from './browserTtsService';
import type { ScriptSegment, VoiceSetting, PlaybackState } from "../types";
import logger from './loggingService';

type AudioServiceCallbacks = {
  onStateChange: (state: PlaybackState) => void;
  onSegmentChange: (index: number | null) => void;
};

class AudioService {
  private script: ScriptSegment[] = [];
  private voiceMapping: Map<string, VoiceSetting> = new Map();
  private playbackState: PlaybackState = 'stopped';
  private currentSegmentIndex: number | null = null;
  private stopRequested = false;
  private callbacks: AudioServiceCallbacks | null = null;
  
  init(callbacks: AudioServiceCallbacks) {
    this.callbacks = callbacks;
    this.stop(); // Ensure initial state
  }

  loadScript(script: ScriptSegment[], voiceMapping: Map<string, VoiceSetting>) {
    this.script = script;
    this.voiceMapping = voiceMapping;
    this.stop();
  }
  
  private setState(state: PlaybackState) {
    if (this.playbackState === state) return;
    this.playbackState = state;
    this.callbacks?.onStateChange(state);
    logger.info(`Playback state changed to: ${state}`);
  }

  private setCurrentSegment(index: number | null) {
    if (this.currentSegmentIndex === index) return;
    this.currentSegmentIndex = index;
    this.callbacks?.onSegmentChange(index);
  }

  async play(startIndex?: number) {
    if (this.playbackState === 'playing') {
      logger.warn("Play command issued while already playing.");
      return;
    }

    if (this.script.length === 0) {
      logger.warn("No script loaded to play.");
      return;
    }

    this.stopRequested = false;
    
    // Determine starting point
    let start = 0;
    if (startIndex !== undefined) {
      start = startIndex;
    } else if (this.currentSegmentIndex !== null && this.playbackState === 'paused') {
      start = this.currentSegmentIndex;
    }
    
    this.setState('playing');

    for (let i = start; i < this.script.length; i++) {
      if (this.stopRequested) {
        // If stop was requested for a pause, maintain current index
        if (this.playbackState !== 'paused') {
          this.setCurrentSegment(null);
        }
        break;
      }

      this.setCurrentSegment(i);
      const segment = this.script[i];
      const voiceSetting = this.voiceMapping.get(segment.speaker);

      if (!voiceSetting || !voiceSetting.voiceId) {
        logger.warn(`No voice configured for speaker "${segment.speaker}". Skipping segment.`);
        continue;
      }
      
      const textToSpeak = segment.editedLine ?? segment.line;
      if (!textToSpeak.trim()) {
          logger.info("Skipping empty segment.");
          continue;
      }

      try {
        await browserTextToSpeech(textToSpeak, voiceSetting.voiceId, {
          rate: segment.rate,
          pitch: segment.pitch,
          volume: segment.volume,
        });
      } catch (error) {
        logger.error(`Error during speech synthesis for segment ${i}`, error);
        this.stop(); // Full stop on error
        return;
      }
    }

    // If loop finished without being stopped, it's the end.
    if (!this.stopRequested) {
      this.stop();
    }
  }

  pause() {
    if (this.playbackState !== 'playing') return;
    this.stopRequested = true; 
    window.speechSynthesis.cancel();
    this.setState('paused');
  }
  
  stop() {
    this.stopRequested = true;
    window.speechSynthesis.cancel();
    this.setCurrentSegment(null);
    this.setState('stopped');
  }

  seek(index: number) {
      const wasPlaying = this.playbackState === 'playing';
      this.stop(); // Full stop clears synth queue and state
      if (index >= 0 && index < this.script.length) {
          if (wasPlaying) {
              // Use a timeout to ensure the synth queue is fully cleared before starting again
              setTimeout(() => this.play(index), 100);
          } else {
              this.setCurrentSegment(index);
              this.setState('paused'); // Stay paused at new location
          }
      }
  }
}

const audioService = new AudioService();
export default audioService;
