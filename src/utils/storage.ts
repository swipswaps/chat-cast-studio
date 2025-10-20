// File: src/utils/storage.ts
// PRF-COMPLIANT UTILITY
// Purpose: Persistent storage helper for saving and loading podcast settings.
// Uses browser localStorage, automatically handles JSON parsing/stringification.

export interface StoredSettings {
  language?: string;
  voice?: string;
  speed?: number;
  narrationStyle?: 'overview' | 'balanced' | 'technical';
  abstractionLevel?: 'high' | 'medium' | 'low';
  tone?: 'informative' | 'conversational' | 'humorous' | 'documentary';
  summaryLength?: 'short' | 'medium' | 'long';
}

/**
 * Save user settings persistently to localStorage.
 * @param settings - PodcastSettings object or partial subset
 */
export function saveSettings(settings: StoredSettings): void {
  try {
    localStorage.setItem('chatcast_settings', JSON.stringify(settings));
    console.log('💾 [Storage] Settings saved:', settings);
  } catch (err) {
    console.error('⚠️ Failed to save settings to localStorage', err);
  }
}

/**
 * Load user settings from localStorage.
 * @returns The stored settings object, or null if unavailable
 */
export function loadSettings(): StoredSettings | null {
  try {
    const raw = localStorage.getItem('chatcast_settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    console.log('📦 [Storage] Loaded settings:', parsed);
    return parsed;
  } catch (err) {
    console.error('⚠️ Failed to load settings from localStorage', err);
    return null;
  }
}
