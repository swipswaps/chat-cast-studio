import React from "react";
import type { GeneratedScript, PodcastConfig, AnalysisResult } from "types";

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
      <div className="whitespace-pre-wrap bg-gray-800 p-3 rounded">
        {script.content || "No script content available."}
      </div>
      <p className="text-sm text-gray-500">Voice: {config.voice}</p>
      <button
        onClick={onNewScript}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        Start New Project
      </button>
    </section>
  );
}
