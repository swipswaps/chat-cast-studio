/**
 * PRF-COMPLIANT FILE — ChatCast Studio (2025-10-17)
 * types.ts — Unified type registry for script analysis, podcast generation, and export pipeline.
 */

export interface AnalysisResult {
  speakers: string[];
  messageCount: number;
  wordCount: number;
  estimatedDurationMinutes: number;
  codeBlockCount?: number;
  proseToCodeRatio?: string;
  summary?: string;
  keywords?: string[];
  sentiment?: string;
}

export interface ChatMessage {
  role: string;
  content: string;
  isCodeBlock?: boolean;
}

export interface PodcastConfig {
  voice: string;
  style: PodcastStyle;
  voiceMapping?: Map<string, { podcastName: string }>;
  technicality?: TechnicalityLevel;
  includeMusic?: boolean;
  includeSfx?: boolean;
}

export interface SerializablePodcastConfig extends Omit<PodcastConfig, 'voiceMapping'> {
  voiceMapping: [string, { podcastName: string }][];
}

export interface GeneratedScript {
  id: string;
  title?: string;
  hook?: string;
  content?: string;
  segments: ScriptSegment[];
}

export interface ScriptSegment {
  speaker: string;
  line: string;
  editedLine?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface PodcastProjectFile {
  version: '1.0' | '1.1';
  generatedScript: GeneratedScript;
  podcastConfig: SerializablePodcastConfig;
  analysisResult: AnalysisResult;
}

export interface ExportOptions {
  format: 'mp3' | 'mp4';
  backgroundImage?: ImageBitmap;
  includeSubtitles?: boolean;
}

export interface ExportProgress {
  phase: 'loading' | 'generating' | 'encoding' | 'done' | 'error';
  message: string;
  progress?: number;
}

export interface ProcessedFile {
  type: 'chat' | 'legacyScript' | 'scriptProject';
  messages?: ChatMessage[];
  script?: GeneratedScript;
  config?: PodcastConfig;
  analysis?: AnalysisResult;
}

/**
 * Voice setting for both browserTTS and external APIs.
 * The `voiceId` is mandatory so every service can resolve a matching voice.
 */
export interface VoiceSetting {
  voiceId: string;
  name: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export type PlaybackState = 'playing' | 'paused' | 'stopped';

/**
 * BrowserVoice for speechSynthesis matching.
 */
export interface BrowserVoice {
  name: string;
  lang: string;
}

/**
 * Recording lifecycle state — simplified but still extensible.
 */
export type RecordingState = 'idle' | 'permission' | 'processing' | 'finished' | 'error' | 'recording';

export interface TechnicalityLevel {
  id: string;
  name: string;
  description?: string;
}

/**
 * Podcast style definitions used by UI and Gemini prompts.
 */
export interface PodcastStyleObject {
  id: string;
  name: string;
  description: string;
}

/**
 * Style may be a simple string literal (legacy) or full object (modern).
 */
export type PodcastStyle =
  | 'informative'
  | 'conversational'
  | 'narrative'
  | PodcastStyleObject;
