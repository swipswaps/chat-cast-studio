// File: components/PodcastSettings.tsx
// PRF-COMPLIANT FULL VERSION
// Integrates browser + backend voice selection using VoiceSelector and tts.ts
// Tested with Chat Cast Studio’s architecture and compatible with existing PodcastConfig flow.

import React, { useState, useEffect, useMemo } from "react";
import type {
  PodcastConfig,
  AnalysisResult,
  BrowserVoice,
  VoiceSetting,
} from "../types";
import { PODCAST_STYLES, TECHNICALITY_LEVELS } from "../constants";
import { getBrowserVoices } from "../services/browserTtsService";
import { fetchBackendVoices } from "../services/tts";
import { SparklesIcon, SlidersHorizontalIcon, MicIcon } from "./icons";

interface PodcastSettingsProps {
  analysis: AnalysisResult;
  onConfigSubmit: (config: PodcastConfig) => void;
  hasExistingScript?: boolean;
}

const DEFAULT_PODCAST_NAMES = [
  "Host",
  "Guest",
  "Narrator",
  "Analyst",
  "Expert",
];

export const PodcastSettings: React.FC<PodcastSettingsProps> = ({
  analysis,
  onConfigSubmit,
  hasExistingScript = false,
}) => {
  const [styleId, setStyleId] = useState(PODCAST_STYLES[0].id);
  const [technicalityId, setTechnicalityId] = useState(
    TECHNICALITY_LEVELS[1].id
  );
  const [includeMusic, setIncludeMusic] = useState(true);
  const [includeSfx, setIncludeSfx] = useState(true);
  const [voiceMapping, setVoiceMapping] = useState<
    Map<string, VoiceSetting>
  >(new Map());
  const [browserVoices, setBrowserVoices] = useState<BrowserVoice[]>([]);
  const [backendVoices, setBackendVoices] = useState<
    { name: string; lang: string }[]
  >([]);
  const [voicesLoading, setVoicesLoading] = useState(true);

  // Initialize mapping from analysis
  useEffect(() => {
    const initialMapping = new Map<string, VoiceSetting>();
    analysis.speakers.forEach((speaker, index) => {
      const defaultName =
        DEFAULT_PODCAST_NAMES.find(
          (name) => name.toLowerCase() === speaker.toLowerCase()
        ) ||
        DEFAULT_PODCAST_NAMES[index] ||
        `Speaker ${index + 1}`;
      initialMapping.set(speaker, {
        podcastName: defaultName,
        voiceId: "",
      });
    });
    setVoiceMapping(initialMapping);
  }, [analysis.speakers]);

  // Load browser voices
  useEffect(() => {
    async function fetchBrowser() {
      setVoicesLoading(true);
      try {
        const voices = await getBrowserVoices();
        setBrowserVoices(voices);
        setVoiceMapping((prev) => {
          const newMapping = new Map<string, VoiceSetting>(prev);
          let i = 0;
          newMapping.forEach((setting, key) => {
            if (!setting.voiceId && voices.length > 0) {
              const defaultVoice = voices[i % voices.length];
              newMapping.set(key, {
                ...setting,
                voiceId: defaultVoice.voiceURI,
              });
              i++;
            }
          });
          return newMapping;
        });
      } catch (err) {
        console.error("Failed to load browser voices:", err);
      } finally {
        setVoicesLoading(false);
      }
    }
    fetchBrowser();
  }, []);

  // Load backend voices
  useEffect(() => {
    fetchBackendVoices()
      .then((data) => setBackendVoices(data))
      .catch(() => setBackendVoices([]));
  }, []);

  // Handle per-speaker setting change
  const handleVoiceSettingChange = (
    originalRole: string,
    field: keyof VoiceSetting,
    value: string
  ) => {
    setVoiceMapping((prev) => {
      const newMapping = new Map<string, VoiceSetting>(prev);
      const current = newMapping.get(originalRole);
      if (current) {
        const updated = { ...current, [field]: value };
        newMapping.set(originalRole, updated);
      }
      return newMapping;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const style = PODCAST_STYLES.find((s) => s.id === styleId);
    const technicality = TECHNICALITY_LEVELS.find(
      (t) => t.id === technicalityId
    );
    if (style && technicality) {
      onConfigSubmit({
        style,
        technicality,
        voiceMapping,
        includeMusic,
        includeSfx,
      });
    }
  };

  const selectedStyle = useMemo(
    () => PODCAST_STYLES.find((s) => s.id === styleId),
    [styleId]
  );
  const selectedTechLevel = useMemo(
    () => TECHNICALITY_LEVELS.find((t) => t.id === technicalityId),
    [technicalityId]
  );

  // Unified voice list
  const allVoices = [
    ...browserVoices.map((v) => ({
      id: v.voiceURI,
      name: v.name,
      lang: v.lang,
      source: "browser",
    })),
    ...backendVoices.map((v) => ({
      id: v.name,
      name: v.name,
      lang: v.lang,
      source: "backend",
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* --- Style & Technicality --- */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <SlidersHorizontalIcon className="w-6 h-6 mr-3 text-brand-accent" />
          Podcast Settings
        </h2>

        {hasExistingScript ? (
          <div className="bg-dark-bg border border-dark-border rounded-md p-4">
            <h3 className="font-semibold text-lg text-white">Script Style</h3>
            <p className="text-dark-text-secondary mt-1">
              Style and Technicality settings are embedded in the loaded
              script and cannot be changed. To generate a new script with
              different settings, please start over with the original chat
              log.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label
                htmlFor="style"
                className="block text-lg font-semibold mb-2"
              >
                Podcast Style
              </label>
              <select
                id="style"
                value={styleId}
                onChange={(e) => setStyleId(e.target.value)}
                className="w-full p-3 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary focus:outline-none"
              >
                {PODCAST_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-dark-text-secondary mt-2">
                {selectedStyle?.description}
              </p>
            </div>

            <div>
              <label
                htmlFor="technicality"
                className="block text-lg font-semibold mb-2"
              >
                Technicality Level
              </label>
              <select
                id="technicality"
                value={technicalityId}
                onChange={(e) => setTechnicalityId(e.target.value)}
                className="w-full p-3 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary focus:outline-none"
              >
                {TECHNICALITY_LEVELS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-dark-text-secondary mt-2">
                {selectedTechLevel?.description}
              </p>
            </div>
          </>
        )}
      </div>

      {/* --- Voice Casting --- */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <MicIcon className="w-6 h-6 mr-3 text-brand-accent" />
          Voice Casting
        </h2>
        <p className="text-dark-text-secondary mb-4">
          Assign a podcast name and a browser or backend voice for each
          speaker.
        </p>
        {voicesLoading && <p>Loading voices...</p>}
        <div className="space-y-4">
          {Array.from(voiceMapping.entries()).map(
            ([originalRole, setting]) => (
              <div
                key={originalRole}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dark-bg rounded-md border border-dark-border"
              >
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary">
                    Original Speaker
                  </label>
                  <p className="font-bold capitalize">{originalRole}</p>
                </div>
                <div>
                  <label
                    htmlFor={`podcastName-${originalRole}`}
                    className="block text-sm font-medium text-dark-text-secondary"
                  >
                    Podcast Name
                  </label>
                  <input
                    id={`podcastName-${originalRole}`}
                    type="text"
                    value={setting.podcastName}
                    onChange={(e) =>
                      handleVoiceSettingChange(
                        originalRole,
                        "podcastName",
                        e.target.value
                      )
                    }
                    className="w-full p-2 bg-dark-card border border-dark-border rounded-md"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`voice-${originalRole}`}
                    className="block text-sm font-medium text-dark-text-secondary"
                  >
                    Voice
                  </label>
                  <select
                    id={`voice-${originalRole}`}
                    value={setting.voiceId}
                    onChange={(e) =>
                      handleVoiceSettingChange(
                        originalRole,
                        "voiceId",
                        e.target.value
                      )
                    }
                    className="w-full p-2 bg-dark-card border border-dark-border rounded-md"
                    disabled={voicesLoading || allVoices.length === 0}
                  >
                    {allVoices.length > 0 ? (
                      allVoices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.lang}) [{v.source}]
                        </option>
                      ))
                    ) : (
                      <option>No voices available</option>
                    )}
                  </select>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* --- Production Details --- */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Production Details</h2>
        {hasExistingScript ? (
          <div className="bg-dark-bg border border-dark-border rounded-md p-4">
            <h3 className="font-semibold text-lg text-white">Music & SFX</h3>
            <p className="text-dark-text-secondary mt-1">
              Music and sound effect cues are part of the loaded script. To
              generate a version without them, please start over with the
              original chat log.
            </p>
          </div>
        ) : (
          <div className="flex items-center space-x-8">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeMusic}
                onChange={(e) => setIncludeMusic(e.target.checked)}
                className="form-checkbox h-5 w-5 text-brand-secondary bg-dark-bg border-dark-border rounded focus:ring-brand-secondary"
              />
              <span className="ml-2 text-white">
                Include Background Music
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeSfx}
                onChange={(e) => setIncludeSfx(e.target.checked)}
                className="form-checkbox h-5 w-5 text-brand-secondary bg-dark-bg border-dark-border rounded focus:ring-brand-secondary"
              />
              <span className="ml-2 text-white">Include Sound Effects</span>
            </label>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-all duration-300"
      >
        <SparklesIcon className="w-6 h-6 mr-2" />
        {hasExistingScript
          ? "Apply & Preview Script"
          : "Generate Podcast Script"}
      </button>
    </form>
  );
};
