import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { PodcastSettings } from './components/PodcastSettings';
import { ScriptPreview } from './components/ScriptPreview';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { ApiSettings } from './components/ApiSettings';
import { generatePodcastScript } from './services/geminiService';
import { getVoices, textToSpeech } from './services/elevenLabsService';
import { stitchAudio } from './services/audioService';
import type { ChatMessage, AnalysisResult, PodcastConfig, GeneratedScript, ApiKeys, ElevenLabsVoice, VoiceSetting } from './types';
import { PODCAST_STYLES, TECHNICALITY_LEVELS } from './constants';
import { analyzeChat } from './services/analysisService';

type AppStep = 'upload' | 'configure' | 'generate' | 'preview';

const App: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig | null>(null);
  
  const [scripts, setScripts] = useState<(GeneratedScript & { id: string })[]>([]);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [appStep, setAppStep] = useState<AppStep>('upload');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ elevenLabs: '' });
  
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>([]);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);


  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('chatcast_api_keys');
      if (storedKeys) {
        const parsedKeys = JSON.parse(storedKeys);
        setApiKeys(parsedKeys);
        if (parsedKeys.elevenLabs) {
            fetchElevenLabsVoices(parsedKeys.elevenLabs);
        }
      }
    } catch (e) {
      console.error("Failed to parse API keys from localStorage", e);
    }
  }, []);

  const fetchElevenLabsVoices = async (apiKey: string) => {
      if (!apiKey) {
          setElevenLabsVoices([]);
          return;
      }
      // Clear previous voice-related errors
      setError(prev => prev.includes("ElevenLabs") ? "" : prev);
      try {
          const voices = await getVoices(apiKey);
          setElevenLabsVoices(voices);
      } catch (err) {
          console.error(err);
          // FIX: Display the specific error message from the service layer.
          setError(err instanceof Error ? err.message : "An unknown error occurred while fetching voices.");
          setElevenLabsVoices([]);
      }
  };

  const handleFileProcessed = useCallback((messages: ChatMessage[]) => {
    if (messages.length === 0) {
      setError('Could not parse any messages from the file. Please check the format.');
      return;
    }
    const analysisResult = analyzeChat(messages);
    setChatMessages(messages);
    setAnalysis(analysisResult);

    const initialVoiceMapping = new Map<string, VoiceSetting>();
    analysisResult.speakers.forEach((speaker, index) => {
        const defaultVoiceId = elevenLabsVoices.length > 0 ? elevenLabsVoices[index % elevenLabsVoices.length].voice_id : '';
        initialVoiceMapping.set(speaker, {
            podcastName: speaker === 'user' ? 'Host' : `Guest ${String.fromCharCode(65 + index)}`,
            voiceId: defaultVoiceId
        });
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
  }, [elevenLabsVoices]);

  const handleGenerateScript = async () => {
    if (!podcastConfig || !chatMessages) {
      setError('Missing configuration or chat messages.');
      return;
    }
    setAppStep('generate');
    setIsLoading(true);
    setLoadingMessage('Generating podcast script... This may take a moment.');
    setError('');
    setGeneratedAudioUrl(null); // Invalidate previous audio
    try {
      const script = await generatePodcastScript(chatMessages, podcastConfig);
      const newScript = { ...script, id: `script_${Date.now()}`};
      setScripts(prev => [...prev, newScript]);
      setActiveScriptId(newScript.id);
      setAppStep('preview');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during script generation.';
      setError(`Failed to generate script: ${errorMessage}`);
      setAppStep('configure'); 
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateAudio = async (script: GeneratedScript) => {
    if (!apiKeys.elevenLabs) {
        setError("ElevenLabs API key is not set. Please add it in the settings.");
        return;
    }
    if (!podcastConfig) {
        setError("Podcast configuration is missing.");
        return;
    }

    setIsGeneratingAudio(true);
    setLoadingMessage('Generating audio for each segment...');
    setError('');
    setGeneratedAudioUrl(null);

    try {
        const voiceIdLookup = new Map<string, string>();
        podcastConfig.voiceMapping.forEach(value => {
            voiceIdLookup.set(value.podcastName, value.voiceId);
        });

        const audioBlobs: Blob[] = [];
        for (const segment of script.segments) {
            const voiceId = voiceIdLookup.get(segment.speaker);
            if (!voiceId) {
                console.warn(`Skipping audio for speaker "${segment.speaker}" - no voice ID assigned.`);
                continue;
            }
            if (segment.line.trim()) {
                setLoadingMessage(`Generating audio for ${segment.speaker}: "${segment.line.substring(0, 20)}..."`);
                const audioBlob = await textToSpeech(apiKeys.elevenLabs, segment.line, voiceId);
                audioBlobs.push(audioBlob);
            }
        }
        
        if (audioBlobs.length > 0) {
            setLoadingMessage('Stitching audio segments together...');
            const finalAudioBlob = await stitchAudio(audioBlobs);
            setGeneratedAudioUrl(URL.createObjectURL(finalAudioBlob));
        } else {
            setError("No audio could be generated. Check if speakers have assigned voices and lines.");
        }

    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An unknown error occurred during audio generation.");
    } finally {
        setIsGeneratingAudio(false);
        setLoadingMessage('');
    }
};
  
  const handleUpdateActiveScript = (updatedScript: GeneratedScript) => {
    setScripts(prevScripts => 
      prevScripts.map(script => 
        script.id === activeScriptId ? { ...updatedScript, id: script.id } : script
      )
    );
     setGeneratedAudioUrl(null); // Invalidate audio if script changes
  };

  const handleReset = () => {
    setChatMessages([]);
    setAnalysis(null);
    setPodcastConfig(null);
    setScripts([]);
    setActiveScriptId(null);
    setError('');
    setIsLoading(false);
    setGeneratedAudioUrl(null);
    setAppStep('upload');
  };

  const handleReconfigure = () => {
    setAppStep('configure');
    setGeneratedAudioUrl(null);
  };
  
  const handleSaveApiKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    try {
      localStorage.setItem('chatcast_api_keys', JSON.stringify(keys));
      fetchElevenLabsVoices(keys.elevenLabs);
    } catch (e) {
      console.error("Failed to save API keys to localStorage", e);
      setError("Could not save API keys. Your browser might be in private mode or have storage disabled.");
    }
    setIsSettingsOpen(false);
  };

  const activeScript = scripts.find(s => s.id === activeScriptId);

  const renderContent = () => {
    if (isLoading) {
      return <Loader message={loadingMessage} />;
    }
    
    switch (appStep) {
      case 'upload':
        return <FileUpload onFileProcessed={handleFileProcessed} setIsLoading={setIsLoading} setLoadingMessage={setLoadingMessage} setError={setError} />;
      case 'configure':
        if (analysis && podcastConfig) {
          return <PodcastSettings 
            analysis={analysis} 
            config={podcastConfig}
            setConfig={setPodcastConfig}
            onGenerate={handleGenerateScript}
            elevenLabsVoices={elevenLabsVoices}
          />;
        }
        return null;
      case 'preview':
        if (activeScript && podcastConfig) {
          return <ScriptPreview 
            key={activeScript.id} // Re-mount component on script change
            script={activeScript} 
            allScripts={scripts}
            activeScriptId={activeScriptId}
            setActiveScriptId={setActiveScriptId}
            onUpdateScript={handleUpdateActiveScript}
            onReset={handleReset} 
            onReconfigure={handleReconfigure}
            onGenerateAudio={handleGenerateAudio}
            isGeneratingAudio={isGeneratingAudio}
            audioUrl={generatedAudioUrl}
            apiKeys={apiKeys}
            audioLoadingMessage={loadingMessage}
          />;
        }
        return null;
      default:
        return <FileUpload onFileProcessed={handleFileProcessed} setIsLoading={setIsLoading} setLoadingMessage={setLoadingMessage} setError={setError} />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-5xl">
        <Header onSettingsClick={() => setIsSettingsOpen(true)} />
        {isSettingsOpen && (
          <ApiSettings
            currentKeys={apiKeys}
            onSave={handleSaveApiKeys}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
        <main className="mt-6">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
