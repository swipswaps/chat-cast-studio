// File: src/components/AnalysisSummary.tsx
// PRF-COMPLIANT FULL VERSION
// Purpose: Display a detailed summary of chat analysis in the podcast.
// Includes styled cards for stats and optional summary, keywords, sentiment info.

import React from "react";

// Importing icon components to visually represent each stat.
import { BotIcon, ClockIcon, FileTextIcon, MessageSquareIcon, CodeIcon, PercentIcon } from './icons';

// Props expected by the component.
interface AnalysisSummaryProps {
  analysis: {
    speakers: string[];
    messageCount: number;
    wordCount: number;
    estimatedDurationMinutes: number;
    codeBlockCount?: number;
    proseToCodeRatio?: string;
    summary?: string;
    keywords?: string[];
    sentiment?: string;
  };
}

// StatCard component: a reusable UI element for each statistic
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="bg-dark-bg p-4 rounded-lg flex items-center">
    <div className="mr-4 text-brand-accent">{icon}</div>
    <div>
      <div className="text-sm text-dark-text-secondary">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  </div>
);

// Main AnalysisSummary component
export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ analysis }) => {
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg space-y-4">
      <h2 className="text-2xl font-bold text-white">Chat Analysis</h2>

      {/* Grid layout for primary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<BotIcon className="w-8 h-8" />} label="Speakers" value={analysis.speakers.length} />
        <StatCard icon={<MessageSquareIcon className="w-8 h-8" />} label="Messages" value={analysis.messageCount} />
        <StatCard icon={<FileTextIcon className="w-8 h-8" />} label="Word Count" value={analysis.wordCount.toLocaleString()} />
        <StatCard icon={<ClockIcon className="w-8 h-8" />} label="Est. Duration" value={`${analysis.estimatedDurationMinutes} min`} />
        {analysis.codeBlockCount !== undefined && (
          <StatCard icon={<CodeIcon className="w-8 h-8" />} label="Code Blocks" value={analysis.codeBlockCount} />
        )}
        {analysis.proseToCodeRatio && (
          <StatCard icon={<PercentIcon className="w-8 h-8" />} label="Prose/Code" value={analysis.proseToCodeRatio} />
        )}
      </div>

      {/* Optional textual summary for additional info */}
      {analysis.summary && <p className="text-sm text-dark-text-secondary mt-2">Summary: {analysis.summary}</p>}
      {analysis.keywords && <p className="text-sm text-dark-text-secondary mt-1">Keywords: {analysis.keywords.join(', ')}</p>}
      {analysis.sentiment && <p className="text-sm text-dark-text-secondary mt-1">Sentiment: {analysis.sentiment}</p>}
    </div>
  );
};
