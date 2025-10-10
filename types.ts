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
  voiceId: string; // ElevenLabs voice ID
}

export interface PodcastConfig {
  style: PodcastStyle;
  technicality: TechnicalityLevel;
  voiceMapping: Map<string, VoiceSetting>; // Maps original role to voice settings
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
  id: string; // Unique identifier for versioning
  title: string;
  hook: string;
  segments: ScriptSegment[];
}

export interface ApiKeys {
  elevenLabs: string;
  // Add other API keys here as needed
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
}
