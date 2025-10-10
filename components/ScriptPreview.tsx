
import React from 'react';
import type { GeneratedScript } from '../types';
import { DownloadIcon, RotateCcwIcon } from './icons';

interface ScriptPreviewProps {
  script: GeneratedScript;
  onReset: () => void;
}

export const ScriptPreview: React.FC<ScriptPreviewProps> = ({ script, onReset }) => {
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

  const handleDownload = () => {
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
    <div className="bg-dark-card border border-dark-border rounded-lg shadow-lg p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b border-dark-border pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">{script.title}</h2>
          <p className="text-brand-accent mt-1">Your podcast script is ready!</p>
        </div>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <button
            onClick={onReset}
            className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center"
          >
            <RotateCcwIcon className="w-4 h-4 mr-2" />
            Start New
          </button>
          <button
            onClick={handleDownload}
            className="bg-brand-secondary hover:bg-brand-primary text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download Script
          </button>
        </div>
      </div>

      <div className="prose prose-invert max-w-none prose-p:text-dark-text prose-headings:text-white">
        <h3>Hook</h3>
        <p className="italic bg-dark-bg p-3 rounded-md border-l-4 border-brand-accent">{script.hook}</p>
        
        <h3 className="mt-8">Full Script</h3>
        <div className="space-y-6 bg-dark-bg p-4 rounded-md">
          {script.segments.map((segment, index) => (
            <div key={index}>
              <p className="font-bold text-brand-accent uppercase text-sm">{segment.speaker}</p>
              <p className="ml-4">{segment.line}</p>
              {segment.sfx && (
                <p className="ml-4 text-xs text-dark-text-secondary italic">[SFX: {segment.sfx}]</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
