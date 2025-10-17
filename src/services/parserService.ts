// src/services/parserService.ts
import JSZip from 'jszip';
import type {
  ChatMessage,
  ProcessedFile,
  PodcastProjectFile,
  PodcastConfig,
  GeneratedScript,
  SerializablePodcastConfig,
  AnalysisResult,
} from "../types";
import { analyzeScript } from './analysisService';

const CODE_FENCE = '```';

export async function parseFile(file: File): Promise<ProcessedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json': return parseJson(await file.text());
    case 'txt': return { type: 'chat', messages: parseTxt(await file.text()) };
    case 'zip': return { type: 'chat', messages: await parseZip(file) };
    default: throw new Error(`Unsupported file type: .${ext}`);
  }
}

export function parseTextContent(content: string, typeHint?: 'json' | 'text'): ProcessedFile {
  if (typeHint === 'json' || content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try { return parseJson(content); } catch { return { type: 'chat', messages: parseTxt(content) }; }
  }
  return { type: 'chat', messages: parseTxt(content) };
}

function parseJson(content: string): ProcessedFile {
  const data = JSON.parse(content);

  if ((data.version === '1.0' || data.version === '1.1') && data.generatedScript && data.podcastConfig && data.analysisResult) {
    const config: PodcastConfig = {
      ...data.podcastConfig,
      voiceMapping: new Map(data.podcastConfig.voiceMapping || []),
    };
    return { type: 'scriptProject', script: data.generatedScript, config, analysis: data.analysisResult };
  }

  if (typeof data.title === 'string' && Array.isArray(data.segments)) {
    const script: GeneratedScript = {
      id: data.id || new Date().toISOString(),
      title: data.title,
      hook: data.hook,
      segments: data.segments,
      content: data.content,
    };
    return { type: 'legacyScript', script, analysis: analyzeScript(script) };
  }

  if (Array.isArray(data)) {
    const messages = data.map((item: any) => ({ role: item.role || 'user', content: item.content || '' }));
    return { type: 'chat', messages: processCodeBlocks(messages) };
  }

  throw new Error('Invalid JSON format.');
}

function parseTxt(content: string): ChatMessage[] {
  const lines = content.split('\n');
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)/);
    if (match) {
      if (current) messages.push(current);
      current = { role: match[1].toLowerCase(), content: match[2] };
    } else if (current) {
      current.content += '\n' + line;
    }
  }
  if (current) messages.push(current);
  if (!messages.length && content.trim()) messages.push({ role: 'user', content });
  return processCodeBlocks(messages.map(m => ({ ...m, content: m.content.trim() })));
}

async function parseZip(file: File): Promise<ChatMessage[]> {
  const zip = await JSZip.loadAsync(file);
  const jsonFile = zip.file('chat.json');
  if (jsonFile) {
    const processed = parseJson(await jsonFile.async('string'));
    if (processed.type === 'chat') return processed.messages!;
  }

  const txtFile = zip.file('chat.txt');
  if (txtFile) return parseTxt(await txtFile.async('string'));

  const files = Object.values(zip.files).filter(f => !f.dir);
  const anyJson = files.find(f => f.name.endsWith('.json'));
  if (anyJson) { const processed = parseJson(await anyJson.async('string')); if (processed.type === 'chat') return processed.messages!; }

  const anyTxt = files.find(f => f.name.endsWith('.txt'));
  if (anyTxt) return parseTxt(await anyTxt.async('string'));

  throw new Error('No compatible chat log found in zip.');
}

function processCodeBlocks(messages: ChatMessage[]): ChatMessage[] {
  const processed: ChatMessage[] = [];
  messages.forEach(msg => {
    if (!msg.content) return;
    const parts = msg.content.split(CODE_FENCE);
    let inCode = false;
    parts.forEach((part, idx) => {
      if (idx === 0) { if (part.trim()) processed.push({ ...msg, content: part.trim(), isCodeBlock: false }); }
      else {
        if (inCode) { if (part.trim()) processed.push({ ...msg, content: part.trim(), isCodeBlock: false }); }
        else {
          const language = part.split('\n')[0].trim();
          const code = part.substring(language.length).trim();
          if (code) processed.push({ ...msg, content: code, isCodeBlock: true });
        }
        inCode = !inCode;
      }
    });
  });
  return processed;
}

export function saveProjectToFile(script: GeneratedScript, config: PodcastConfig, analysis: AnalysisResult) {
  const serializableConfig: SerializablePodcastConfig = {
    ...config,
    voiceMapping: config.voiceMapping ? Array.from(config.voiceMapping.entries()) : [],
  };
  const projectFile: PodcastProjectFile = { version: '1.1', generatedScript: script, podcastConfig: serializableConfig, analysisResult: analysis };

  const blob = new Blob([JSON.stringify(projectFile, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ((script.title || 'podcast_project').replace(/[\/\\?%*:|"<>]/g, '-')) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
