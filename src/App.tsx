import React, { useState } from 'react';
import { PodcastSettings } from './components/PodcastSettings';
import { AnalysisSummary } from './components/AnalysisSummary';
import type { PodcastConfig, AnalysisResult, GeneratedScript, ChatMessage } from './types';
import { parseTextContent } from './services/parserService';
import { analyzeChat, analyzeScript } from './services/analysisService';

const defaultConfig: PodcastConfig = {
  voice: 'Default',
  style: 'informative',
};

const App: React.FC = () => {
  const [config, setConfig] = useState<PodcastConfig>(defaultConfig);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await parseTextContent(await file.text());
      if (processed.messages) {
        setChatMessages(processed.messages);
        setAnalysis(analyzeChat(processed.messages));
      } else if (processed.script) {
        setScript(processed.script);
        setAnalysis(analyzeScript(processed.script));
      }
    } catch (err) {
      console.error('Failed to parse file', err);
    }
  };

  return (
    <div className="app">
      <h1>ChatCast Studio</h1>
      <PodcastSettings config={config} onChange={setConfig} />
      <input type="file" onChange={handleFileUpload} />
      {analysis && <AnalysisSummary analysis={analysis} />}
      {script && (
        <div>
          <h2>Generated Script: {script.title || 'Untitled'}</h2>
          <pre>{script.segments.map(s => `${s.speaker}: ${s.line}`).join('\n')}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
