// File: src/components/ScriptPreview.tsx
// PRF-COMPLIANT FIXED VERSION
// Purpose: Display generated podcast script preview with voice info.
// Correctly iterates over GeneratedScript.sections instead of using script.content.

import React from "react";
import type { GeneratedScript, PodcastConfig, AnalysisResult } from "../types";

interface ScriptPreviewProps {
  script: GeneratedScript;
  config: PodcastConfig;
  analysis: AnalysisResult;
  onNewScript: () => void;
}

export function ScriptPreview({ script, config, analysis, onNewScript }: ScriptPreviewProps) {
  return (
    <section className="p-4 bg-gray-900 rounded-lg text-gray-200 space-y-4">
      <h2 className="text-xl font-semibold">Podcast Script Preview</h2>

      {/* Script content */}
      <div className="whitespace-pre-wrap bg-gray-800 p-3 rounded space-y-2">
        {script.sections && script.sections.length > 0 ? (
          script.sections.map((section, idx) => (
            <div key={idx}>
              <strong>{section.speaker}:</strong> {section.text}
            </div>
          ))
        ) : (
          <div>No script content available.</div>
        )}
      </div>

      {/* Display voice info */}
      <p className="text-sm text-gray-500">
        Voice mapping:{" "}
        {config.voiceMapping
          ? Array.from(config.voiceMapping.entries())
              .map(([role, v]) => `${role} → ${v.voiceId || "N/A"}`)
              .join(", ")
          : "N/A"}
      </p>

      {/* Button to start new project */}
      <button
        onClick={onNewScript}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        Start New Project
      </button>
    </section>
  );
}
