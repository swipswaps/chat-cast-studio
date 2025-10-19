// File: src/components/PodcastSettings.tsx
// PRF-COMPLIANT FULL VERSION
// Purpose: Manage full podcast configuration, including voice casting and generation preferences.
// This version adds the "Podcast Generation Settings" panel with abstraction level, tone, and summary length controls.

import React, { useEffect, useState } from "react";
import type { PodcastConfig, AnalysisResult } from "../types";

interface PodcastSettingsProps {
  analysis: AnalysisResult;
  onConfigSubmit: (config: PodcastConfig) => void;
  hasExistingScript: boolean;
}

// Define allowed tone and abstraction options for clarity and control
const abstractionLevels = ["overview", "balanced", "in-depth"] as const;
const toneOptions = ["informative", "conversational", "dramatic", "humorous", "neutral"] as const;
const summaryLengths = ["short", "medium", "extended"] as const;

export const PodcastSettings: React.FC<PodcastSettingsProps> = ({
  analysis,
  onConfigSubmit,
  hasExistingScript,
}) => {
  // ---- Primary configuration state ----
  // Includes new generation settings for abstraction, tone, and summary length.
  const [config, setConfig] = useState<PodcastConfig>({
    style: "informative", // backward-compatible key
    technicality: "medium", // legacy key for compatibility
    voiceMapping: new Map(),
    includeMusic: true,
    includeSfx: true,
    abstraction: "balanced", // new key for overview vs. detail
    tone: "informative", // new key for tone style
    summaryLength: "medium", // new key for how long or detailed output should be
  });

  // ---- Voices fetched from backend ----
  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([]);

  // --- Fetch voices from backend at startup ---
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await fetch("http://localhost:3000/voices");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("🎧 [PodcastSettings] Loaded voices:", data);
        setVoices(data);
      } catch (err) {
        // Fallback voices for offline or mock TTS use
        console.error("⚠️ Failed to load voices, using fallback.", err);
        setVoices([
          { name: "Host", lang: "English" },
          { name: "Narrator", lang: "English" },
          { name: "Guest", lang: "English" },
          { name: "Analyst", lang: "English" },
          { name: "Commentator", lang: "English" },
        ]);
      }
    };
    fetchVoices();
  }, []);

  // ---- Voice selection handler ----
  const handleVoiceChange = (speaker: string, voice: string) => {
    const newMapping = new Map(config.voiceMapping);
    newMapping.set(speaker, voice);
    setConfig({ ...config, voiceMapping: newMapping });
  };

  // ---- Generalized update helper for new settings ----
  const handleSettingChange = <K extends keyof PodcastConfig>(
    key: K,
    value: PodcastConfig[K]
  ) => {
    setConfig({ ...config, [key]: value });
  };

  // ---- Submission handler ----
  const handleSubmit = () => {
    console.log("🎙️ [PodcastSettings] Submitting config:", config);
    onConfigSubmit(config);
  };

  // ---- Render ----
  return (
    <div className="bg-dark-card p-4 rounded-md border border-dark-border text-white">
      <h2 className="text-xl font-bold mb-3">Podcast Settings</h2>
      <p className="mb-4">
        Assign a podcast name and a browser or backend voice for each speaker.
      </p>

      {/* --- Voice Casting Section --- */}
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full bg-dark-card border border-dark-border text-white">
          <thead>
            <tr>
              <th className="p-2 text-left border-b border-dark-border">Speaker</th>
              <th className="p-2 text-left border-b border-dark-border">Voice</th>
              <th className="p-2 text-left border-b border-dark-border">Language</th>
            </tr>
          </thead>
          <tbody>
            {analysis.speakers.length === 0 && (
              <tr>
                <td colSpan={3} className="p-2 text-center text-gray-400">
                  No speakers detected yet.
                </td>
              </tr>
            )}
            {analysis.speakers.map((speaker) => (
              <tr key={speaker}>
                <td className="p-2 border-b border-dark-border">{speaker}</td>
                <td className="p-2 border-b border-dark-border">
                  <select
                    value={config.voiceMapping.get(speaker) || ""}
                    onChange={(e) => handleVoiceChange(speaker, e.target.value)}
                    className="bg-dark-input border border-dark-border rounded-md px-2 py-1 text-white"
                  >
                    <option value="">Select a voice...</option>
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border-b border-dark-border">
                  {voices.find((v) => v.name === config.voiceMapping.get(speaker))?.lang || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Podcast Generation Settings Panel --- */}
      <div className="mt-6 bg-dark-panel p-3 rounded-md border border-dark-border">
        <h3 className="text-lg font-semibold mb-2">Podcast Generation Settings</h3>
        <p className="text-gray-400 text-sm mb-3">
          Control the tone, abstraction level, and summary detail for your generated podcast.
        </p>

        {/* Abstraction Level */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Abstraction Level</label>
          <select
            value={config.abstraction}
            onChange={(e) => handleSettingChange("abstraction", e.target.value as any)}
            className="bg-dark-input border border-dark-border rounded-md px-2 py-1 text-white w-full"
          >
            {abstractionLevels.map((level) => (
              <option key={level} value={level}>
                {level === "overview"
                  ? "Overview – Simplified and high-level"
                  : level === "balanced"
                  ? "Balanced – Mix of detail and clarity"
                  : "In-depth – Technical and comprehensive"}
              </option>
            ))}
          </select>
        </div>

        {/* Tone */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Tone</label>
          <select
            value={config.tone}
            onChange={(e) => handleSettingChange("tone", e.target.value as any)}
            className="bg-dark-input border border-dark-border rounded-md px-2 py-1 text-white w-full"
          >
            {toneOptions.map((tone) => (
              <option key={tone} value={tone}>
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Length */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Summary Length</label>
          <select
            value={config.summaryLength}
            onChange={(e) => handleSettingChange("summaryLength", e.target.value as any)}
            className="bg-dark-input border border-dark-border rounded-md px-2 py-1 text-white w-full"
          >
            {summaryLengths.map((length) => (
              <option key={length} value={length}>
                {length === "short"
                  ? "Short – Quick overview (1-2 minutes)"
                  : length === "medium"
                  ? "Medium – Standard summary (3-5 minutes)"
                  : "Extended – Full-length podcast (7+ minutes)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- Music and SFX Toggles --- */}
      <div className="flex flex-col gap-2 my-4">
        <label>
          <input
            type="checkbox"
            checked={config.includeMusic}
            onChange={(e) => setConfig({ ...config, includeMusic: e.target.checked })}
          />{" "}
          Include Intro/Outro Music
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.includeSfx}
            onChange={(e) => setConfig({ ...config, includeSfx: e.target.checked })}
          />{" "}
          Include Sound Effects
        </label>
      </div>

      {/* --- Submit Button --- */}
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
      >
        Save Podcast Configuration
      </button>
    </div>
  );
};
