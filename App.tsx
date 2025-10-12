import React, { useState, useCallback } from 'react';
import type { ProcessedFile, AnalysisResult, PodcastConfig, GeneratedScript } from './types';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisSummary } from './components/AnalysisSummary';
import { PodcastSettings } from './components/PodcastSettings';
import { ScriptPreview } from './components/ScriptPreview';
import { Loader } from './components/Loader';
import { DebugLog } from './components/DebugLog';
import { generatePodcastScript } from './services/geminiService';
import { analyzeChat, analyzeScript } from './services/analysisService';
import logger from './services/loggingService';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Step 1: File processing
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Step 2: Script generation
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);

  const handleFileProcessed = useCallback((result: ProcessedFile) => {
    logger.info('File processed.', result);
    setError(null);
    setGeneratedScript(null);
    setPodcastConfig(null);

    if (result.type === 'chat') {
        const analysis = analyzeChat(result.messages);
        setAnalysisResult(analysis);
    } else if (result.type === 'scriptProject') {
        setAnalysisResult(result.analysis);
        setGeneratedScript(result.script);
        setPodcastConfig(result.config);
    } else if (result.type === 'legacyScript') {
        const analysis = analyzeScript(result.script);
        setAnalysisResult(analysis);
        setGeneratedScript(result.script);
    }
    setProcessedFile(result);
  }, []);

  const handleConfigSubmit = useCallback(async (config: PodcastConfig) => {
    if (generatedScript && (processedFile?.type === 'scriptProject' || processedFile?.type === 'legacyScript')) {
        logger.info("Applying new config to existing script.");
        setPodcastConfig(config);
        return;
    }

    if (processedFile?.type !== 'chat') {
      logger.warn("handleConfigSubmit called without a chat file to process.");
      return;
    }
    
    logger.info('Podcast config submitted. Generating script...', config);
    setIsLoading(true);
    setLoadingMessage('Generating podcast script with AI...');
    setError(null);
    setPodcastConfig(config);

    try {
      const script = await generatePodcastScript(processedFile.messages, config);
      const finalScript = { ...script, id: new Date().toISOString() };
      setGeneratedScript(finalScript);
      logger.info('Script generation successful.', finalScript);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during script generation.';
      logger.error('Script generation failed.', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [processedFile, generatedScript]);

  const handleReset = () => {
    logger.info('Resetting application state.');
    setProcessedFile(null);
    setAnalysisResult(null);
    setPodcastConfig(null);
    setGeneratedScript(null);
    setError(null);
    setIsLoading(false);
  };
  
  const handleBackToSettings = () => {
    logger.info('Returning to settings screen.');
    // Keep the generated script if we came from a loaded file,
    // so user can re-assign voices without losing the script.
    if (processedFile?.type === 'chat') {
        setGeneratedScript(null);
    }
    setPodcastConfig(null);
  }

  const renderContent = () => {
      if (isLoading) {
          return <Loader message={loadingMessage} />;
      }

      if (generatedScript && podcastConfig && analysisResult) {
          return (
              <ScriptPreview 
                  script={generatedScript}
                  config={podcastConfig}
                  analysis={analysisResult}
                  onBack={handleBackToSettings}
                  setError={setError}
              />
          );
      }

      if (analysisResult) {
          const hasExistingScript = processedFile?.type === 'scriptProject' || processedFile?.type === 'legacyScript';
          return (
              <div className="space-y-8">
                  <button onClick={handleReset} className="text-sm text-brand-secondary hover:text-brand-primary transition-colors">&larr; Start Over With a New File</button>
                  <AnalysisSummary analysis={analysisResult} />
                  <PodcastSettings 
                    analysis={analysisResult} 
                    onConfigSubmit={handleConfigSubmit} 
                    hasExistingScript={hasExistingScript}
                  />
              </div>
          );
      }

      return (
          <FileUpload 
              onFileProcessed={handleFileProcessed}
              setIsLoading={setIsLoading}
              setLoadingMessage={setLoadingMessage}
              setError={setError}
          />
      );
  }
  
  const getErrorMessage = (err: any): string => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    try {
      const str = JSON.stringify(err);
      if (str === '{}') return 'An unknown error occurred.';
      return str;
    } catch {
      return 'An unknown error occurred.';
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {error && (
            <div className="bg-red-900/50 border border-red-600 text-white p-4 rounded-lg mb-6" role="alert">
                <p className="font-bold">An error occurred:</p>
                <p>{getErrorMessage(error)}</p>
                 <button onClick={() => setError(null)} className="text-xs mt-2 underline">Dismiss</button>
            </div>
        )}
        {renderContent()}
      </main>
      <DebugLog />
    </>
  );
}

export default App;
