import React from 'react';
import type { AnalysisResult } from '../types';

interface AnalysisSummaryProps {
  analysis: AnalysisResult;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ analysis }) => {
  return (
    <div className="analysis-summary">
      <h3>Analysis Summary</h3>
      <p>Speakers: {analysis.speakers.join(', ')}</p>
      <p>Messages: {analysis.messageCount}</p>
      <p>Words: {analysis.wordCount}</p>
      <p>Estimated Duration: {analysis.estimatedDurationMinutes} min</p>
      {analysis.codeBlockCount !== undefined && <p>Code Blocks: {analysis.codeBlockCount}</p>}
      {analysis.proseToCodeRatio && <p>Prose/Code Ratio: {analysis.proseToCodeRatio}</p>}
      {analysis.summary && <p>Summary: {analysis.summary}</p>}
      {analysis.keywords && <p>Keywords: {analysis.keywords.join(', ')}</p>}
      {analysis.sentiment && <p>Sentiment: {analysis.sentiment}</p>}
    </div>
  );
};
