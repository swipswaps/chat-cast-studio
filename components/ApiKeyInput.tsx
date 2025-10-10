
import React, { useState } from 'react';
import { KeyRoundIcon } from './icons';

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
  error?: string;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSubmit, error }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(key);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-dark-card rounded-lg border border-dark-border shadow-lg max-w-md mx-auto">
      <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center mb-6">
        <KeyRoundIcon className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Enter Your Gemini API Key</h2>
      <p className="text-center text-dark-text-secondary mb-6">
        Your API key is required to generate podcast scripts. It is not stored and only used for this session.
      </p>
      <form onSubmit={handleSubmit} className="w-full">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your Gemini API Key"
          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary focus:outline-none transition-shadow"
        />
        {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full mt-4 bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-4 rounded-md transition-all duration-300 transform hover:scale-105 shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed"
          disabled={!key}
        >
          Continue
        </button>
      </form>
      <p className="text-xs text-dark-text-secondary mt-4">
        You can get an API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Google AI Studio</a>.
      </p>
    </div>
  );
};
