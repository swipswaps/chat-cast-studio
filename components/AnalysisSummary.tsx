

import React from 'react';
import type { AnalysisResult } from '../types';
// FIX: Corrected import path for icons
import { BotIcon, ClockIcon, FileTextIcon, MessageSquareIcon, CodeIcon, PercentIcon } from './icons';

interface AnalysisSummaryProps {
  analysis: AnalysisResult;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-dark-bg p-4 rounded-lg flex items-center">
        <div className="mr-4 text-brand-accent">{icon}</div>
        <div>
            <div className="text-sm text-dark-text-secondary">{label}</div>
            <div className="text-xl font-bold text-white">{value}</div>
        </div>
    </div>
);

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ analysis }) => {
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Chat Analysis</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<BotIcon className="w-8 h-8"/>} label="Speakers" value={analysis.speakers.length} />
        <StatCard icon={<MessageSquareIcon className="w-8 h-8"/>} label="Messages" value={analysis.messageCount} />
        <StatCard icon={<FileTextIcon className="w-8 h-8"/>} label="Word Count" value={analysis.wordCount.toLocaleString()} />
        <StatCard icon={<ClockIcon className="w-8 h-8"/>} label="Est. Duration" value={`${analysis.estimatedDurationMinutes} min`} />
        <StatCard icon={<CodeIcon className="w-8 h-8"/>} label="Code Blocks" value={analysis.codeBlockCount} />
        <StatCard icon={<PercentIcon className="w-8 h-8"/>} label="Prose/Code" value={analysis.proseToCodeRatio} />
      </div>
    </div>
  );
};