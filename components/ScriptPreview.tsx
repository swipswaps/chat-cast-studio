import React from 'react';
import type { GeneratedScript, ApiKeys } from '../types';
import { DownloadIcon, RotateCcwIcon, SlidersHorizontalIcon, MicIcon } from './icons';

interface ScriptPreviewProps {
  script: GeneratedScript;
  allScripts: GeneratedScript[];
  activeScriptId: string | null;
  setActiveScriptId: (id: string) => void;
  onUpdateScript: (updatedScript: GeneratedScript) => void;
  onReset: () => void;
  onReconfigure: () => void;
  onGenerateAudio: (script: GeneratedScript) => void;
  isGeneratingAudio: boolean;
  audioUrl: string | null;
  apiKeys: ApiKeys;
  audioLoadingMessage: string;
}

const calculateRows = (text: string) => {
  if (!text) return 1;
  const newlines = (text.match(/\n/g) || []).length;
  // Simple heuristic for wrapping lines
  const wrappedLines = Math.floor(text.length / 80);
  return Math.max(1, newlines + wrappedLines + 1);
};


export const ScriptPreview: React.FC<ScriptPreviewProps> = ({ 
  script, 
  allScripts,
  activeScriptId,
  setActiveScriptId,
  onUpdateScript,
  onReset, 
  onReconfigure,
  onGenerateAudio,
  isGeneratingAudio,
  audioUrl,
  apiKeys,
  audioLoadingMessage
}) => {

  const handleScriptChange = <K extends keyof Omit<GeneratedScript, 'id' | 'segments'>>(
    field: K, 
    value: GeneratedScript[K]
  ) => {
    onUpdateScript({ ...script, [field]: value });
  };

  const handleSegmentChange = (index: number, field: 'speaker' | 'line', value: string) => {
    const newSegments = [...script.segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    onUpdateScript({ ...script, segments: newSegments });
  };

  const formatScriptForDownload = (): string => {
    let text = `Title: ${script.title}\n\n`;
    text += `HOOK:\n${script.hook}\n\n`;
    text += '--- SCRIPT ---\n\n';
    script.segments.forEach(segment => {
      text += `${segment.speaker.toUpperCase()}:\n`;
      text += `${segment.line}\n`;
      if (segment.sfx) {
        text += `[SFX: ${segment.sfx}]\n`;
      }
      text += '\n';
    });
    return text;
  };

  const handleDownloadScript = () => {
    const scriptText = formatScriptForDownload();
    const blob = new Blob([scriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.title.toLowerCase().replace(/\s+/g, '_')}_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg shadow-lg p-6 animate-fade-in space-y-8">
      {/* Header & Controls */}
      <div className="border-b border-dark-border pb-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={script.title}
              onChange={(e) => handleScriptChange('title', e.target.value)}
              className="w-full bg-transparent text-3xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-accent rounded-md -ml-1 px-1"
            />
            <div className="flex items-center mt-2">
              <p className="text-brand-accent mr-2 text-sm whitespace-nowrap">Script Version:</p>
              <select
                  value={activeScriptId ?? ''}
                  onChange={(e) => setActiveScriptId(e.target.value)}
                  className="bg-dark-bg border border-dark-border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-brand-secondary focus:outline-none"
              >
                  {allScripts.map((s, index) => (
                      <option key={s.id} value={s.id}>
                          Version {index + 1} - {s.title.substring(0, 20)}{s.title.length > 20 ? '...' : ''}
                      </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReconfigure}
              className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center"
            >
              <SlidersHorizontalIcon className="w-4 h-4 mr-2" />
              Re-configure
            </button>
            <button
              onClick={onReset}
              className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center"
            >
              <RotateCcwIcon className="w-4 h-4 mr-2" />
              Start New
            </button>
          </div>
        </div>
      </div>
      
      {/* Audio Production Section */}
      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center text-white">
          <MicIcon className="w-5 h-5 mr-2 text-brand-accent" />
          Audio Production
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
                onClick={() => onGenerateAudio(script)}
                disabled={isGeneratingAudio || !apiKeys.elevenLabs}
                className="bg-brand-secondary hover:bg-brand-primary text-white font-bold py-2 px-4 rounded-md transition-colors w-full sm:w-auto disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isGeneratingAudio ? 'Generating...' : 'Generate Audio'}
            </button>
            <div className="flex-1 w-full">
            {isGeneratingAudio && (
                 <div className="text-sm text-dark-text-secondary">{audioLoadingMessage}</div>
            )}
            {!apiKeys.elevenLabs && !isGeneratingAudio && (
                <div className="text-sm text-yellow-400">Please add an ElevenLabs API key in Settings to enable audio generation.</div>
            )}
            {audioUrl && !isGeneratingAudio && (
                <div className="flex items-center gap-2">
                    <audio controls src={audioUrl} className="w-full"></audio>
                    <a href={audioUrl} download={`${script.title.toLowerCase().replace(/\s+/g, '_')}_podcast.wav`} className="p-2 text-dark-text-secondary hover:text-white" title="Download Audio">
                        <DownloadIcon className="w-5 h-5"/>
                    </a>
                </div>
            )}
            </div>
        </div>
      </div>


      {/* Script Editor Section */}
      <div className="prose prose-invert max-w-none prose-p:text-dark-text prose-headings:text-white">
        <div className="flex justify-between items-center">
            <h3>Editable Script</h3>
             <button
                onClick={handleDownloadScript}
                className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center text-sm"
            >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download Text
            </button>
        </div>

        <h4>Hook</h4>
        <div className="bg-dark-bg p-1 rounded-md border-l-4 border-brand-accent">
           <textarea
            value={script.hook}
            onChange={(e) => handleScriptChange('hook', e.target.value)}
            rows={calculateRows(script.hook)}
            className="w-full bg-transparent italic focus:outline-none resize-y p-2"
          />
        </div>
        
        <h4 className="mt-6">Full Script</h4>
        <div className="space-y-6 bg-dark-bg p-4 rounded-md">
          {script.segments.map((segment, index) => (
            <div key={index} className="pl-4 border-l-2 border-dark-border">
              <input 
                type="text"
                value={segment.speaker}
                onChange={(e) => handleSegmentChange(index, 'speaker', e.target.value)}
                className="w-auto font-bold text-brand-accent uppercase text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-accent rounded-sm px-1 mb-1"
              />
              <textarea
                value={segment.line}
                onChange={(e) => handleSegmentChange(index, 'line', e.target.value)}
                rows={calculateRows(segment.line)}
                className="w-full bg-transparent focus:outline-none resize-y p-0 border-none"
              />
              {segment.sfx && (
                <p className="mt-1 text-xs text-dark-text-secondary italic">[SFX: {segment.sfx}]</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
