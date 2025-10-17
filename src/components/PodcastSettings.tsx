/**
 * PRF-COMPLIANT FILE — ChatCast Studio (2025-10-17)
 * PodcastSettings.tsx — Unified voice + style configuration panel.
 * 
 * Fixes:
 *  - Eliminates TS2322 errors for <select> by mapping object <-> string id.
 *  - Ensures PodcastStyle always stored as object (PodcastStyleObject).
 *  - Adds clear type safety and developer commentary for each step.
 */

import React from 'react';
import type { PodcastConfig, PodcastStyleObject } from '../types';

interface PodcastSettingsProps {
  config: PodcastConfig;
  onChange: (config: PodcastConfig) => void;
}

/**
 * Internal catalog of supported podcast styles.
 * Each style has a stable `id` (for React keys and <select> values),
 * a human-friendly name, and a short description for AI context.
 */
const styles: PodcastStyleObject[] = [
  { id: 'informative', name: 'Informative', description: 'Clear, factual presentation.' },
  { id: 'conversational', name: 'Conversational', description: 'Friendly, chatty, spontaneous.' },
  { id: 'narrative', name: 'Narrative', description: 'Story-driven, cinematic pacing.' },
];

export const PodcastSettings: React.FC<PodcastSettingsProps> = ({ config, onChange }) => {
  /**
   * Voice handler — simple text input for custom voice ID or name.
   */
  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, voice: e.target.value });
  };

  /**
   * Style handler — lookup selected style by id string.
   * Ensures PodcastConfig.style is always a full object, not a string literal.
   */
  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = styles.find((s) => s.id === e.target.value);
    if (selected) {
      onChange({ ...config, style: selected });
    }
  };

  /**
   * Derive current style ID (so the <select> stays controlled even if config.style is a string).
   */
  const currentStyleId =
    typeof config.style === 'string'
      ? config.style
      : (config.style as PodcastStyleObject)?.id || styles[0].id;

  return (
    <div className="podcast-settings space-y-2">
      <label className="block">
        <span className="font-semibold">Voice:</span>
        <input
          type="text"
          value={config.voice}
          onChange={handleVoiceChange}
          className="border rounded p-1 w-full"
          placeholder="Enter voice name or ID"
        />
      </label>

      <label className="block">
        <span className="font-semibold">Style:</span>
        <select
          value={currentStyleId}
          onChange={handleStyleChange}
          className="border rounded p-1 w-full"
        >
          {styles.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
