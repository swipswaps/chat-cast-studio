import React, { useState } from 'react';
import type { ApiKeys } from '../types';
import { KeyRoundIcon } from './icons';

interface ApiSettingsProps {
  currentKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
  onClose: () => void;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({ currentKeys, onSave, onClose }) => {
  const [keys, setKeys] = useState<ApiKeys>(currentKeys);

  const handleSave = () => {
    onSave(keys);
  };
  
  const handleChange = (service: keyof ApiKeys, value: string) => {
    // Trim whitespace to prevent copy-paste errors
    setKeys(prev => ({...prev, [service]: value.trim()}));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-dark-card rounded-lg border border-dark-border shadow-2xl p-6 sm:p-8 w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
            <KeyRoundIcon className="w-6 h-6 mr-3 text-brand-accent"/>
            <h2 className="text-2xl font-bold text-white">API Key Settings</h2>
        </div>
        
        <p className="text-sm text-dark-text-secondary mb-6">
          Optionally, add API keys for third-party services like text-to-speech generators. Keys are saved only in your browser's local storage and are not sent anywhere else.
        </p>

        <div className="space-y-4">
            <div>
                <label htmlFor="elevenlabs-key" className="block text-sm font-medium text-dark-text mb-1">ElevenLabs API Key</label>
                <input
                    id="elevenlabs-key"
                    type="password"
                    placeholder="Enter your ElevenLabs API Key"
                    value={keys.elevenLabs}
                    onChange={(e) => handleChange('elevenLabs', e.target.value)}
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary focus:outline-none transition-shadow"
                />
            </div>
            {/* Future API key inputs can be added here */}
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-brand-secondary hover:bg-brand-primary text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};