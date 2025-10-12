
import React from 'react';
import type { ScriptSegment, PlaybackState } from '../types';
// FIX: Corrected import path for icons
import { PlayIcon, PauseIcon, StopCircleIcon, RewindIcon, FastForwardIcon } from './icons';

interface PlayerControlsProps {
  segments: ScriptSegment[];
  playbackState: PlaybackState;
  currentSegmentIndex: number | null;
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (index: number) => void;
  onSkipToStart: () => void;
  onSkipToEnd: () => void;
  isBusy?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  segments,
  playbackState,
  currentSegmentIndex,
  onPlayPause,
  onStop,
  onSeek,
  onSkipToStart,
  onSkipToEnd,
  isBusy = false,
}) => {
  const totalDuration = segments.reduce((sum, seg) => sum + (seg.line.length || 1), 0);

  const getPlayButtonIcon = () => {
    if (playbackState === 'playing') return <PauseIcon className="w-8 h-8" />;
    return <PlayIcon className="w-8 h-8" />; // Shows play for both 'paused' and 'stopped'
  };

  return (
    <div className={`bg-dark-bg border border-dark-border rounded-lg p-4 space-y-4 transition-opacity ${isBusy ? 'opacity-50' : 'opacity-100'}`}>
      {/* Visual Timeline */}
      <div className={`flex w-full h-8 bg-dark-border rounded-md overflow-hidden group ${isBusy ? 'pointer-events-none' : 'cursor-pointer'}`}>
        {segments.map((segment, index) => {
          const segmentWidth = Math.max(((segment.line.length || 1) / totalDuration) * 100, 0.5);
          return (
            <div
              key={index}
              onClick={() => onSeek(index)}
              className={`h-full transition-all duration-200 ${currentSegmentIndex === index ? 'bg-brand-primary' : 'bg-brand-secondary/50 group-hover:bg-brand-secondary/70'}`}
              style={{ width: `${segmentWidth}%` }}
              title={`Segment ${index + 1}: ${segment.speaker}`}
            ></div>
          );
        })}
      </div>
      
      {/* Controls */}
      <fieldset disabled={isBusy} className="flex items-center justify-center gap-6">
         <button 
            onClick={onSkipToStart} 
            className="p-2 rounded-full text-white bg-brand-secondary/50 hover:bg-brand-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Skip to start"
        >
          <RewindIcon className="w-6 h-6" />
        </button>
        
        <button
          onClick={onPlayPause}
          className="p-4 rounded-full text-white bg-brand-primary hover:bg-brand-secondary transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:scale-100"
          aria-label={playbackState === 'playing' ? "Pause playback" : "Play playback"}
        >
          {getPlayButtonIcon()}
        </button>

        <button 
            onClick={onStop}
            disabled={playbackState === 'stopped'}
            className="p-2 rounded-full text-white bg-brand-secondary/50 hover:bg-brand-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Stop playback"
        >
          <StopCircleIcon className="w-8 h-8" />
        </button>
        
        <button 
            onClick={onSkipToEnd} 
            className="p-2 rounded-full text-white bg-brand-secondary/50 hover:bg-brand-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Skip to end"
        >
          <FastForwardIcon className="w-6 h-6" />
        </button>
      </fieldset>
    </div>
  );
};