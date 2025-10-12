import React, { useState, useEffect, useRef } from 'react';
import type { GeneratedScript, PodcastConfig, PlaybackState, ScriptSegment, ExportOptions, AnalysisResult, ExportProgress } from '../types';
import audioService from '../services/audioService';
import { PlayerControls } from './PlayerControls';
import { SegmentEditorModal } from './SegmentEditorModal';
import { ExportModal } from './ExportModal';
import { EditIcon, DownloadIcon, SaveIcon } from './icons';
import { exportProject } from '../services/exportService';
import { saveProjectToFile } from '../services/parserService';


interface ScriptPreviewProps {
  script: GeneratedScript;
  config: PodcastConfig;
  analysis: AnalysisResult;
  onNewScript: () => void;
}

export const ScriptPreview: React.FC<ScriptPreviewProps> = ({ script: initialScript, config, analysis }) => {
  const [script, setScript] = useState<GeneratedScript>(initialScript);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number | null>(null);
  const [editingSegment, setEditingSegment] = useState<ScriptSegment | null>(null);
  const [editingSegmentIndex, setEditingSegmentIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const currentSegmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioService.init({
      onStateChange: setPlaybackState,
      onSegmentChange: setCurrentSegmentIndex,
    });
    audioService.loadScript(script.segments, config.voiceMapping);

    return () => audioService.stop();
  }, [script, config]);

  useEffect(() => {
    if (currentSegmentIndex !== null && currentSegmentRef.current) {
      currentSegmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSegmentIndex]);

  const handleSegmentUpdate = (updatedSegment: ScriptSegment) => {
    if (editingSegmentIndex !== null) {
      const newSegments = [...script.segments];
      newSegments[editingSegmentIndex] = updatedSegment;
      setScript({ ...script, segments: newSegments, id: script.id || new Date().toISOString() });
    }
    setEditingSegment(null);
    setEditingSegmentIndex(null);
  };
  
  const handleOpenEditor = (segment: ScriptSegment, index: number) => {
    setEditingSegment(segment);
    setEditingSegmentIndex(index);
  }
  
  const handleExport = (options: ExportOptions) => {
      setExportProgress({ phase: 'loading', message: 'Initializing export...' });
      exportProject(script, config, options, setExportProgress);
  };

  const handleSaveProject = () => {
    saveProjectToFile(script, config, analysis);
  }
  
  const handleOpenExportModal = () => {
    setIsExporting(true);
    setExportProgress(null); // Reset progress when opening modal
  }

  return (
    <div className="space-y-6">
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-3xl font-bold text-white">{script.title}</h2>
                <p className="text-md text-dark-text-secondary mt-1">{script.hook}</p>
            </div>
            <div className="flex gap-2">
                <button onClick={handleSaveProject} className="p-2 bg-dark-bg hover:bg-brand-secondary text-white rounded-md" title="Save Project File">
                    <SaveIcon className="w-5 h-5" />
                </button>
                <button onClick={handleOpenExportModal} className="p-2 bg-dark-bg hover:bg-brand-secondary text-white rounded-md" title="Export Audio/Video">
                    <DownloadIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
      
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 shadow-lg sticky top-4 z-10">
        <PlayerControls
          segments={script.segments}
          playbackState={playbackState}
          currentSegmentIndex={currentSegmentIndex}
          onPlayPause={() => playbackState === 'playing' ? audioService.pause() : audioService.play()}
          onStop={() => audioService.stop()}
          onSeek={(index) => audioService.seek(index)}
          onSkipToStart={() => audioService.seek(0)}
          onSkipToEnd={() => audioService.seek(script.segments.length - 1)}
        />
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg space-y-4 max-h-[60vh] overflow-y-auto">
        {script.segments.map((segment, index) => (
          <div
            key={index}
            ref={index === currentSegmentIndex ? currentSegmentRef : null}
            className={`p-4 rounded-md transition-all duration-300 ${index === currentSegmentIndex ? 'bg-brand-primary/20 ring-2 ring-brand-primary' : 'bg-dark-bg'}`}
          >
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg capitalize text-white">{segment.speaker}</p>
                    <p className="text-dark-text-main whitespace-pre-wrap">{segment.editedLine ?? segment.line}</p>
                    {segment.sfx && <p className="text-sm text-brand-accent italic">[{segment.sfx}]</p>}
                </div>
                <button onClick={() => handleOpenEditor(segment, index)} className="p-2 text-dark-text-secondary hover:text-white">
                    <EditIcon className="w-5 h-5" />
                </button>
            </div>
          </div>
        ))}
      </div>
      
      {editingSegment && editingSegmentIndex !== null && (
        <SegmentEditorModal 
            segment={editingSegment}
            onSave={handleSegmentUpdate}
            onClose={() => { setEditingSegment(null); setEditingSegmentIndex(null); }}
        />
      )}
      {isExporting && (
          <ExportModal
            scriptTitle={script.title}
            onClose={() => setIsExporting(false)}
            onExport={handleExport}
            progress={exportProgress}
          />
      )}
    </div>
  );
};