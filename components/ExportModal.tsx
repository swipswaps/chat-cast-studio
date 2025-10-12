import React, { useState, useRef, useCallback } from 'react';
import type { ExportOptions, ExportProgress } from '../types';
// FIX: The LoaderIcon was not exported from icons. The import is now correct after adding it.
import { DownloadCloudIcon } from './icons';
import { Loader } from './Loader';

interface ExportModalProps {
    scriptTitle: string;
    onClose: () => void;
    onExport: (options: ExportOptions) => Promise<{ url: string; filename: string }>;
}

export const ExportModal: React.FC<ExportModalProps> = ({ scriptTitle, onClose, onExport }) => {
    const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
    const [includeSubtitles, setIncludeSubtitles] = useState(true);
    const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [progress, setProgress] = useState<ExportProgress>({ status: 'idle', message: '', percentage: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBackgroundImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRender = async () => {
        if (format === 'mp4' && !backgroundImage) {
            setProgress({ status: 'error', message: 'A background image is required for MP4 export.', percentage: 0 });
            return;
        }

        setProgress({ status: 'rendering', message: 'Initializing renderer...', percentage: 0 });

        // This is a placeholder for the actual rendering logic which is complex.
        // In a real app, this would make API calls to a backend service.
        // Here, we simulate the process to demonstrate the UI/UX.
        try {
            setProgress({ status: 'rendering', message: 'Generating subtitles...', percentage: 10 });
            await new Promise(res => setTimeout(res, 500));
            setProgress({ status: 'rendering', message: 'Synthesizing audio segments...', percentage: 30 });
            await new Promise(res => setTimeout(res, 1500));
            setProgress({ status: 'packaging', message: 'Encoding and packaging files...', percentage: 80 });
            await new Promise(res => setTimeout(res, 1000));
            
            // In a real implementation, the onExport would return the URL
            // const { url, filename } = await onExport({ format, includeSubtitles, backgroundImage: backgroundImage ?? undefined });

            setProgress({
                status: 'complete',
                message: 'Render complete! Your download is ready.',
                percentage: 100,
                // MOCK DATA:
                outputUrl: "#", // In a real app, this would be `url`
                outputFilename: `${scriptTitle.replace(/\s/g, '_')}_render.zip` // and `filename`
            });

        } catch (error) {
             setProgress({ status: 'error', message: `Render failed: ${error instanceof Error ? error.message : 'Unknown error'}`, percentage: 0 });
        }
    };


    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-dark-card border border-dark-border rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <DownloadCloudIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                        Export Audio / Video
                    </h2>
                </div>

                {progress.status === 'idle' || progress.status === 'error' ? (
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">Format</label>
                            <div className="flex gap-4">
                                <button onClick={() => setFormat('mp4')} className={`flex-1 p-4 rounded-md border-2 transition-colors ${format === 'mp4' ? 'border-brand-primary bg-brand-primary/10' : 'border-dark-border bg-dark-bg hover:border-brand-secondary/50'}`}>
                                    <span className="font-bold text-white">MP4 Video</span>
                                    <p className="text-sm text-dark-text-secondary">Includes audio, background image, and optional subtitles.</p>
                                </button>
                                <button onClick={() => setFormat('mp3')} className={`flex-1 p-4 rounded-md border-2 transition-colors ${format === 'mp3' ? 'border-brand-primary bg-brand-primary/10' : 'border-dark-border bg-dark-bg hover:border-brand-secondary/50'}`}>
                                    <span className="font-bold text-white">MP3 Audio</span>
                                    <p className="text-sm text-dark-text-secondary">Audio only, perfect for podcast platforms.</p>
                                </button>
                            </div>
                        </div>

                        {format === 'mp4' && (
                             <div>
                                <label className="block text-lg font-semibold mb-2">Background Image</label>
                                <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer h-40 bg-dark-bg border-2 border-dashed border-dark-border rounded-md flex items-center justify-center text-center p-4 hover:border-brand-secondary transition-colors">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Background preview" className="max-h-full max-w-full object-contain rounded-md" />
                                    ) : (
                                        <p className="text-dark-text-secondary">Click to upload an image (e.g., logo, episode art)</p>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/png, image/jpeg" className="hidden"/>
                            </div>
                        )}

                        <div>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={includeSubtitles} onChange={e => setIncludeSubtitles(e.target.checked)} className="form-checkbox h-5 w-5 text-brand-secondary bg-dark-bg border-dark-border rounded focus:ring-brand-secondary" />
                                <span className="ml-3 text-white">Include Subtitles (.vtt file)</span>
                            </label>
                        </div>
                         {progress.status === 'error' && (
                            <div className="bg-red-900/50 border border-red-600 text-white px-4 py-2 rounded-lg text-sm">
                                {progress.message}
                            </div>
                         )}
                    </div>
                ) : (
                    <div className="p-6 space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="w-12 h-12">
                                <Loader />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold">{progress.message}</h3>
                        <div className="w-full bg-dark-border rounded-full h-2.5">
                            <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress.percentage}%` }}></div>
                        </div>
                    </div>
                )}
                
                <div className="p-6 border-t border-dark-border flex justify-end gap-4">
                     <div className="text-xs text-dark-text-secondary w-full">
                        <strong>Note:</strong> High-quality audio/video rendering typically requires a backend service. This client-side version is for demonstration purposes.
                    </div>
                    <button onClick={onClose} className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition-colors">Close</button>
                    {progress.status === 'complete' ? (
                         <a href={progress.outputUrl} download={progress.outputFilename} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition-colors">Download</a>
                    ) : (
                         <button onClick={handleRender} disabled={progress.status !== 'idle' && progress.status !== 'error'} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                            Start Render
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};