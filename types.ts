

export interface ChatMessage {
  role: string;
  content: string;
  isCodeBlock?: boolean;
}

export interface AnalysisResult {
  speakers: string[];
  messageCount: number;
  wordCount: number;
  estimatedDurationMinutes: number;
  codeBlockCount: number;
  proseToCodeRatio: string;
}

export interface PodcastStyle {
  id: string;
  name: string;
  description: string;
}

export interface TechnicalityLevel {
  id: string;
  name: string;
  description: string;
}

export interface VoiceSetting {
  podcastName: string;
  voiceId: string; // voiceURI for browser voices
}

export interface PodcastConfig {
  style: PodcastStyle;
  technicality: TechnicalityLevel;
  voiceMapping: Map<string, VoiceSetting>;
  includeMusic: boolean;
  includeSfx: boolean;
}

export interface SerializablePodcastConfig {
  style: PodcastStyle;
  technicality: TechnicalityLevel;
  voiceMapping: [string, VoiceSetting][];
  includeMusic: boolean;
  includeSfx: boolean;
}

export interface ScriptSegment {
  speaker: string;
  line: string;
  sfx?: string;
  type: 'intro' | 'hook' | 'segment_host' | 'segment_guest' | 'transition' | 'code_explanation' | 'outro' | 'music_bridge';
  
  editedLine?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}


export interface GeneratedScript {
  id: string;
  title: string;
  hook: string;
  segments: ScriptSegment[];
}

export interface BrowserVoice {
  name: string;
  lang: string;
  voiceURI: string;
}

export type RecordingState = 'idle' | 'permission' | 'recording' | 'processing' | 'finished' | 'error';

export interface PodcastProjectFile {
  version: string;
  generatedScript: GeneratedScript;
  podcastConfig: SerializablePodcastConfig;
  analysisResult: AnalysisResult;
}

export type ProcessedFile = 
  | { type: 'chat'; messages: ChatMessage[] }
  | { 
      type: 'scriptProject';
      script: GeneratedScript;
      config: PodcastConfig;
      analysis: AnalysisResult;
    }
  | {
      type: 'legacyScript';
      script: GeneratedScript;
      analysis: AnalysisResult;
    };

export type PlaybackState = 'playing' | 'paused' | 'stopped';

export interface ExportOptions {
    format: 'mp3' | 'mp4';
    includeSubtitles: boolean;
    backgroundImage?: File;
}

export interface ExportProgress {
    status: 'idle' | 'rendering' | 'packaging' | 'complete' | 'error';
    message: string;
    percentage: number;
    outputUrl?: string;
    outputFilename?: string;
}