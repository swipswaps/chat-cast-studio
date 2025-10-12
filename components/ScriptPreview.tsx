import React, { useState, useEffect, useRef } from 'react';
import type { GeneratedScript, PodcastConfig, AnalysisResult, VoiceSetting, SerializablePodcastConfig, PodcastProjectFile } from '../types';
import { playScript, stopPlayback } from '../services/audioService';
import { ArrowLeftIcon, BotIcon, DownloadIcon, PlayIcon, SquareIcon } from './icons';

interface ScriptPreviewProps {
  script: GeneratedScript;
  config: PodcastConfig | null;
  analysis: AnalysisResult;
  onBack: () => void;
  onReset: () => void;
  setError: (error: string) => void;
}

export const ScriptPreview: React.FC<ScriptPreviewProps> = ({ script, config, analysis, onBack, onReset, setError }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  const handlePlayPause = () => {
    setError(''); // Clear previous errors
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      setCurrentSegmentIndex(null);
    } else {
      if (!config) return;

      // Create a new map from Podcast Name -> Voice Setting.
      // This is the critical fix: the script uses podcast names (e.g., "Host"),
      // but the original config map is keyed by original role (e.g., "user").
      const podcastNameToVoiceSettingMap = new Map<string, VoiceSetting>();
      let hostVoiceSetting: VoiceSetting | undefined;

      // 1. Populate the map with configured speakers
      for (const voiceSetting of config.voiceMapping.values()) {
        podcastNameToVoiceSettingMap.set(voiceSetting.podcastName, voiceSetting);
        // Heuristically find the 'Host' voice for the Narrator
        if (voiceSetting.podcastName.toLowerCase().includes('host')) {
            hostVoiceSetting = voiceSetting;
        }
      }

      // 2. Assign a voice to the 'NARRATOR' role if it exists in the script.
      const hasNarrator = script.segments.some(s => s.speaker === 'NARRATOR');
      if (hasNarrator && !podcastNameToVoiceSettingMap.has('NARRATOR')) {
        // Use the found Host voice if available
        if (hostVoiceSetting) {
            podcastNameToVoiceSettingMap.set('NARRATOR', hostVoiceSetting);
        } else if (config.voiceMapping.size > 0) {
            // As a fallback, use the first voice from the original mapping
            const firstVoice = config.voiceMapping.values().next().value;
            if (firstVoice) {
                podcastNameToVoiceSettingMap.set('NARRATOR', firstVoice);
            }
        }
      }

      setIsPlaying(true);
      const onSegmentStart = (index: number) => {
        setCurrentSegmentIndex(index);
        return true; // continue playback
      };
      const onFinish = () => {
        setIsPlaying(false);
        setCurrentSegmentIndex(null);
      };
      const onError = (message: string) => {
        setError(`Audio Playback Error: ${message}`);
        setIsPlaying(false);
        setCurrentSegmentIndex(null);
      };
      playScript(script.segments, podcastNameToVoiceSettingMap, onSegmentStart, onFinish, onError);
    }
  };

  const handleDownloadScript = () => {
    if (!config) {
      // Fallback for safety, though config should always exist here.
      const scriptContent = JSON.stringify(script, null, 2);
      const blob = new Blob([scriptContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${script.title.replace(/\s/g, '_') || 'podcast_script'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // Create a serializable version of the config
    const serializableConfig: SerializablePodcastConfig = {
      ...config,
      voiceMapping: Array.from(config.voiceMapping.entries()),
    };

    // Create the full project file object
    const projectFile: PodcastProjectFile = {
      version: '1.0',
      generatedScript: script,
      podcastConfig: serializableConfig,
      analysisResult: analysis,
    };

    const content = JSON.stringify(projectFile, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.title.replace(/\s/g, '_') || 'podcast'}_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <button onClick={onBack} className="flex items-center text-sm text-dark-text-secondary hover:text-brand-secondary transition-colors mb-2">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Settings
          </button>
          <h2 className="text-3xl font-bold text-white">{script.title}</h2>
          <p className="text-dark-text-secondary mt-1">{script.hook}</p>
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
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Podcast Preview</h3>
            <button
                onClick={handlePlayPause}
                className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md transition-all duration-300 flex items-center min-w-[120px] justify-center"
            >
                {isPlaying ? (
                    <>
                        <SquareIcon className="w-5 h-5 mr-2" />
                        Stop
                    </>
                ) : (
                    <>
                        <PlayIcon className="w-5 h-5 mr-2" />
                        Play
                    </>
                )}
            </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
          {script.segments.map((segment, index) => (
            <div
              key={`${script.id}-${index}`}
              ref={el => segmentRefs.current[index] = el}
              className={`p-4 rounded-lg transition-all duration-300 ${currentSegmentIndex === index ? 'bg-brand-secondary/20 ring-2 ring-brand-secondary' : 'bg-dark-bg'}`}
            >
              <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-dark-border flex items-center justify-center mr-4 flex-shrink-0">
                      <BotIcon className="w-6 h-6 text-brand-accent"/>
                  </div>
                  <div>
                      <p className="font-bold text-white">{segment.speaker}</p>
                      <p className="text-dark-text leading-relaxed">{segment.line}</p>
                      {segment.sfx && <p className="text-xs text-dark-text-secondary italic mt-1">[{segment.sfx}]</p>}
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};