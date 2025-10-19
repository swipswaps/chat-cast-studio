// File: src/components/PodcastSettings.tsx
// PRF-COMPLIANT FULL VERSION
// Purpose: Display and manage podcast configuration and voice casting options.
// Fetches voice list from backend dynamically and allows per-speaker voice selection.

import React, { useEffect, useState } from "react";
import type { PodcastConfig, AnalysisResult } from "../types";

interface PodcastSettingsProps {
  analysis: AnalysisResult;
  onConfigSubmit: (config: PodcastConfig) => void;
  hasExistingScript: boolean;
}

export const PodcastSettings: React.FC<PodcastSettingsProps> = ({
  analysis,
  onConfigSubmit,
  hasExistingScript,
}) => {
  const [config, setConfig] = useState<PodcastConfig>({
    style: "informative",
    technicality: "medium",
    voiceMapping: new Map(),
    includeMusic: true,
    includeSfx: true,
  });

  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([]);

  // --- Fetch voices from backend ---
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await fetch("http://localhost:3000/voices");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("🎧 [PodcastSettings] Loaded voices:", data);
        setVoices(data);
      } catch (err) {
        console.error("⚠️ Failed to load voices, using fallback.", err);
        setVoices([
          { name: "Host", lang: "English" },
          { name: "Narrator", lang: "English" },
          { name: "Guest", lang: "English" },
        ]);
      }
    };
    fetchVoices();
  }, []);

  const handleVoiceChange = (speaker: string, voice: string) => {
    const newMapping = new Map(config.voiceMapping);
    newMapping.set(speaker, voice);
    setConfig({ ...config, voiceMapping: newMapping });
  };

  const handleSubmit = () => {
    console.log("🎙️ [PodcastSettings] Submitting config:", config);
    onConfigSubmit(config);
  };

  return (
    <div className="bg-dark-card p-4 rounded-md border border-dark-border text-white">
      <h2 className="text-xl font-bold mb-3">Podcast Settings</h2>
      <p className="mb-4">
        Assign a podcast name and a browser or backend voice for each speaker.
      </p>

      {/* Voice casting table */}
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

      {/* Additional podcast options */}
      <div className="flex flex-col gap-2 mb-4">
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

      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
      >
        Save Podcast Configuration
      </button>
    </div>
  );
};
