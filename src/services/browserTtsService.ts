// File: services/browserTtsService.ts
// PRF-COMPLIANT REVISION 2025-10-12
// Unified with backend TTS integration, resolves redundant voice initialization,
// ensures safe async voice loading across browsers, and improves diagnostic logging.

import type { BrowserVoice } from "../types";
import logger from "./loggingService";

let cachedVoices: BrowserVoice[] = [];
let voicesLoaded = false;

/**
 * Fetches and caches available voices from the browser Speech Synthesis API.
 * Ensures safe, race-free initialization across Chromium, Firefox, and Safari.
 * @returns Promise<BrowserVoice[]> — list of available browser voices
 */
export function getBrowserVoices(): Promise<BrowserVoice[]> {
  return new Promise((resolve, reject) => {
    // --- 1️⃣ Environment check ---
    if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") {
      const msg = "Browser Speech Synthesis API not supported in this environment.";
      logger.error(msg);
      return reject(new Error(msg));
    }

    // --- 2️⃣ Return cached voices if already loaded ---
    if (voicesLoaded && cachedVoices.length > 0) {
      logger.info(`[BrowserTTS] Returning ${cachedVoices.length} cached voices.`);
      return resolve(cachedVoices);
    }

    // --- 3️⃣ Voice loading logic ---
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const v = synth.getVoices();
      if (v.length === 0) {
        logger.warn("[BrowserTTS] No voices returned yet, retrying...");
        return false;
      }

      cachedVoices = v.map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
      }));

      voicesLoaded = true;
      logger.info(`[BrowserTTS] Loaded ${cachedVoices.length} voices.`);
      resolve(cachedVoices);
      return true;
    };

    // --- 4️⃣ Try immediate load, otherwise attach event listener ---
    if (!loadVoices()) {
      synth.onvoiceschanged = () => {
        if (!voicesLoaded) loadVoices();
      };

      // Fallback timeout to avoid indefinite wait (e.g., Firefox bug)
      setTimeout(() => {
        if (!voicesLoaded) {
          if (!loadVoices()) {
            const msg = "[BrowserTTS] Timeout — could not load any browser voices.";
            logger.error(msg);
            reject(new Error(msg));
          }
        }
      }, 1500);
    }
  });
}

/**
 * Speaks text aloud using the browser’s Speech Synthesis API.
 * Safe for sequential playback; clears queued utterances before starting.
 * @param text  — Text to speak
 * @param voiceURI — Target voice URI
 * @param options — rate / pitch / volume parameters
 */
export function browserTextToSpeech(
  text: string,
  voiceURI: string,
  options: { rate?: number; pitch?: number; volume?: number } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;
    if (typeof synth === "undefined") {
      const msg = "Browser Speech Synthesis API not supported.";
      logger.error(msg);
      return reject(new Error(msg));
    }

    const trimmed = text.trim();
    if (!trimmed) {
      logger.debug("[BrowserTTS] Skipping empty or whitespace-only text.");
      return resolve();
    }

    // --- Ensure fresh voice list if not yet loaded ---
    if (!voicesLoaded) {
      logger.info("[BrowserTTS] Voices not loaded yet; attempting to load before playback.");
      return getBrowserVoices()
        .then(() => browserTextToSpeech(text, voiceURI, options))
        .then(resolve)
        .catch(reject);
    }

    const allVoices = synth.getVoices();
    let voice = allVoices.find((v) => v.voiceURI === voiceURI);

    if (!voice && allVoices.length > 0) {
      logger.warn(`[BrowserTTS] Requested voice "${voiceURI}" not found. Using default voice.`);
      voice = allVoices[0];
    }

    if (!voice) {
      const msg = "[BrowserTTS] No valid voices available for synthesis.";
      logger.error(msg);
      return reject(new Error(msg));
    }

    // --- Prepare and configure utterance ---
    const utter = new SpeechSynthesisUtterance(trimmed);
    utter.voice = voice;
    utter.rate = options.rate ?? 1.0;
    utter.pitch = options.pitch ?? 1.0;
    utter.volume = options.volume ?? 1.0;

    // --- Lifecycle logging ---
    utter.onstart = () => {
      logger.info(`[BrowserTTS] Speaking with ${voice.name} (${voice.lang}): "${trimmed.slice(0, 40)}..."`);
    };
    utter.onend = () => {
      logger.info("[BrowserTTS] Speech finished successfully.");
      resolve();
    };
    utter.onerror = (event: SpeechSynthesisErrorEvent) => {
      const errType = event.error || "unknown";
      logger.error(`[BrowserTTS] Speech synthesis error: ${errType}`, event);
      // Resolve to continue pipeline rather than halting playback
      resolve();
    };

    // --- Manage synthesis queue ---
    if (synth.speaking || synth.pending) {
      logger.debug("[BrowserTTS] Canceling existing utterances to prevent overlap.");
      synth.cancel();
    }

    synth.speak(utter);
  });
}
