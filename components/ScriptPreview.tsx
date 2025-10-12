import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GeneratedScript, PodcastConfig, AnalysisResult, VoiceSetting, SerializablePodcastConfig, PodcastProjectFile, ScriptSegment } from '../types';
import { playScript, stopPlayback } from '../services/audioService';
import { ArrowLeftIcon, BotIcon, DownloadIcon, PencilIcon } from './icons';
import { SegmentEditorModal } from './SegmentEditorModal';
import { PlayerControls } from './PlayerControls';

interface ScriptPreviewProps {
  script: GeneratedScript;
  config: PodcastConfig | null;
  analysis: AnalysisResult;
  onBack: () => void;
  onReset: () => void;
  setError: (error: string) => void;
}

export const ScriptPreview: React.FC<ScriptPreviewProps> = ({ script, config, analysis, onBack, onReset, setError }) => {
  const [editableScript, setEditableScript] = useState<GeneratedScript>(script);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number | null>(null);
  const [editingSegment, setEditingSegment] = useState<{ segment: ScriptSegment; index: number } | null>(null);
  
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Keep editable script in sync if the original prop changes (e.g., on config change)
    setEditableScript(script);
  }, [script]);

  useEffect(() => {
    // Scroll to current segment
    if (currentSegmentIndex !== null && segmentRefs.current[currentSegmentIndex]) {
      segmentRefs.current[currentSegmentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSegmentIndex]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopPlayback();
    };
  }, []);

  const getVoiceMap = useCallback(() => {
    if (!config) return new Map<string, VoiceSetting>();

    const podcastNameToVoiceSettingMap = new Map<string, VoiceSetting>();
    let hostVoiceSetting: VoiceSetting | undefined;

    for (const voiceSetting of config.voiceMapping.values()) {
      podcastNameToVoiceSettingMap.set(voiceSetting.podcastName, voiceSetting);
      if (voiceSetting.podcastName.toLowerCase().includes('host')) {
        hostVoiceSetting = voiceSetting;
      }
    }

    const hasNarrator = editableScript.segments.some(s => s.speaker === 'NARRATOR');
    if (hasNarrator && !podcastNameToVoiceSettingMap.has('NARRATOR')) {
      if (hostVoiceSetting) {
        podcastNameToVoiceSettingMap.set('NARRATOR', hostVoiceSetting);
      } else if (config.voiceMapping.size > 0) {
        const firstVoice = config.voiceMapping.values().next().value;
        if (firstVoice) {
          podcastNameToVoiceSettingMap.set('NARRATOR', firstVoice);
        }
      }
    }
    return podcastNameToVoiceSettingMap;
  }, [config, editableScript.segments]);
  
  const playFrom = useCallback(async (startIndex = 0) => {
    setError('');
    const voiceMap = getVoiceMap();
    if (voiceMap.size === 0) {
      setError("No voice configuration found. Please assign voices in the settings.");
      return;
    }
    
    setIsPlaying(true);
    const onSegmentStart = (index: number) => {
      setCurrentSegmentIndex(index);
      return true;
    };
    const onFinish = () => {
      setIsPlaying(false);
      setCurrentSegmentIndex(null);
    };
    const onError = (message: string) => {
      setError(`Audio Playback Error: ${String(message)}`);
      setIsPlaying(false);
      setCurrentSegmentIndex(null);
    };
    await playScript(editableScript.segments, voiceMap, onSegmentStart, onFinish, onError, startIndex);
  }, [editableScript.segments, getVoiceMap, setError]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await stopPlayback();
      // The onFinish callback in playScript handles state updates, so we don't need to do it here.
    } else {
      await playFrom(currentSegmentIndex ?? 0);
    }
  };
  
  const handleNext = async () => {
    if (currentSegmentIndex !== null && currentSegmentIndex < editableScript.segments.length - 1) {
      await playFrom(currentSegmentIndex + 1);
    }
  };

  const handlePrev = async () => {
    if (currentSegmentIndex !== null && currentSegmentIndex > 0) {
      await playFrom(currentSegmentIndex - 1);
    }
  };

  const handleSeek = async (index: number) => {
    if (currentSegmentIndex === index && isPlaying) return; // Don't restart if clicking the currently playing segment
    await playFrom(index);
  };

  const handleSaveEditedSegment = (updatedSegment: ScriptSegment, index: number) => {
    const newSegments = [...editableScript.segments];
    newSegments[index] = updatedSegment;
    setEditableScript(prev => ({ ...prev, segments: newSegments }));
    setEditingSegment(null);
  };

  const handleDownloadScript = () => {
    if (!config) { 
        setError("Cannot download project: Configuration is missing.");
        return; 
    }

    const serializableConfig: SerializablePodcastConfig = {
      ...config,
      voiceMapping: Array.from(config.voiceMapping.entries()),
    };

    const projectFile: PodcastProjectFile = {
      version: '1.1', // Mark as edited
      generatedScript: editableScript, // Save the edited version
      podcastConfig: serializableConfig,
      analysisResult: analysis,
    };

    const content = JSON.stringify(projectFile, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editableScript.title.replace(/\s/g, '_') || 'podcast'}_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-8">
      {editingSegment && (
        <SegmentEditorModal
          segment={editingSegment.segment}
          onSave={(updatedSegment) => handleSaveEditedSegment(updatedSegment, editingSegment.index)}
          onClose={() => setEditingSegment(null)}
        />
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <button onClick={onBack} className="flex items-center text-sm text-dark-text-secondary hover:text-brand-secondary transition-colors mb-2">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Settings
          </button>
          <h2 className="text-3xl font-bold text-white">{editableScript.title}</h2>
          <p className="text-dark-text-secondary mt-1">{editableScript.hook}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3">
          <button onClick={handleDownloadScript} className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center">
            <DownloadIcon className="w-5 h-5 mr-2" />
            Download Project
          </button>
           <button onClick={onReset} className="text-sm text-dark-text-secondary hover:text-red-500 transition-colors">
            Start Over
          </button>
        </div>
      </div>
      
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
        <PlayerControls
            segments={editableScript.segments}
            isPlaying={isPlaying}
            currentSegmentIndex={currentSegmentIndex}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={handleSeek}
        />

        <div className="mt-6 max-h-[60vh] overflow-y-auto space-y-4 pr-2">
          {editableScript.segments.map((segment, index) => (
            <div
              key={`${editableScript.id}-${index}`}
              ref={el => segmentRefs.current[index] = el}
              onClick={() => handleSeek(index)}
              className={`p-4 rounded-lg transition-all duration-300 cursor-pointer group ${currentSegmentIndex === index ? 'bg-brand-secondary/20 ring-2 ring-brand-secondary' : 'bg-dark-bg hover:bg-dark-border/50'}`}
            >
              <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-dark-border flex items-center justify-center mr-4 flex-shrink-0">
                      <BotIcon className="w-6 h-6 text-brand-accent"/>
                  </div>
                  <div className="flex-grow">
                      <p className="font-bold text-white">{segment.speaker}</p>
                      <p className="text-dark-text leading-relaxed whitespace-pre-wrap">{segment.editedLine ?? segment.line}</p>
                      {segment.sfx && <p className="text-xs text-dark-text-secondary italic mt-1">[{segment.sfx}]</p>}
                  </div>
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSegment({ segment, index });
                      }}
                      className="ml-4 p-2 rounded-full bg-dark-border/50 text-dark-text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-secondary hover:text-white"
                      aria-label="Edit segment"
                    >
                      <PencilIcon className="w-4 h-4" />
                   </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};