import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { GeneratedScript, PodcastConfig, ExportOptions, ExportProgress, ScriptSegment } from '../types';
import logger from './loggingService';
import { generateAudioFromServer } from './serverTtsService';

const FFMPEG_CORE_URL = 'https://aistudiocdn.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js';
const FFMPEG_WASM_URL = 'https://aistudiocdn.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm';

let ffmpeg: FFmpeg | null = null;

async function loadFfmpeg(progressCallback: (progress: ExportProgress) => void): Promise<FFmpeg> {
    if (ffmpeg) {
        return ffmpeg;
    }
    
    ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
        logger.info(`[FFMPEG]: ${message}`);
    });
    
    ffmpeg.on('progress', ({ progress }) => {
        progressCallback({
            phase: 'encoding',
            message: `Encoding... (${(progress * 100).toFixed(0)}%)`,
            progress: progress,
        });
    });

    progressCallback({ phase: 'loading', message: 'Loading media engine (FFMPEG)...' });
    await ffmpeg.load({
        coreURL: await toBlobURL(FFMPEG_CORE_URL, 'text/javascript'),
        wasmURL: await toBlobURL(FFMPEG_WASM_URL, 'application/wasm'),
    });
    
    return ffmpeg;
}

const WORDS_PER_MINUTE_ESTIMATE = 150;
function estimateSegmentDuration(segment: ScriptSegment): number {
    const text = segment.editedLine ?? segment.line;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return Math.max(0.5, (wordCount / WORDS_PER_MINUTE_ESTIMATE) * 60); // seconds
}

function triggerDownload(data: Uint8Array, filename: string) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Main export function. Generates a media file using a server for audio and FFMPEG for packaging.
 */
export async function exportProject(
  script: GeneratedScript,
  podcastConfig: PodcastConfig,
  options: ExportOptions,
  progressCallback: (progress: ExportProgress) => void
): Promise<void> {
    try {
        // Step 1: Generate REAL audio from the backend server
        progressCallback({ phase: 'generating', message: 'Requesting audio from server...' });
        const audioBlob = await generateAudioFromServer(script, podcastConfig);
        const audioBuffer = await audioBlob.arrayBuffer();
        
        // Step 2: Load FFMPEG
        const ffmpegInstance = await loadFfmpeg(progressCallback);
        const safeTitle = (script.title || 'podcast').replace(/[/\\?%*:|"<>]/g, '-');
        
        // Step 3: Write the real audio to FFMPEG's virtual filesystem
        // Assuming server returns a common format like mp3
        const audioFilename = 'real_audio.mp3';
        await ffmpegInstance.writeFile(audioFilename, new Uint8Array(audioBuffer));
        
        if (options.format === 'mp3') {
            progressCallback({ phase: 'done', message: 'Audio received, download starting.' });
            triggerDownload(new Uint8Array(audioBuffer), `${safeTitle}.mp3`);
        } else if (options.format === 'mp4') {
             // For video timing, we still need to estimate segment durations client-side.
             // A more advanced implementation might get exact timings from the server.
             let totalDuration = 0;
             const timings = script.segments.map(seg => {
                const duration = estimateSegmentDuration(seg);
                const timing = { start: totalDuration, end: totalDuration + duration };
                totalDuration += duration;
                return timing;
             });

            await exportVideo(ffmpegInstance, script, podcastConfig, options, totalDuration, timings, safeTitle, audioFilename, progressCallback);
        }

        progressCallback({ phase: 'done', message: 'Export complete!', progress: 1 });

    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        logger.error('Export failed.', err);
        progressCallback({ phase: 'error', message: `Export failed: ${message}` });
    }
}

async function exportVideo(
    ffmpeg: FFmpeg,
    script: GeneratedScript,
    config: PodcastConfig,
    options: ExportOptions,
    totalDuration: number,
    timings: {start: number, end: number}[],
    safeTitle: string,
    audioFilename: string,
    progressCallback: (p: ExportProgress) => void
) {
    const WIDTH = 1280;
    const HEIGHT = 720;
    const FPS = 30;

    progressCallback({ phase: 'generating', message: 'Preparing video frames...' });
    
    let bgImage: ImageBitmap | null = null;
    if (options.backgroundImage) {
        bgImage = await createImageBitmap(options.backgroundImage);
    }
    
    const canvas = new OffscreenCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get OffscreenCanvas context");

    // Generate frames
    const totalFrames = Math.floor(totalDuration * FPS);
    for (let i = 0; i < totalFrames; i++) {
        const frameProgress = i / totalFrames;
        if (i % FPS === 0) { // Update progress callback periodically
            progressCallback({ phase: 'generating', message: `Generating frames... (${(frameProgress * 100).toFixed(0)}%)`, progress: frameProgress });
        }

        const currentTime = i / FPS;
        
        // Draw background
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
        }

        // Find current segment and draw subtitles
        const currentSegmentIndex = timings.findIndex(t => currentTime >= t.start && currentTime < t.end);
        if (options.includeSubtitles && currentSegmentIndex !== -1) {
            const segment = script.segments[currentSegmentIndex];
            const speakerName = config.voiceMapping.get(segment.speaker)?.podcastName || segment.speaker;
            const line = segment.editedLine ?? segment.line;
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const padding = 60;

            // Simple text wrapping
            const words = line.split(' ');
            let currentLine = '';
            const lines = [];
            for (const word of words) {
                const testLine = currentLine + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > WIDTH - (padding * 2) && currentLine !== '') {
                    lines.push(currentLine);
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            const lineSpacing = 64;
            const startY = HEIGHT - padding - (lineSpacing * (lines.length - 1));

            // Draw background for subtitles
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            const textHeight = lineSpacing * lines.length + 40;
            ctx.fillRect(0, startY - textHeight + 20, WIDTH, textHeight + 20);


            // Speaker name
            ctx.font = 'bold 32px sans-serif';
            ctx.fillStyle = '#60a5fa'; // brand-accent
            ctx.fillText(speakerName, WIDTH / 2, startY - lineSpacing);
            
            // Subtitle text
            ctx.font = '54px sans-serif';
            ctx.fillStyle = '#FFFFFF';
            lines.forEach((l, idx) => {
                ctx.fillText(l.trim(), WIDTH / 2, startY + (idx * lineSpacing));
            });
        }
        
        const blob = await canvas.convertToBlob();
        const frameData = await blob.arrayBuffer();
        await ffmpeg.writeFile(`frame-${String(i).padStart(5, '0')}.png`, new Uint8Array(frameData));
    }

    progressCallback({ phase: 'encoding', message: 'Encoding video file...', progress: 0 });

    const ffmpegArgs = [
        '-framerate', String(FPS),
        '-i', 'frame-%05d.png',
        '-i', audioFilename,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'copy', // Copy the audio stream without re-encoding
        '-shortest', // Finish encoding when the shortest stream ends
        '-y', `${safeTitle}.mp4`
    ];
    
    await ffmpeg.exec(ffmpegArgs);

    const data = await ffmpeg.readFile(`${safeTitle}.mp4`);
    triggerDownload(data as Uint8Array, `${safeTitle}.mp4`);
}