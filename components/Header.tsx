
import React from 'react';
import { PodcastIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="text-center mb-8">
        <div className="flex items-center justify-center mb-2">
            <PodcastIcon className="w-10 h-10 text-brand-secondary mr-3"/>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Chatcast Studio
            </h1>
        </div>
      <p className="text-lg text-dark-text-secondary">
        Turn your chat logs into studio-quality podcast scripts with AI.
      </p>
    </header>
  );
};
