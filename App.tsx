// File: src/App.tsx
// PRF-COMPLIANT FULL VERSION
// Purpose: Main entry point for ChatCast Studio app with full integration
// of Podcast Generation Settings (tone, abstraction level, summary length).
// Fixes white screen by aligning PodcastSettings props and ensuring safe async handling.

import React, { useState } from 'react';
import PodcastSettings from './components/PodcastSettings'; // ✅ FIX: default export
import { AnalysisSummary } from './components/AnalysisSummary';
import { ScriptPreview } from './components/ScriptPreview';
import { Loader } from './components/Loader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FileUpload } from './components/FileUpload';
import type { PodcastConfig, AnalysisResult, GeneratedScript, ChatMessage } from './types';
import { parseTextContent } from './services/parserService';
import { analyzeChat, analyzeScript } from './services/analysisService';
import { generateScriptFromChat } from './services/geminiService';

const defaultConfig: PodcastConfig = {
  style: 'informative',
  technicality: 'medium',
  voiceMapping: new Map(),
  includeMusic: true,
  includeSfx: true,
  // Added for generation tuning:
  abstractionLevel: 'high',
  tone: 'informative',
  summaryLength: 'medium',
};

export const App: React.FC = () => {
  const [config, setConfig] = useState<PodcastConfig>(defaultConfig);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Handle chat or script input ---
  const handleChatInput = async (file?: File, pastedText?: string) => {
    if (!file && !pastedText) return;

    setLoading(true);
    setError(null);
    try {
      const content = file ? await file.text() : pastedText!;
      const processed = await parseTextContent(content);

      if (processed.messages) {
        setChatMessages(processed.messages);
        setAnalysis(analyzeChat(processed.messages));
        setScript(null);

        try {
          // ✅ Pass podcast generation parameters to the script generator
          const generated = await generateScriptFromChat(processed.messages, {
            tone: config.tone,
            abstractionLevel: config.abstractionLevel,
            summaryLength: config.summaryLength,
            narrationStyle: config.style,
          });
          setScript(generated);
          setAnalysis(analyzeScript(generated));
        } catch (gemErr) {
          console.error('Gemini script generation failed', gemErr);
          setError('Gemini script generation failed. You can still continue with uploaded chat.');
        }
      } else if (processed.script) {
        setScript(processed.script);
        setAnalysis(analyzeScript(processed.script));
        setChatMessages([]);
      }
    } catch (err) {
      console.error('Failed to process chat input', err);
      setError('Failed to process chat or script. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // --- Handle updated settings from PodcastSettings ---
  const handleSettingsChange = (settings: any) => {
    setConfig((prev) => ({
      ...prev,
      tone: settings.tone,
      abstractionLevel: settings.abstractionLevel,
      summaryLength: settings.summaryLength,
      style: settings.narrationStyle,
    }));
  };

  // --- Start a new project ---
  const handleNewProject = () => {
    setChatMessages([]);
    setScript(null);
    setAnalysis(null);
    setConfig(defaultConfig);
    setError(null);
  };

  return (
    <ErrorBoundary>
      <div className="app container mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-6">ChatCast Studio</h1>

        {/* Podcast & Generation Settings */}
        <PodcastSettings onChange={handleSettingsChange} />

        {/* File upload or paste */}
        <div className="my-4">
          <FileUpload
            onFileSelected={(file) => handleChatInput(file)}
            onTextPasted={(text) => handleChatInput(undefined, text)}
          />
        </div>

        {/* Loading Indicator */}
        {loading && <Loader message="Processing chat/script..." />}

        {/* Display any errors */}
        {error && (
          <div className="p-2 bg-red-600 text-white rounded mb-2">{error}</div>
        )}

        {/* Analysis Summary */}
        {analysis && !loading && <AnalysisSummary analysis={analysis} />}

        {/* Generated Script Preview */}
        {script && !loading && (
          <ScriptPreview
            script={script}
            config={config}
            analysis={
              analysis || { speakers: [], messageCount: 0, wordCount: 0, estimatedDurationMinutes: 0 }
            }
            onNewScript={handleNewProject}
          />
        )}

        {/* Fallback message */}
        {!loading && !script && !analysis && !error && (
          <p className="text-gray-400 mt-4">
            Upload a chat log or paste text to begin generating your podcast script.
          </p>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
