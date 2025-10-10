import React from 'react';
import { PodcastIcon, SettingsIcon } from './icons';

interface HeaderProps {
    onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  return (
    <header className="relative text-center mb-8">
        <div className="flex items-center justify-center mb-2">
            <PodcastIcon className="w-10 h-10 text-brand-secondary mr-3"/>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Chatcast Studio
            </h1>
        </div>
      <p className="text-lg text-dark-text-secondary">
        Turn your chat logs into studio-quality podcast scripts with AI.
      </p>
      <button 
        onClick={onSettingsClick} 
        className="absolute top-0 right-0 p-2 text-dark-text-secondary hover:text-white transition-colors"
        aria-label="Settings"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>
    </header>
  );
};