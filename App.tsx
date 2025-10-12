
import React, { useState, useEffect } from 'react';
import type {
  ChatMessage,
  AnalysisResult,
  PodcastConfig,
  GeneratedScript,
  ProcessedFile
} from './types';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisSummary } from './components/AnalysisSummary';
import { PodcastSettings } from './components/PodcastSettings';
import { ScriptPreview } from './components/ScriptPreview';
import { Loader } from './components/Loader';
import { DebugLog } from './components/DebugLog';
import { analyzeChat } from './services/analysisService';
import { generatePodcastScript } from './services/geminiService';
import logger from './services/loggingService';
import { parseFile, parseTextContent } from './services/parserService';

type AppState = 'initial' | 'analyzing' | 'settings' | 'generating' | 'preview';

function App() {
  const [appState, setAppState] = useState<AppState>('initial');
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  
  // This state is to track projects loaded from a file
  const [loadedProject, setLoadedProject] = useState<{script: GeneratedScript, config: PodcastConfig | null, analysis: AnalysisResult} | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      logger.error(error);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  const resetState = () => {
    setAppState('initial');
    setError(null);
    setChatMessages([]);
    setAnalysis(null);
    setPodcastConfig(null);
    setGeneratedScript(null);
    setLoadedProject(null);
    logger.info("Application state has been reset.");
  };

  const handleFileProcess = (processedFile: ProcessedFile, fileName?: string) => {
      if (processedFile.type === 'chat') {
          if (processedFile.messages.length === 0) {
              setError("The file seems to be empty or in an unsupported chat format.");
              setAppState('initial');
              return;
          }
          logger.info(`Successfully parsed ${processedFile.messages.length} messages from ${fileName || 'pasted text'}.`);
          const chatAnalysis = analyzeChat(processedFile.messages);
          setChatMessages(processedFile.messages);
          setAnalysis(chatAnalysis);
          setAppState('settings');
      } else if (processedFile.type === 'scriptProject' || processedFile.type === 'legacyScript') {
          logger.info(`Successfully parsed a podcast project file: ${fileName}`);
          setLoadedProject({
              script: processedFile.script,
              config: processedFile.type === 'scriptProject' ? processedFile.config : null,
              analysis: processedFile.analysis,
          });
          setAnalysis(processedFile.analysis);
          setGeneratedScript(processedFile.script);
          // if legacy, go to settings to define voices; if full project, go straight to preview
          setAppState(processedFile.type === 'scriptProject' ? 'preview' : 'settings'); 
          if (processedFile.type === 'scriptProject') {
             setPodcastConfig(processedFile.config);
          }
      }
  }

  const handleFileSelected = async (file: File) => {
    setAppState('analyzing');
    try {
      const result = await parseFile(file);
      handleFileProcess(result, file.name);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(message);
      setAppState('initial');
    }
  };

  const handleTextPasted = (text: string) => {
    setAppState('analyzing');
    try {
        const result = parseTextContent(text);
        handleFileProcess(result, 'pasted content');
    } catch(e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(message);
        setAppState('initial');
    }
  }

  const handleConfigSubmit = async (config: PodcastConfig) => {
    setPodcastConfig(config);

    if (loadedProject && generatedScript) {
        // If we were configuring a loaded script (legacy or re-configuring a full project), just move to preview
        logger.info("Applying new voice configuration to loaded script.");
        setAppState('preview');
        // Ensure the config is updated for the preview
        setPodcastConfig(config);
        return;
    }
    
    if (chatMessages.length === 0) {
      setError("Cannot generate script without chat messages.");
      return;
    }
    
    setAppState('generating');
    setError(null);
    try {
      logger.info("Generating podcast script with Gemini...");
      const script = await generatePodcastScript(chatMessages, config);
      setGeneratedScript({ ...script, id: new Date().toISOString() });
      setAppState('preview');
      logger.info("Script generation successful.");
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred during script generation.';
      setError(message);
      setAppState('settings'); // Go back to settings on failure
    }
  };
  
  const renderContent = () => {
    switch (appState) {
      case 'initial':
        return <FileUpload 
                  onFileSelected={handleFileSelected}
                  onTextPasted={handleTextPasted}
                />;
      case 'analyzing':
        return <Loader message="Analyzing chat log..." />;
      case 'settings':
        if (!analysis) return <p>Error: Analysis data missing.</p>;
        return (
          <div className="space-y-6">
            <AnalysisSummary analysis={analysis} />
            <PodcastSettings 
                analysis={analysis} 
                onConfigSubmit={handleConfigSubmit} 
                hasExistingScript={!!generatedScript}
            />
          </div>
        );
      case 'generating':
        return <Loader message="Generating podcast script with AI..." />;
      case 'preview':
        if (!generatedScript || !podcastConfig || !analysis) return <p>Error: Script or configuration data missing.</p>;
        return <ScriptPreview script={generatedScript} config={podcastConfig} analysis={analysis} onNewScript={resetState} />;
      default:
        return <p>Something went wrong.</p>;
    }
  }

  return (
    <div className="bg-dark-bg min-h-screen text-dark-text-main font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}
        
        {appState !== 'initial' && (
          <button onClick={resetState} className="mb-6 text-sm text-brand-secondary hover:underline">
            &larr; Start Over
          </button>
        )}
        
        {renderContent()}
      </main>
      <DebugLog />
    </div>
  );
}

export default App;
