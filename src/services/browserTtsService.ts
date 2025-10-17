import type { BrowserVoice } from "../types";
import logger from "./loggingService";

let cachedVoices: BrowserVoice[] = [];
let voicesLoaded = false;

export function getBrowserVoices(): Promise<BrowserVoice[]> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") {
      const msg = "Browser Speech Synthesis API not supported in this environment.";
      logger.error(msg);
      return reject(new Error(msg));
    }

    if (voicesLoaded && cachedVoices.length > 0) {
      logger.info(`[BrowserTTS] Returning ${cachedVoices.length} cached voices.`);
      return resolve(cachedVoices);
    }

    const synth = window.speechSynthesis;

    const loadVoices = (): boolean => {
      const v = synth.getVoices();
      if (v.length === 0) return false;

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

    if (!loadVoices()) {
      synth.onvoiceschanged = () => {
        if (!voicesLoaded) loadVoices();
      };

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
    if (!trimmed) return resolve();

    if (!voicesLoaded) {
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

    if (!voice) return reject(new Error("[BrowserTTS] No valid voices available for synthesis."));

    const utter = new SpeechSynthesisUtterance(trimmed);
    utter.voice = voice;
    utter.rate = options.rate ?? 1.0;
    utter.pitch = options.pitch ?? 1.0;
    utter.volume = options.volume ?? 1.0;

    utter.onstart = () => {
      logger.info(`[BrowserTTS] Speaking with ${voice?.name} (${voice?.lang}): "${trimmed.slice(0, 40)}..."`);
    };
    utter.onend = () => resolve();
    utter.onerror = (event) => {
      logger.error(`[BrowserTTS] Speech synthesis error: ${event.error || "unknown"}`, event);
      resolve();
    };

    if (synth.speaking || synth.pending) synth.cancel();
    synth.speak(utter);
  });
}
