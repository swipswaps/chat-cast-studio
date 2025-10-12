import React, { useState, useCallback } from 'react';
import type { ChatMessage, AnalysisResult, PodcastConfig, GeneratedScript, ProcessedFile } from './types';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisSummary } from './components/AnalysisSummary';
import { PodcastSettings } from './components/PodcastSettings';
import { ScriptPreview } from './components/ScriptPreview';
import { Loader } from './components/Loader';
import { analyzeChat } from './services/analysisService';
import { generatePodcastScript } from './services/geminiService';
import { ArrowLeftIcon } from './components/icons';
import { DebugLog } from './components/DebugLog';

type AppState = 'upload' | 'settings' | 'generating' | 'preview';

function App() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const handleFileProcessed = useCallback((result: ProcessedFile) => {
    setError('');
    if (result.type === 'chat') {
        const analysisResult = analyzeChat(result.messages);
        setChatMessages(result.messages);
        setAnalysis(analysisResult);
        setAppState('settings');
    } else if (result.type === 'scriptProject') {
        setAnalysis(result.analysis);
        setPodcastConfig(result.config);
        setGeneratedScript(result.script);
        setAppState('preview');
    } else if (result.type === 'legacyScript') {
        setGeneratedScript(result.script);
        setAnalysis(result.analysis);
        setPodcastConfig(null);
        setChatMessages([]); 
        setAppState('settings');
    }
  }, []);

  const handleConfigured = async (config: PodcastConfig) => {
    setPodcastConfig(config);
    // If a script has already been loaded (e.g., from a legacy file),
    // apply the new config and go straight to the preview.
    if (generatedScript) {
      setAppState('preview');
      return;
    }

    setAppState('generating');
    setError('');
    setLoadingMessage('Generating podcast script with Gemini...');
    try {
      const script = await generatePodcastScript(chatMessages, config);
      setGeneratedScript({ ...script, id: new Date().toISOString() });
      setAppState('preview');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during script generation.');
      setAppState('settings'); // Go back to settings on error
    } finally {
      setLoadingMessage('');
    }
  };
  
  const handleBackToSettings = () => {
    // Only clear the script if it was generated from a chat log.
    // If we loaded a script directly, we want to keep it when editing settings.
    if (chatMessages.length > 0) {
      setGeneratedScript(null);
    }
    setAppState('settings');
  };
  
  const handleReset = () => {
    setAppState('upload');
    setChatMessages([]);
    setAnalysis(null);
    setPodcastConfig(null);
    setGeneratedScript(null);
    setError('');
    setLoadingMessage('');
  };

  const renderContent = () => {
    switch (appState) {
      case 'upload':
        return (
          <FileUpload
            onFileProcessed={handleFileProcessed}
            setIsLoading={(isLoading) => {
              if (isLoading) setLoadingMessage('Processing file...');
              else setLoadingMessage('');
            }}
            setLoadingMessage={setLoadingMessage}
            setError={setError}
          />
        );
      case 'settings':
        if (!analysis) return null;
        return (
          <div className="space-y-8">
            <button onClick={handleReset} className="flex items-center text-sm text-dark-text-secondary hover:text-brand-secondary transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Start Over
            </button>
            <AnalysisSummary analysis={analysis} />
            <PodcastSettings
              analysis={analysis}
              onConfigSubmit={handleConfigured}
              hasExistingScript={!!generatedScript}
            />
          </div>
        );
      case 'generating':
        return <Loader message={loadingMessage} />;
      case 'preview':
        if (!generatedScript || !analysis) return null;
        return (
          <ScriptPreview
            script={generatedScript}
            config={podcastConfig}
            analysis={analysis}
            onBack={handleBackToSettings}
            onReset={handleReset}
            setError={setError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-dark-bg min-h-screen text-dark-text font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-900 border border-red-600 text-white px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {renderContent()}
        </div>
      </main>
      <footer className="text-center py-4 text-dark-text-secondary text-sm">
        <p>Powered by Google Gemini.</p>
      </footer>
      <DebugLog />
    </div>
  );
}

export default App;
