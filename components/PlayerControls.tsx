import React from 'react';
import type { ScriptSegment } from '../types';
import { PlayIcon, SquareIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PlayerControlsProps {
  segments: ScriptSegment[];
  isPlaying: boolean;
  currentSegmentIndex: number | null;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (index: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  segments,
  isPlaying,
  currentSegmentIndex,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
}) => {
  const totalDuration = segments.reduce((sum, seg) => sum + (seg.line.length || 1), 0);

  return (
    <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-4">
      {/* Visual Timeline */}
      <div className="flex w-full h-8 bg-dark-border rounded-md overflow-hidden cursor-pointer">
        {segments.map((segment, index) => {
          const segmentWidth = ((segment.line.length || 1) / totalDuration) * 100;
          return (
            <div
              key={index}
              onClick={() => onSeek(index)}
              className={`h-full transition-all duration-200 ${currentSegmentIndex === index ? 'bg-brand-primary' : 'bg-brand-secondary/50 hover:bg-brand-secondary'}`}
              style={{ width: `${segmentWidth}%` }}
              title={`Segment ${index + 1}: ${segment.speaker}`}
            ></div>
          );
        })}
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button 
            onClick={onPrev} 
            disabled={currentSegmentIndex === 0 || currentSegmentIndex === null}
            className="p-2 rounded-full text-white bg-brand-secondary/50 hover:bg-brand-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous segment"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        
        <button
          onClick={onPlayPause}
          className="p-4 rounded-full text-white bg-brand-primary hover:bg-brand-secondary transition-transform transform hover:scale-105"
          aria-label={isPlaying ? "Stop playback" : "Play from start"}
        >
          {isPlaying ? <SquareIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
        </button>
        
        <button 
            onClick={onNext} 
            disabled={currentSegmentIndex === segments.length - 1}
            className="p-2 rounded-full text-white bg-brand-secondary/50 hover:bg-brand-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next segment"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};