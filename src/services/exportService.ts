/**
 * PRF-COMPLIANT FILE — ChatCast Studio (2025-10-17)
 * src/services/exportService.ts
 * 
 * Unified export pipeline for MP3/MP4 generation and download.
 * Fixes TS2322 (BlobPart type error) by explicitly converting SharedArrayBuffer → ArrayBuffer.
 * Compatible with modern FFmpeg (≥7.x) and strict TypeScript.
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type {
  GeneratedScript,
  PodcastConfig,
  ExportOptions,
  ExportProgress,
  ScriptSegment
} from "../types";
import logger from './loggingService';
import { generateAudioFromServer } from './serverTtsService';

const FFMPEG_CORE_URL = 'https://aistudiocdn.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js';
const FFMPEG_WASM_URL = 'https://aistudiocdn.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm';

let ffmpeg: FFmpeg | null = null;

/**
 * Dynamically load and initialize FFmpeg with progress reporting.
 */
async function loadFfmpeg(progressCallback: (progress: ExportProgress) => void): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => logger.info(`[FFMPEG]: ${message}`));
  ffmpeg.on('progress', ({ progress }) =>
    progressCallback({
      phase: 'encoding',
      message: `Encoding... (${(progress * 100).toFixed(0)}%)`,
      progress,
    })
  );

  progressCallback({ phase: 'loading', message: 'Loading media engine (FFMPEG)...' });

  await ffmpeg.load({
    coreURL: await toBlobURL(FFMPEG_CORE_URL, 'text/javascript'),
    wasmURL: await toBlobURL(FFMPEG_WASM_URL, 'application/wasm'),
  });

  return ffmpeg;
}

const WORDS_PER_MINUTE_ESTIMATE = 150;

/**
 * Estimate spoken duration of a text segment based on word count.
 */
function estimateSegmentDuration(segment: ScriptSegment): number {
  const text = segment.editedLine ?? segment.line ?? '';
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(0.5, (wordCount / WORDS_PER_MINUTE_ESTIMATE) * 60);
}

/**
 * Safely trigger browser download of binary data.
 * Converts potential SharedArrayBuffer to plain ArrayBuffer for strict BlobPart typing.
 */
function triggerDownload(data: Uint8Array, filename: string) {
  // --- Convert to safe ArrayBuffer for Blob construction ---
  const safeBuffer =
    data.buffer instanceof SharedArrayBuffer
      ? new Uint8Array(data).slice().buffer // clone into regular ArrayBuffer
      : data.buffer.slice(0);

  const blob = new Blob([safeBuffer], { type: 'application/octet-stream' });
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
 * Entry point — orchestrates podcast export as MP3 or MP4.
 */
export async function exportProject(
  script: GeneratedScript,
  podcastConfig: PodcastConfig,
  options: ExportOptions,
  progressCallback: (progress: ExportProgress) => void
) {
  try {
    progressCallback({
      phase: 'generating',
      message: 'Requesting audio from server...',
    });

    const audioBlob = await generateAudioFromServer(script, podcastConfig);
    const audioBuffer = await audioBlob.arrayBuffer();
    const ffmpegInstance = await loadFfmpeg(progressCallback);

    const safeTitle = (script.title || 'podcast').replace(/[/\\?%*:|"<>]/g, '-');
    await ffmpegInstance.writeFile('real_audio.mp3', new Uint8Array(audioBuffer));

    if (options.format === 'mp3') {
      progressCallback({
        phase: 'done',
        message: 'Audio ready, starting download.',
        progress: 1,
      });
      triggerDownload(new Uint8Array(audioBuffer), `${safeTitle}.mp3`);
    } else {
      await exportVideo(
        ffmpegInstance,
        script,
        podcastConfig,
        options,
        safeTitle,
        'real_audio.mp3',
        progressCallback
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Export failed.', err);
    progressCallback({
      phase: 'error',
      message: `Export failed: ${message}`,
    });
  }
}

/**
 * Generates a basic MP4 with background and audio using OffscreenCanvas + FFmpeg.
 */
async function exportVideo(
  ffmpeg: FFmpeg,
  script: GeneratedScript,
  config: PodcastConfig,
  options: ExportOptions,
  safeTitle: string,
  audioFilename: string,
  progressCallback: (p: ExportProgress) => void
) {
  const WIDTH = 1280,
    HEIGHT = 720,
    FPS = 30;

  progressCallback({ phase: 'generating', message: 'Preparing video frames...' });

  let bgImage: ImageBitmap | null = null;
  if (options.backgroundImage)
    bgImage = await createImageBitmap(options.backgroundImage);

  const canvas = new OffscreenCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get OffscreenCanvas context');

  const totalDuration = script.segments.reduce(
    (sum, seg) =>
      sum +
      Math.max(
        0.5,
        ((seg.editedLine ?? seg.line ?? '').split(/\s+/).filter(Boolean).length /
          WORDS_PER_MINUTE_ESTIMATE) *
          60
      ),
    0
  );
  const totalFrames = Math.floor(totalDuration * FPS);

  for (let i = 0; i < totalFrames; i++) {
    const frameProgress = i / totalFrames;
    if (i % FPS === 0)
      progressCallback({
        phase: 'generating',
        message: `Generating frames... (${(frameProgress * 100).toFixed(0)}%)`,
        progress: frameProgress,
      });

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (bgImage) ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

    // TODO: Subtitle rendering (based on segment timings) can be restored here.
    const blob = await canvas.convertToBlob();
    const frameData = await blob.arrayBuffer();
    await ffmpeg.writeFile(
      `frame-${String(i).padStart(5, '0')}.png`,
      new Uint8Array(frameData)
    );
  }

  progressCallback({
    phase: 'encoding',
    message: 'Encoding video...',
    progress: 0,
  });

  const ffmpegArgs = [
    '-framerate',
    String(FPS),
    '-i',
    'frame-%05d.png',
    '-i',
    audioFilename,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'copy',
    '-shortest',
    '-y',
    `${safeTitle}.mp4`,
  ];

  await ffmpeg.exec(ffmpegArgs);
  const data = await ffmpeg.readFile(`${safeTitle}.mp4`);
  triggerDownload(data as Uint8Array, `${safeTitle}.mp4`);
}
