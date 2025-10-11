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

export interface ScriptSegment {
  speaker: string;
  line: string;
  sfx?: string;
  type: 'intro' | 'hook' | 'segment_host' | 'segment_guest' | 'transition' | 'code_explanation' | 'outro' | 'music_bridge';
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
