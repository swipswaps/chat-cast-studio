import React, { useState } from "react";
import type { AnalysisResult, PodcastConfig } from "../types";

interface PodcastSettingsProps {
  analysis: AnalysisResult;
  onConfigSubmit: (config: PodcastConfig) => void;
  hasExistingScript?: boolean;
}

export function PodcastSettings({ analysis, onConfigSubmit, hasExistingScript }: PodcastSettingsProps) {
  const [voice, setVoice] = useState("en");
  const [style, setStyle] = useState("informative");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigSubmit({ voice, style });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 rounded">
      <h2 className="text-lg font-semibold mb-2 text-white">Podcast Settings</h2>
      <div className="space-y-3 text-sm text-gray-300">
        <div>
          <label className="block mb-1">Voice</label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          >
            <option value="en">English (Generic)</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="ja">Japanese</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          >
            <option value="informative">Informative</option>
            <option value="conversational">Conversational</option>
            <option value="narrative">Narrative</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        {hasExistingScript ? "Apply & Preview" : "Generate Script"}
      </button>
    </form>
  );
}
