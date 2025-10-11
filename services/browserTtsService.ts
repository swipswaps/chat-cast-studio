import type { BrowserVoice } from '../types';

let voices: BrowserVoice[] = [];

/**
 * Fetches the list of available speech synthesis voices from the browser.
 * @returns A promise that resolves to an array of browser voices.
 */
export function getBrowserVoices(): Promise<BrowserVoice[]> {
  return new Promise((resolve, reject) => {
    if (typeof window.speechSynthesis === 'undefined') {
        return reject(new Error("Browser Speech Synthesis API not supported."));
    }

    // Fix: `getVoices` now returns a boolean to indicate success, allowing for proper conditional checks.
    // The call to `resolve` returns `void`, which cannot be used in a truthiness check.
    const getVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        if (allVoices.length) {
            voices = allVoices.map(v => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }));
            resolve(voices);
            return true;
        }
        return false;
    }
    
    // Fix: The original logic had a bug where it would not resolve the promise if voices were already cached.
    // This now correctly resolves the promise if the `voices` array is already populated.
    if (voices.length > 0) {
      return resolve(voices);
    }
    
    // Attempt to get voices immediately. If successful, `getVoices` will have resolved the promise and we can exit.
    if (getVoices()) {
      return;
    }
    
    window.speechSynthesis.onvoiceschanged = () => {
      getVoices();
    };

    setTimeout(() => {
        if(voices.length === 0) {
             if (!getVoices()) {
                reject(new Error("Could not load browser voices after a timeout."));
             }
        }
    }, 1000);
  });
}


/**
 * Uses the browser's Speech Synthesis API to speak text.
 * @param text The text to speak.
 * @param voiceURI The URI of the voice to use.
 * @returns A promise that resolves when the speech has finished.
 */
export function browserTextToSpeech(text: string, voiceURI: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.speechSynthesis === 'undefined') {
      return reject(new Error("Browser Speech Synthesis API not supported."));
    }
    
    const allVoices = window.speechSynthesis.getVoices();
    let voice = allVoices.find(v => v.voiceURI === voiceURI);

    if (!voice) {
      console.warn(`Voice with URI "${voiceURI}" not found. Using default voice.`);
      // Fallback to the first available voice if the specified one isn't found
      if (allVoices.length > 0) {
        voice = allVoices[0];
      } else {
        return reject(new Error("No browser voices available."));
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(event.error || 'An unknown speech synthesis error occurred.'));

    window.speechSynthesis.speak(utterance);
  });
}