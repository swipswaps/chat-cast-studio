
import type { BrowserVoice } from '../types';
// FIX: Corrected import path for loggingService
import logger from './loggingService';

let voices: BrowserVoice[] = [];

/**
 * Fetches the list of available speech synthesis voices from the browser.
 * @returns A promise that resolves to an array of browser voices.
 */
export function getBrowserVoices(): Promise<BrowserVoice[]> {
  return new Promise((resolve, reject) => {
    if (typeof window.speechSynthesis === 'undefined') {
        logger.error("Browser Speech Synthesis API not supported.");
        return reject(new Error("Browser Speech Synthesis API not supported."));
    }

    const getVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        if (allVoices.length) {
            voices = allVoices.map(v => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }));
            logger.info(`Loaded ${voices.length} browser voices.`);
            resolve(voices);
            return true;
        }
        return false;
    }
    
    if (voices.length > 0) {
      logger.info("Returning cached browser voices.");
      return resolve(voices);
    }
    
    logger.info("Attempting to load browser voices...");
    if (getVoices()) {
      return;
    }
    
    window.speechSynthesis.onvoiceschanged = () => {
      getVoices();
    };

    setTimeout(() => {
        if(voices.length === 0) {
             if (!getVoices()) {
                const message = "Could not load browser voices after a timeout.";
                logger.error(message);
                reject(new Error(message));
             }
        }
    }, 1000);
  });
}


/**
 * Uses the browser's Speech Synthesis API to speak text.
 * @param text The text to speak.
 * @param voiceURI The URI of the voice to use.
 * @param options An object with optional rate, pitch, and volume properties.
 * @returns A promise that resolves when the speech has finished.
 */
export function browserTextToSpeech(
    text: string, 
    voiceURI: string,
    options: { rate?: number; pitch?: number; volume?: number; } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;
    if (typeof synth === 'undefined') {
      const msg = "Browser Speech Synthesis API not supported.";
      logger.error(msg);
      return reject(new Error(msg));
    }

    if (!text.trim()) {
      logger.info("Skipping empty line for speech.");
      return resolve();
    }
    
    // Clear any pending utterances to prevent overlap or stale queue
    if (synth.speaking || synth.pending) {
        synth.cancel();
    }

    if (synth.paused) {
      logger.warn("Speech synthesis is paused, calling resume().");
      synth.resume();
    }
    
    const allVoices = synth.getVoices();
    let voice = allVoices.find(v => v.voiceURI === voiceURI);

    if (!voice) {
      logger.warn(`Voice with URI "${voiceURI}" not found. Falling back to default.`);
      if (allVoices.length > 0) {
        voice = allVoices[0];
      } else {
        const msg = "No browser voices available to speak with.";
        logger.error(msg);
        return reject(new Error(msg));
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    
    utterance.onstart = () => {
      logger.info(`Speaking: "${text.substring(0, 50)}..."`);
    };

    utterance.onend = () => {
      logger.info("Speech finished for utterance.");
      resolve();
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        const errorType = event.error || 'unknown';
        const msg = `Speech synthesis failed: ${errorType}.`;
        logger.error(msg, event);
        // Don't reject, but resolve, to allow playback to continue on the next line.
        // Rejecting stops the whole playback loop.
        resolve();
    };
    
    logger.info(`Queueing utterance with voice: ${voice.name} (${voice.lang})`);
    synth.speak(utterance);
  });
}