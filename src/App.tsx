// File: src/App.tsx
// PRF-COMPLIANT FIX 2025-10-15
// Adds improved logging, backend-voice synchronization, and error safety.

import React, { useState, useEffect } from "react";
import type {
  ChatMessage,
  AnalysisResult,
  PodcastConfig,
  GeneratedScript,
  ProcessedFile,
} from "../types";
import { Header } from "./components/Header";
import { FileUpload } from "./components/FileUpload";
import { AnalysisSummary } from "./components/AnalysisSummary";
import { PodcastSettings } from "./components/PodcastSettings";
import { ScriptPreview } from "./components/ScriptPreview";
import { Loader } from "./components/Loader";
import { DebugLog } from "./components/DebugLog";
import { analyzeChat } from "services/analysisService.ts";
import { generatePodcastScript } from "services/geminiService.ts";
import { parseFile, parseTextContent } from "services/parserService.ts";
import { fetchBackendVoices } from "services/tts.ts";
import { VoiceSelector } from "./components/VoiceSelector";
import { logEvent } from "services/logService.ts";

type AppState = "initial" | "analyzing" | "settings" | "generating" | "preview";

function App() {
  const [appState, setAppState] = useState<AppState>("initial");
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(
    null
  );
  const [backendVoices, setBackendVoices] = useState<any[]>([]);
  const [loadedProject, setLoadedProject] = useState<{
    script: GeneratedScript;
    config: PodcastConfig | null;
    analysis: AnalysisResult;
  } | null>(null);

  useEffect(() => {
    if (error) {
      logEvent("ERROR", error, null, "App");
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load voices once
  useEffect(() => {
    (async () => {
      const voices = await fetchBackendVoices();
      setBackendVoices(voices);
    })();
  }, []);

  const resetState = () => {
    setAppState("initial");
    setError(null);
    setChatMessages([]);
    setAnalysis(null);
    setPodcastConfig(null);
    setGeneratedScript(null);
    setLoadedProject(null);
    logEvent("INFO", "Application state reset", null, "App");
  };

  const handleFileProcess = (processedFile: ProcessedFile, fileName?: string) => {
    try {
      if (processedFile.type === "chat") {
        if (!processedFile.messages.length)
          throw new Error("Chat file empty or unsupported.");
        const chatAnalysis = analyzeChat(processedFile.messages);
        setChatMessages(processedFile.messages);
        setAnalysis(chatAnalysis);
        setAppState("settings");
        logEvent("INFO", `Parsed ${processedFile.messages.length} messages`, null, "App");
      } else if (
        processedFile.type === "scriptProject" ||
        processedFile.type === "legacyScript"
      ) {
        setLoadedProject({
          script: processedFile.script,
          config:
            processedFile.type === "scriptProject"
              ? processedFile.config
              : null,
          analysis: processedFile.analysis,
        });
        setAnalysis(processedFile.analysis);
        setGeneratedScript(processedFile.script);
        setPodcastConfig(
          processedFile.type === "scriptProject"
            ? processedFile.config
            : null
        );
        setAppState(
          processedFile.type === "scriptProject" ? "preview" : "settings"
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`File processing error: ${msg}`);
      logEvent("ERROR", "File processing failed", err, "App");
      setAppState("initial");
    }
  };

  const handleFileSelected = async (file: File) => {
    setAppState("analyzing");
    try {
      const result = await parseFile(file);
      handleFileProcess(result, file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`File parsing error: ${msg}`);
      logEvent("ERROR", msg, err, "App");
      setAppState("initial");
    }
  };

  const handleTextPasted = (text: string) => {
    setAppState("analyzing");
    try {
      const result = parseTextContent(text);
      handleFileProcess(result, "pasted content");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Text parse error: ${msg}`);
      logEvent("ERROR", msg, err, "App");
      setAppState("initial");
    }
  };

  const handleConfigSubmit = async (config: PodcastConfig) => {
    setPodcastConfig(config);

    if (loadedProject && generatedScript) {
      logEvent("INFO", "Applied new voice config to loaded project", null, "App");
      setAppState("preview");
      return;
    }

    if (!chatMessages.length) {
      const msg = "Cannot generate script without chat messages.";
      setError(msg);
      logEvent("WARN", msg, null, "App");
      return;
    }

    setAppState("generating");
    setError(null);

    try {
      logEvent("INFO", "Generating podcast script...", null, "App");
      const script = await generatePodcastScript(chatMessages, config);
      setGeneratedScript({ ...script, id: new Date().toISOString() });
      setAppState("preview");
      logEvent("INFO", "Script generation successful", null, "App");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Script generation error: ${msg}`);
      logEvent("ERROR", msg, err, "App");
      setAppState("settings");
    }
  };

  const renderContent = () => {
    switch (appState) {
      case "initial":
        return (
          <FileUpload
            onFileSelected={handleFileSelected}
            onTextPasted={handleTextPasted}
          />
        );
      case "analyzing":
        return <Loader message="Analyzing chat log..." />;
      case "settings":
        if (!analysis) return <p>Error: Analysis data missing.</p>;
        return (
          <div className="space-y-6">
            <AnalysisSummary analysis={analysis} />
            <PodcastSettings
              analysis={analysis}
              onConfigSubmit={handleConfigSubmit}
              hasExistingScript={!!generatedScript}
            />
            <VoiceSelector
              selectedVoice={podcastConfig?.voice || ""}
              onSelect={(v) =>
                setPodcastConfig({ ...(podcastConfig || {}), voice: v })
              }
            />
          </div>
        );
      case "generating":
        return <Loader message="Generating podcast script..." />;
      case "preview":
        if (!generatedScript || !podcastConfig || !analysis)
          return <p>Error: Script or config missing.</p>;
        return (
          <ScriptPreview
            script={generatedScript}
            config={podcastConfig}
            analysis={analysis}
            onNewScript={resetState}
          />
        );
      default:
        return <p>Unexpected app state.</p>;
    }
  };

  return (
    <div className="bg-dark-bg min-h-screen text-dark-text-main font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {error && (
          <div
            className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        {appState !== "initial" && (
          <button
            onClick={resetState}
            className="mb-6 text-sm text-brand-secondary hover:underline"
          >
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
