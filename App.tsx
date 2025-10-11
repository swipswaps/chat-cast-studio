import React, { useState, useCallback } from 'react';
import type { ChatMessage, AnalysisResult, PodcastConfig, GeneratedScript } from './types';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisSummary } from './components/AnalysisSummary';
import { PodcastSettings } from './components/PodcastSettings';
import { ScriptPreview } from './components/ScriptPreview';
import { Loader } from './components/Loader';
import { analyzeChat } from './services/analysisService';
import { generatePodcastScript } from './services/geminiService';
import { ArrowLeftIcon } from './components/icons';

type AppState = 'upload' | 'settings' | 'generating' | 'preview';

function App() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const handleFileProcessed = useCallback((messages: ChatMessage[]) => {
    const analysisResult = analyzeChat(messages);
    setChatMessages(messages);
    setAnalysis(analysisResult);
    setAppState('settings');
    setError('');
  }, []);

  const handleConfigured = async (config: PodcastConfig) => {
    setPodcastConfig(config);
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
    setGeneratedScript(null);
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
    </div>
  );
}

export default App;
