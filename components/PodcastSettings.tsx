
import React from 'react';
import type { AnalysisResult, PodcastConfig } from '../types';
import { PODCAST_STYLES, TECHNICALITY_LEVELS } from '../constants';
import { SlidersHorizontalIcon, MicIcon, SparklesIcon } from './icons';
import { AnalysisSummary } from './AnalysisSummary';

interface PodcastSettingsProps {
  analysis: AnalysisResult;
  config: PodcastConfig;
  setConfig: React.Dispatch<React.SetStateAction<PodcastConfig | null>>;
  onGenerate: () => void;
}

export const PodcastSettings: React.FC<PodcastSettingsProps> = ({ analysis, config, setConfig, onGenerate }) => {
  const handleStyleChange = (styleId: string) => {
    const newStyle = PODCAST_STYLES.find(s => s.id === styleId);
    if (newStyle) {
      setConfig(prev => prev ? { ...prev, style: newStyle } : null);
    }
  };

  const handleTechnicalityChange = (levelId: string) => {
    const newLevel = TECHNICALITY_LEVELS.find(l => l.id === levelId);
    if (newLevel) {
      setConfig(prev => prev ? { ...prev, technicality: newLevel } : null);
    }
  };

  const handleVoiceMappingChange = (speaker: string, newVoice: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const newMap = new Map(prev.voiceMapping);
      newMap.set(speaker, newVoice);
      return { ...prev, voiceMapping: newMap };
    });
  };

  return (
    <div className="space-y-8">
      <AnalysisSummary analysis={analysis} />

      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <SlidersHorizontalIcon className="w-6 h-6 mr-3 text-brand-accent" />
          Configure Your Podcast
        </h2>

        {/* Podcast Style Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Podcast Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PODCAST_STYLES.map(style => (
              <label key={style.id} className={`p-4 border rounded-lg cursor-pointer transition-all ${config.style.id === style.id ? 'bg-brand-primary border-brand-secondary ring-2 ring-brand-secondary' : 'bg-dark-bg border-dark-border hover:border-brand-accent'}`}>
                <input
                  type="radio"
                  name="podcast-style"
                  value={style.id}
                  checked={config.style.id === style.id}
                  onChange={() => handleStyleChange(style.id)}
                  className="hidden"
                />
                <div className="font-bold text-white">{style.name}</div>
                <p className="text-sm text-dark-text-secondary">{style.description}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Technicality Level */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Technicality Level</h3>
          <div className="flex flex-col sm:flex-row bg-dark-bg rounded-lg p-1 border border-dark-border">
            {TECHNICALITY_LEVELS.map(level => (
              <button
                key={level.id}
                onClick={() => handleTechnicalityChange(level.id)}
                className={`flex-1 p-2 text-sm rounded-md transition-colors ${config.technicality.id === level.id ? 'bg-brand-secondary text-white font-bold' : 'hover:bg-dark-border'}`}
              >
                {level.name}
              </button>
            ))}
          </div>
           <p className="text-sm text-dark-text-secondary mt-2">{config.technicality.description}</p>
        </div>

        {/* Voice Mapping */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <MicIcon className="w-5 h-5 mr-2 text-brand-accent" />
            Voice Assignment
          </h3>
          <div className="space-y-3">
            {analysis.speakers.map(speaker => (
              <div key={speaker} className="grid grid-cols-3 items-center gap-4">
                <span className="font-medium col-span-1 capitalize">{speaker}:</span>
                <input
                  type="text"
                  value={config.voiceMapping.get(speaker) || ''}
                  onChange={(e) => handleVoiceMappingChange(speaker, e.target.value)}
                  className="col-span-2 w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary focus:outline-none transition-shadow"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={onGenerate}
          className="bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center text-lg"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          Generate Script
        </button>
      </div>
    </div>
  );
};
