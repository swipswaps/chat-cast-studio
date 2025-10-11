
import React from 'react';
import { PodcastIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-dark-card border-b border-dark-border shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <PodcastIcon className="w-10 h-10 text-brand-primary mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-white">Chat2Podcast</h1>
          <p className="text-sm text-dark-text-secondary">Transform your chat logs into engaging podcasts with AI.</p>
        </div>
      </div>
    </header>
  );
};
