
import React, { useState, useEffect } from 'react';
import type { GeneratedScript } from '../types';
import { DownloadIcon, RotateCcwIcon, SlidersHorizontalIcon } from './icons';

interface ScriptPreviewProps {
  script: GeneratedScript;
  onReset: () => void;
  onReconfigure: () => void;
}

const calculateRows = (text: string) => {
  if (!text) return 1;
  const lines = text.split('\n').length;
  // A rough estimate for wrapping, assuming an average line length
  const wrappedLines = Math.ceil(text.length / 80);
  return Math.max(lines, wrappedLines);
};


export const ScriptPreview: React.FC<ScriptPreviewProps> = ({ script, onReset, onReconfigure }) => {
  const [editableScript, setEditableScript] = useState<GeneratedScript>(script);

  useEffect(() => {
    setEditableScript(script);
  }, [script]);

  const handleScriptChange = <K extends keyof GeneratedScript>(field: K, value: GeneratedScript[K]) => {
    setEditableScript(prev => ({ ...prev!, [field]: value }));
  };

  const handleSegmentChange = (index: number, field: 'speaker' | 'line', value: string) => {
    setEditableScript(prev => {
      if (!prev) return null!;
      const newSegments = [...prev.segments];
      newSegments[index] = { ...newSegments[index], [field]: value };
      return { ...prev, segments: newSegments };
    });
  };

  const formatScriptForDownload = (): string => {
    let text = `Title: ${editableScript.title}\n\n`;
    text += `HOOK:\n${editableScript.hook}\n\n`;
    text += '--- SCRIPT ---\n\n';
    editableScript.segments.forEach(segment => {
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
    a.download = `${editableScript.title.toLowerCase().replace(/\s+/g, '_')}_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg shadow-lg p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b border-dark-border pb-4">
        <div>
          <input
            type="text"
            value={editableScript.title}
            onChange={(e) => handleScriptChange('title', e.target.value)}
            className="w-full bg-transparent text-3xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-accent rounded-md -ml-1 px-1"
          />
          <p className="text-brand-accent mt-1">Your editable podcast script is ready!</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
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
        <div className="bg-dark-bg p-1 rounded-md border-l-4 border-brand-accent">
           <textarea
            value={editableScript.hook}
            onChange={(e) => handleScriptChange('hook', e.target.value)}
            rows={calculateRows(editableScript.hook)}
            className="w-full bg-transparent italic focus:outline-none resize-y p-2"
          />
        </div>
        
        <h3 className="mt-8">Full Script</h3>
        <div className="space-y-6 bg-dark-bg p-4 rounded-md">
          {editableScript.segments.map((segment, index) => (
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
