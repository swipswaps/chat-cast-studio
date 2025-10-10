
import React, { useState, useCallback } from 'react';
// FIX: Removed ApiKeyInput as per guideline to not ask user for API key.
import { FileUpload } from './components/FileUpload';
import { PodcastSettings } from './components/PodcastSettings';
import { ScriptPreview } from './components/ScriptPreview';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { parseFile } from './services/parserService';
import { generatePodcastScript } from './services/geminiService';
import type { ChatMessage, AnalysisResult, PodcastConfig, GeneratedScript } from './types';
import { PODCAST_STYLES, TECHNICALITY_LEVELS } from './constants';
import { analyzeChat } from './services/analysisService';

// FIX: Removed 'apiKey' step as it's no longer needed.
type AppStep = 'upload' | 'configure' | 'generate' | 'preview';

const App: React.FC = () => {
  // FIX: Removed apiKey state. API key is handled by environment variables.
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  // FIX: Start app at the 'upload' step.
  const [appStep, setAppStep] = useState<AppStep>('upload');

  // FIX: Removed handleApiKeySubmit as API key is not handled in the UI.

  const handleFileProcessed = useCallback((messages: ChatMessage[]) => {
    if (messages.length === 0) {
      setError('Could not parse any messages from the file. Please check the format.');
      return;
    }
    const analysisResult = analyzeChat(messages);
    setChatMessages(messages);
    setAnalysis(analysisResult);

    // Initialize default config
    const initialVoiceMapping = new Map<string, string>();
    analysisResult.speakers.forEach((speaker, index) => {
      initialVoiceMapping.set(speaker, `Voice ${String.fromCharCode(65 + index)}`);
    });

    setPodcastConfig({
      style: PODCAST_STYLES[0],
      technicality: TECHNICALITY_LEVELS[1],
      voiceMapping: initialVoiceMapping,
      includeMusic: true,
      includeSfx: true,
    });

    setAppStep('configure');
    setError('');
  }, []);

  const handleGenerateScript = async () => {
    // FIX: Removed apiKey from check as it's handled by environment variables.
    if (!podcastConfig || !chatMessages) {
      setError('Missing configuration or chat messages.');
      return;
    }
    setAppStep('generate');
    setIsLoading(true);
    setLoadingMessage('Generating podcast script... This may take a moment.');
    setError('');
    try {
      // FIX: Removed apiKey from function call.
      const script = await generatePodcastScript(chatMessages, podcastConfig);
      setGeneratedScript(script);
      setAppStep('preview');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during script generation.';
      setError(`Failed to generate script: ${errorMessage}`);
      setAppStep('configure'); // Go back to config step on error
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = () => {
    setChatMessages([]);
    setAnalysis(null);
    setPodcastConfig(null);
    setGeneratedScript(null);
    setError('');
    setIsLoading(false);
    setAppStep('upload');
  };
  
  // FIX: Removed handleNewKey as API key is not handled in the UI.

  const renderContent = () => {
    if (isLoading) {
      return <Loader message={loadingMessage} />;
    }
    
    switch (appStep) {
      // FIX: Removed 'apiKey' case.
      case 'upload':
        return <FileUpload onFileProcessed={handleFileProcessed} setIsLoading={setIsLoading} setLoadingMessage={setLoadingMessage} setError={setError} />;
      case 'configure':
        if (analysis && podcastConfig) {
          return <PodcastSettings 
            analysis={analysis} 
            config={podcastConfig}
            setConfig={setPodcastConfig}
            onGenerate={handleGenerateScript} 
          />;
        }
        return null;
      case 'preview':
        if (generatedScript) {
          return <ScriptPreview script={generatedScript} onReset={handleReset} />;
        }
        return null;
      default:
        return <FileUpload onFileProcessed={handleFileProcessed} setIsLoading={setIsLoading} setLoadingMessage={setLoadingMessage} setError={setError} />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-5xl">
        <Header />
        {/* FIX: Removed UI for changing API key. */}
        <main className="mt-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
