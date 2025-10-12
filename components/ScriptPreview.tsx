import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GeneratedScript, PodcastConfig, AnalysisResult, ScriptSegment, PlaybackState, SerializablePodcastConfig, PodcastProjectFile } from '../types';
import { PlayerControls } from './PlayerControls';
import { SegmentEditorModal } from './SegmentEditorModal';
import { ExportModal } from './ExportModal';
import { playScript, pausePlayback, resumePlayback, stopPlayback } from '../services/audioService';
import { exportProject } from '../services/exportService';
import { ArrowLeftIcon, DownloadIcon, PencilIcon, DownloadCloudIcon } from './icons';
import logger from '../services/loggingService';

interface ScriptPreviewProps {
    script: GeneratedScript;
    config: PodcastConfig;
    analysis: AnalysisResult;
    onBack: () => void;
    setError: (error: string | null) => void;
}

export const ScriptPreview: React.FC<ScriptPreviewProps> = ({ script: initialScript, config: initialConfig, analysis, onBack, setError }) => {
    const [script, setScript] = useState<GeneratedScript>(initialScript);
    const [config, setConfig] = useState<PodcastConfig>(initialConfig);
    const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
    const [editingSegment, setEditingSegment] = useState<ScriptSegment | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const isBusy = useRef(false);
    
    // Stop playback when component unmounts
    useEffect(() => {
        return () => {
            stopPlayback();
        };
    }, []);

    const performBusyAction = async (action: () => Promise<void>) => {
        if (isBusy.current) return;
        isBusy.current = true;
        try {
            await action();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred in an action.';
            logger.error('Error during busy action:', err);
            setError(errorMessage);
        } finally {
            isBusy.current = false;
        }
    };

    const handleSegmentStart = useCallback((index: number) => {
        setCurrentSegmentIndex(index);
    }, []);
    
    const handlePlaybackFinish = useCallback(() => {
        logger.info('Playback finished.');
        setPlaybackState('stopped');
        setCurrentSegmentIndex(prev => Math.max(0, prev));
    }, []);

    const handlePlaybackError = useCallback((error: string) => {
        logger.error('Playback error received by component:', error);
        setError(`Playback error: ${error}`);
        setPlaybackState('stopped');
    }, [setError]);

    const handlePlayPause = () => performBusyAction(async () => {
        if (playbackState === 'playing') {
            pausePlayback();
            setPlaybackState('paused');
        } else if (playbackState === 'paused') {
            resumePlayback();
            setPlaybackState('playing');
        } else { // 'stopped'
            setPlaybackState('playing');
            playScript(
                script.segments,
                config.voiceMapping,
                handleSegmentStart,
                handlePlaybackFinish,
                handlePlaybackError,
                currentSegmentIndex
            );
        }
    });

    const handleStop = () => performBusyAction(async () => {
        await stopPlayback();
        // The onFinish callback from the service will set the state to 'stopped'.
    });

    const handleSeek = (index: number) => performBusyAction(async () => {
        logger.info(`User seeking to segment ${index}.`);
        await stopPlayback();
        
        setCurrentSegmentIndex(index);
        setPlaybackState('playing');
        playScript(
            script.segments,
            config.voiceMapping,
            handleSegmentStart,
            handlePlaybackFinish,
            handlePlaybackError,
            index
        );
    });
    
    const handleSkipToStart = () => handleSeek(0);
    const handleSkipToEnd = () => handleSeek(script.segments.length - 1);


    const handleSaveSegment = (updatedSegment: ScriptSegment) => {
        const segmentIndex = script.segments.findIndex(s => s === editingSegment);
        if (segmentIndex === -1) return;

        const newSegments = [...script.segments];
        newSegments[segmentIndex] = updatedSegment;
        
        setScript({ ...script, segments: newSegments });
        setEditingSegment(null);
        logger.info('Segment updated.', updatedSegment);
    };

    const handleProjectDownload = () => {
        logger.info('Downloading project file.');
        const serializableConfig: SerializablePodcastConfig = {
            ...config,
            voiceMapping: Array.from(config.voiceMapping.entries()),
        };
        const projectFile: PodcastProjectFile = {
            version: '1.1',
            generatedScript: script,
            podcastConfig: serializableConfig,
            analysisResult: analysis,
        };
        const blob = new Blob([JSON.stringify(projectFile, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${script.title.replace(/\s/g, '_') || 'podcast'}_project.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center text-brand-secondary hover:text-brand-primary transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Settings
                </button>
                <div className="flex gap-4">
                    <button onClick={handleProjectDownload} className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Save Project
                    </button>
                    <button onClick={() => setIsExporting(true)} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center">
                        <DownloadCloudIcon className="w-5 h-5 mr-2" />
                        Export Audio/Video
                    </button>
                </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
                <h1 className="text-3xl font-bold">{script.title}</h1>
                <p className="text-lg text-dark-text-secondary mt-2 italic">"{script.hook}"</p>
            </div>

            <PlayerControls 
                segments={script.segments}
                playbackState={playbackState}
                currentSegmentIndex={currentSegmentIndex}
                onPlayPause={handlePlayPause}
                onStop={handleStop}
                onSeek={handleSeek}
                onSkipToStart={handleSkipToStart}
                onSkipToEnd={handleSkipToEnd}
            />

            <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Script</h2>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                    {script.segments.map((segment, index) => (
                        <div 
                             key={index} 
                             onClick={() => handleSeek(index)}
                             className={`p-4 rounded-md transition-all duration-300 cursor-pointer ${currentSegmentIndex === index && playbackState !== 'stopped' ? 'bg-brand-primary/20 ring-2 ring-brand-primary' : 'bg-dark-bg'}`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-bold text-lg text-brand-accent">{config.voiceMapping.get(segment.speaker)?.podcastName || segment.speaker}</p>
                                <button onClick={(e) => { e.stopPropagation(); setEditingSegment(segment); }} className="text-dark-text-secondary hover:text-white p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-white whitespace-pre-wrap">
                                {segment.editedLine ?? segment.line}
                            </p>
                            {segment.sfx && <p className="text-sm text-dark-text-secondary italic mt-1">[{segment.sfx}]</p>}
                        </div>
                    ))}
                </div>
            </div>

            {editingSegment && (
                <SegmentEditorModal 
                    segment={editingSegment}
                    onSave={handleSaveSegment}
                    onClose={() => setEditingSegment(null)}
                />
            )}

            {isExporting && (
                <ExportModal 
                    scriptTitle={script.title}
                    onClose={() => setIsExporting(false)}
                    onExport={(options) => exportProject(script, config.voiceMapping, options)}
                />
            )}
        </div>
    );
};