import React, { useState, useRef } from 'react';
import type { ExportOptions, ExportProgress } from '../types';

interface ExportModalProps {
  scriptTitle: string;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  progress: ExportProgress | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({ scriptTitle, onClose, onExport, progress }) => {
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState<File | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const options: ExportOptions = {
      format,
      includeSubtitles: format === 'mp4' && includeSubtitles,
      backgroundImage: format === 'mp4' ? backgroundImage : undefined,
    };
    onExport(options);
  };
  
  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackgroundImage(e.target.files[0]);
    }
  };

  const hasStarted = progress !== null;
  const isFinished = progress?.phase === 'done' || progress?.phase === 'error';
  const isInProgress = hasStarted && !isFinished;

  const renderContent = () => {
    if (hasStarted) {
      return (
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-center">{progress?.message}</h3>
          {isInProgress && (
            <div className="w-full bg-dark-border rounded-full h-4">
              <div 
                className="bg-brand-primary h-4 rounded-full transition-all" 
                style={{ width: `${(progress?.progress ?? 0) * 100}%` }}
              ></div>
            </div>
          )}
          {progress?.phase === 'error' && <p className="text-red-400 text-center">Export failed. Please ensure the backend TTS server is running and accessible. See the README for setup instructions.</p>}
          {progress?.phase === 'done' && <p className="text-green-400 text-center">Export complete! Check your downloads.</p>}
        </div>
      );
    }
    
    return (
       <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-lg font-semibold mb-2">Format</label>
            <div className="flex gap-4">
              <label className={`flex-1 p-4 border rounded-md cursor-pointer transition-all ${format === 'mp3' ? 'border-brand-primary ring-2 ring-brand-primary' : 'border-dark-border hover:border-gray-600'}`}>
                <input type="radio" name="format" value="mp3" checked={format === 'mp3'} onChange={() => setFormat('mp3')} className="hidden" />
                <span className="font-bold">Audio (.mp3)</span>
                <p className="text-sm text-dark-text-secondary">Generates a high-quality audio file via a backend service.</p>
              </label>
              <label className={`flex-1 p-4 border rounded-md cursor-pointer transition-all ${format === 'mp4' ? 'border-brand-primary ring-2 ring-brand-primary' : 'border-dark-border hover:border-gray-600'}`}>
                <input type="radio" name="format" value="mp4" checked={format === 'mp4'} onChange={() => setFormat('mp4')} className="hidden" />
                <span className="font-bold">Video (.mp4)</span>
                 <p className="text-sm text-dark-text-secondary">Generates a video with high-quality audio and subtitles.</p>
              </label>
            </div>
          </div>

          {format === 'mp4' && (
            <div className="space-y-4 p-4 border border-dark-border rounded-md bg-dark-bg">
              <h4 className="font-semibold">Video Options</h4>
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={includeSubtitles} onChange={e => setIncludeSubtitles(e.target.checked)} className="form-checkbox h-5 w-5 text-brand-secondary bg-dark-bg border-dark-border rounded focus:ring-brand-secondary" />
                <span className="ml-2 text-white">Include Subtitles</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Background Image (optional)</label>
                <input type="file" accept="image/*" onChange={handleBgImageChange} ref={fileInputRef} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-secondary file:text-white hover:file:bg-brand-primary"/>
              </div>
            </div>
          )}
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={isInProgress ? undefined : onClose} role="dialog" aria-modal="true" aria-labelledby="export-title">
      <div className="bg-dark-card border border-dark-border rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-dark-border">
          <h2 id="export-title" className="text-xl font-bold text-white">Export "{scriptTitle}"</h2>
        </div>
        
        {renderContent()}

        <div className="p-6 border-t border-dark-border flex justify-end gap-4">
          <button onClick={onClose} disabled={isInProgress} className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isFinished ? 'Close' : 'Cancel'}
          </button>
          {!hasStarted && (
            <button onClick={handleExport} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-md transition-colors">
                Start Export
            </button>
          )}
        </div>
      </div>
    </div>
  );
};