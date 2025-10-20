// File: src/components/PodcastSettings.tsx
// PRF-COMPLIANT — fully CSS variable-based theme

import React, { useState, useEffect, useRef } from 'react';
import { saveSettings, loadSettings } from '../utils/storage';

export interface PodcastSettingsShape {
  language: string;
  voice: string;
  speed: number;
  narrationStyle: 'overview' | 'balanced' | 'technical';
  abstractionLevel: 'high' | 'medium' | 'low';
  tone: 'informative' | 'conversational' | 'humorous' | 'documentary';
  summaryLength: 'short' | 'medium' | 'long';
}

export type PodcastSettingsProps = {
  analysis?: any;
  onChange: (cfg: PodcastSettingsShape) => void;
};

export function PodcastSettingsComponent({ onChange }: PodcastSettingsProps) {
  const [settings, setSettings] = useState<PodcastSettingsShape>(() => {
    const saved = loadSettings();
    return saved || {
      language: 'en',
      voice: 'default',
      speed: 1.0,
      narrationStyle: 'overview',
      abstractionLevel: 'high',
      tone: 'informative',
      summaryLength: 'medium',
    };
  });

  const prevSettingsRef = useRef<PodcastSettingsShape>(settings);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const prev = prevSettingsRef.current;
      const hasChanged = Object.keys(settings).some(
        (key) => (settings as any)[key] !== (prev as any)[key]
      );
      if (hasChanged) {
        saveSettings(settings);
        onChange?.(settings);
        prevSettingsRef.current = settings;
      }
    }, 100);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [settings, onChange]);

  const handleFieldChange = <K extends keyof PodcastSettingsShape>(
    field: K,
    value: PodcastSettingsShape[K]
  ) => setSettings((prev) => ({ ...prev, [field]: value }));

  return (
    <div
      className="p-5 rounded-lg shadow-md border"
      style={{
        backgroundColor: 'var(--bg-dark-bg)',
        color: 'var(--text-dark-text)',
        borderColor: 'var(--border-dark)',
      }}
    >
      <h2 className="text-2xl font-semibold mb-4">Podcast Settings</h2>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block mb-1 text-sm font-medium">Language</label>
          <select
            value={settings.language}
            onChange={(e) => handleFieldChange('language', e.target.value)}
            style={{
              backgroundColor: 'var(--bg-dark-bg)',
              color: 'var(--text-dark-text)',
              borderColor: 'var(--border-dark)',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              width: '100%',
            }}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Voice</label>
          <input
            type="text"
            value={settings.voice}
            placeholder="default / narrator / storyteller"
            onChange={(e) => handleFieldChange('voice', e.target.value)}
            style={{
              backgroundColor: 'var(--bg-dark-bg)',
              color: 'var(--text-dark-text)',
              borderColor: 'var(--border-dark)',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              width: '100%',
            }}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Speech Speed</label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settings.speed}
            onChange={(e) => handleFieldChange('speed', parseFloat(e.target.value))}
            style={{ accentColor: 'var(--accent-blue)', width: '100%' }}
          />
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#9CA3AF' }}>
            Speed: {settings.speed.toFixed(1)}x
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[
          { label: 'Narration Style', field: 'narrationStyle', options: ['overview','balanced','technical'] },
          { label: 'Abstraction Level', field: 'abstractionLevel', options: ['high','medium','low'] },
          { label: 'Tone', field: 'tone', options: ['informative','conversational','humorous','documentary'] },
          { label: 'Summary Length', field: 'summaryLength', options: ['short','medium','long'] },
        ].map(({ label, field, options }) => (
          <div key={field}>
            <label className="block mb-1 text-sm font-medium">{label}</label>
            <select
              value={(settings as any)[field]}
              onChange={(e) => handleFieldChange(field as any, e.target.value)}
              style={{
                backgroundColor: 'var(--bg-dark-bg)',
                color: 'var(--text-dark-text)',
                borderColor: 'var(--border-dark)',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                width: '100%',
              }}
            >
              {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export const PodcastSettings = PodcastSettingsComponent;
export default PodcastSettingsComponent;
