import React, { useState, useEffect, useMemo } from 'react';
import type { PodcastConfig, AnalysisResult, BrowserVoice, VoiceSetting } from '../types';
import { PODCAST_STYLES, TECHNICALITY_LEVELS } from '../constants';
import { getBrowserVoices } from '../services/browserTtsService';
import { SparklesIcon, SlidersHorizontalIcon, MicIcon } from './icons';

interface PodcastSettingsProps {
  analysis: AnalysisResult;
  onConfigSubmit: (config: PodcastConfig) => void;
}

const DEFAULT_PODCAST_NAMES = ['Host', 'Guest', 'Narrator', 'Analyst', 'Expert'];

export const PodcastSettings: React.FC<PodcastSettingsProps> = ({ analysis, onConfigSubmit }) => {
  const [styleId, setStyleId] = useState(PODCAST_STYLES[0].id);
  const [technicalityId, setTechnicalityId] = useState(TECHNICALITY_LEVELS[1].id);
  const [includeMusic, setIncludeMusic] = useState(true);
  const [includeSfx, setIncludeSfx] = useState(true);
  const [voiceMapping, setVoiceMapping] = useState<Map<string, VoiceSetting>>(new Map());
  const [browserVoices, setBrowserVoices] = useState<BrowserVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);

  useEffect(() => {
    const initialMapping = new Map<string, VoiceSetting>();
    analysis.speakers.forEach((speaker, index) => {
      initialMapping.set(speaker, {
        podcastName: DEFAULT_PODCAST_NAMES[index] || `Speaker ${index + 1}`,
        voiceId: '',
      });
    });
    setVoiceMapping(initialMapping);
  }, [analysis.speakers]);

  useEffect(() => {
    async function fetchVoices() {
      setVoicesLoading(true);
      try {
        const browser = await getBrowserVoices();
        setBrowserVoices(browser);

        // Set default voices once loaded
        setVoiceMapping(prevMapping => {
          const newMapping = new Map(prevMapping);
          let browserVoiceIndex = 0;
          newMapping.forEach((setting, originalRole) => {
            if (!setting.voiceId && browser.length > 0) {
              const defaultVoice = browser[browserVoiceIndex % browser.length];
              newMapping.set(originalRole, { ...setting, voiceId: defaultVoice.voiceURI });
              browserVoiceIndex++;
            }
          });
          return newMapping;
        });
      } catch (error) {
        console.error("Failed to load browser voices:", error);
      } finally {
        setVoicesLoading(false);
      }
    }
    fetchVoices();
  }, []);

  const handleVoiceSettingChange = (
    originalRole: string,
    field: keyof VoiceSetting,
    value: string
  ) => {
    setVoiceMapping(prev => {
      const newMapping = new Map(prev);
      const currentSetting = newMapping.get(originalRole);
      if (currentSetting) {
        const updatedSetting = { ...currentSetting, [field]: value };
        newMapping.set(originalRole, updatedSetting);
      }
      return newMapping;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const style = PODCAST_STYLES.find(s => s.id === styleId);
    const technicality = TECHNICALITY_LEVELS.find(t => t.id === technicalityId);
    if (style && technicality) {
      onConfigSubmit({
        style,
        technicality,
        voiceMapping,
        includeMusic,
        includeSfx,
      });
    }
  };

  const selectedStyle = useMemo(() => PODCAST_STYLES.find(s => s.id === styleId), [styleId]);
  const selectedTechLevel = useMemo(() => TECHNICALITY_LEVELS.find(t => t.id === technicalityId), [technicalityId]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* --- Style & Technicality --- */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center"><SlidersHorizontalIcon className="w-6 h-6 mr-3 text-brand-accent" />Podcast Settings</h2>
        
        <div className="mb-6">
          <label htmlFor="style" className="block text-lg font-semibold mb-2">Podcast Style</label>
          <select id="style" value={styleId} onChange={e => setStyleId(e.target.value)} className="w-full p-3 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary focus:outline-none">
            {PODCAST_STYLES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <p className="text-sm text-dark-text-secondary mt-2">{selectedStyle?.description}</p>
        </div>

        <div>
          <label htmlFor="technicality" className="block text-lg font-semibold mb-2">Technicality Level</label>
          <select id="technicality" value={technicalityId} onChange={e => setTechnicalityId(e.target.value)} className="w-full p-3 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary focus:outline-none">
            {TECHNICALITY_LEVELS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <p className="text-sm text-dark-text-secondary mt-2">{selectedTechLevel?.description}</p>
        </div>
      </div>

      {/* --- Voice Casting --- */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center"><MicIcon className="w-6 h-6 mr-3 text-brand-accent" />Voice Casting</h2>
        <p className="text-dark-text-secondary mb-4">Assign a podcast name and a free browser voice for each speaker.</p>
        {voicesLoading && <p>Loading voices...</p>}
        <div className="space-y-4">
          {Array.from(voiceMapping.entries()).map(([originalRole, setting]) => (
            <div key={originalRole} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dark-bg rounded-md border border-dark-border">
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary">Original Role</label>
                <p className="font-bold capitalize">{originalRole}</p>
              </div>
              <div>
                <label htmlFor={`podcastName-${originalRole}`} className="block text-sm font-medium text-dark-text-secondary">Podcast Name</label>
                <input
                  id={`podcastName-${originalRole}`}
                  type="text"
                  value={setting.podcastName}
                  onChange={e => handleVoiceSettingChange(originalRole, 'podcastName', e.target.value)}
                  className="w-full p-2 bg-dark-card border border-dark-border rounded-md"
                />
              </div>
              <div>
                <label htmlFor={`voice-${originalRole}`} className="block text-sm font-medium text-dark-text-secondary">Voice</label>
                <select
                  id={`voice-${originalRole}`}
                  value={setting.voiceId}
                  onChange={e => handleVoiceSettingChange(originalRole, 'voiceId', e.target.value)}
                  className="w-full p-2 bg-dark-card border border-dark-border rounded-md"
                  disabled={voicesLoading || browserVoices.length === 0}
                >
                  {browserVoices.length > 0 ? (
                    browserVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)
                  ) : (
                    <option>No browser voices found</option>
                  )}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Production Details --- */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Production Details</h2>
          <div className="flex items-center space-x-8">
              <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={includeMusic} onChange={e => setIncludeMusic(e.target.checked)} className="form-checkbox h-5 w-5 text-brand-secondary bg-dark-bg border-dark-border rounded focus:ring-brand-secondary"/>
                  <span className="ml-2 text-white">Include Background Music</span>
              </label>
              <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={includeSfx} onChange={e => setIncludeSfx(e.target.checked)} className="form-checkbox h-5 w-5 text-brand-secondary bg-dark-bg border-dark-border rounded focus:ring-brand-secondary"/>
                  <span className="ml-2 text-white">Include Sound Effects</span>
              </label>
          </div>
      </div>

      <button type="submit" className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-all duration-300">
        <SparklesIcon className="w-6 h-6 mr-2" />
        Generate Podcast Script
      </button>
    </form>
  );
};
