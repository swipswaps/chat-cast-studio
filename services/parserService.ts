
import JSZip from 'jszip';
import type { ChatMessage, ProcessedFile, PodcastProjectFile, PodcastConfig, GeneratedScript, SerializablePodcastConfig, AnalysisResult } from '../types';
import { analyzeScript } from './analysisService';

const CODE_FENCE = '```';

/**
 * Main parsing function that delegates to specific parsers based on file type.
 */
export async function parseFile(file: File): Promise<ProcessedFile> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  switch (fileExtension) {
    case 'json':
      return parseJson(await file.text());
    case 'txt':
      return { type: 'chat', messages: parseTxt(await file.text()) };
    case 'zip':
      const messages = await parseZip(file);
      return { type: 'chat', messages };
    default:
      throw new Error(`Unsupported file type: .${fileExtension}`);
  }
}

/**
 * Parses raw text content, attempting to auto-detect if it's JSON or plain text.
 */
export function parseTextContent(content: string, typeHint?: 'json' | 'text'): ProcessedFile {
  if (typeHint === 'json' || (content.trim().startsWith('{') || content.trim().startsWith('['))) {
    try {
      return parseJson(content);
    } catch (e) {
      // Fallback to text parser if JSON parsing fails
      return { type: 'chat', messages: parseTxt(content) };
    }
  }
  return { type: 'chat', messages: parseTxt(content) };
}

/**
 * Parses a JSON file, which could be a chat log array, a full podcast project, or a legacy script-only file.
 */
function parseJson(content: string): ProcessedFile {
  try {
    const data = JSON.parse(content);

    // Check 1: New, full podcast project file (v1.0 or v1.1 for edited)
    if ((data.version === '1.0' || data.version === '1.1') && data.generatedScript && data.podcastConfig && data.analysisResult) {
        const projectFile = data as PodcastProjectFile;
        const config: PodcastConfig = {
            ...projectFile.podcastConfig,
            voiceMapping: new Map(projectFile.podcastConfig.voiceMapping),
        };
        return {
            type: 'scriptProject',
            script: projectFile.generatedScript,
            config: config,
            analysis: projectFile.analysisResult,
        };
    }

    // Check 2: Legacy, script-only file
    if (typeof data.title === 'string' && typeof data.hook === 'string' && Array.isArray(data.segments)) {
        const script: GeneratedScript = {
            id: data.id || new Date().toISOString(),
            title: data.title,
            hook: data.hook,
            segments: data.segments,
        };
        const analysis = analyzeScript(script);
        return {
            type: 'legacyScript',
            script: script,
            analysis: analysis,
        };
    }

    // Check 3: Raw chat log array
    if (Array.isArray(data)) {
        const messages = data.map((item: any) => ({
          role: item.role || 'unknown',
          content: item.content || '',
        }));
        return { type: 'chat', messages: processCodeBlocks(messages) };
    }

    throw new Error('Invalid JSON format: Expected a chat log, podcast project file, or script file.');

  } catch (error) {
    console.error("JSON parsing error:", error);
    throw new Error('Failed to parse JSON file. Please ensure it is a valid chat log, podcast project, or script file.');
  }
}

/**
 * Parses a simple text format (e.g., "role: content").
 */
function parseTxt(content: string): ChatMessage[] {
  const lines = content.split('\n');
  const messages: ChatMessage[] = [];
  let currentMessage: ChatMessage | null = null;

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)/);
    if (match) {
      if (currentMessage) {
        messages.push(currentMessage);
      }
      currentMessage = { role: match[1].toLowerCase(), content: match[2] };
    } else if (currentMessage) {
      currentMessage.content += '\n' + line;
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  if(messages.length === 0 && content.trim().length > 0) {
    // Fallback for text with no role prefixes
     messages.push({ role: 'user', content: content });
  }

  return processCodeBlocks(messages.map(m => ({...m, content: m.content.trim()})));
}

/**
 * Parses a ZIP file, looking for chat.json or chat.txt.
 */
async function parseZip(file: File): Promise<ChatMessage[]> {
  const zip = await JSZip.loadAsync(file);
  const jsonFile = zip.file('chat.json');
  if (jsonFile) {
    const processedFile = parseJson(await jsonFile.async('string'));
    if (processedFile.type === 'chat') return processedFile.messages;
  }
  const txtFile = zip.file('chat.txt');
  if (txtFile) {
    return parseTxt(await txtFile.async('string'));
  }
  
  // Look for any json/txt file
  const files = Object.keys(zip.files).map(name => zip.files[name]);

  const anyJson = files.find(f => !f.dir && f.name.endsWith('.json'));
  if (anyJson) {
     const processedFile = parseJson(await anyJson.async('string'));
     if (processedFile.type === 'chat') return processedFile.messages;
  }

  const anyTxt = files.find(f => !f.dir && f.name.endsWith('.txt'));
  if (anyTxt) {
    return parseTxt(await anyTxt.async('string'));
  }

  throw new Error('No compatible chat log (.json or .txt) file found in the zip archive.');
}


/**
 * Splits messages containing code blocks into separate message objects.
 */
function processCodeBlocks(messages: ChatMessage[]): ChatMessage[] {
  const processed: ChatMessage[] = [];
  messages.forEach(msg => {
    if (typeof msg.content !== 'string') {
        // handle cases where content might be null or undefined
        if(msg.content) {
            processed.push({ ...msg, content: String(msg.content) });
        }
        return;
    }
    const parts = msg.content.split(CODE_FENCE);
    let inCodeBlock = false;
    parts.forEach((part, index) => {
      if (index === 0) {
        if (part.trim()) {
           processed.push({ role: msg.role, content: part.trim(), isCodeBlock: false });
        }
      } else {
        if (inCodeBlock) {
          if (part.trim()) {
            processed.push({ role: msg.role, content: part.trim(), isCodeBlock: false });
          }
        } else {
          const language = part.split('\n')[0].trim();
          const code = part.substring(language.length).trim();
          if (code) {
             processed.push({ role: msg.role, content: code, isCodeBlock: true });
          }
        }
        inCodeBlock = !inCodeBlock;
      }
    });
  });
  return processed;
}

/**
 * Serializes the current project state and downloads it as a JSON file.
 */
export function saveProjectToFile(script: GeneratedScript, config: PodcastConfig, analysis: AnalysisResult) {
  const serializableConfig: SerializablePodcastConfig = {
    ...config,
    voiceMapping: Array.from(config.voiceMapping.entries()),
  };

  const projectFile: PodcastProjectFile = {
    version: '1.1', // Denotes a potentially edited project
    generatedScript: script,
    podcastConfig: serializableConfig,
    analysisResult: analysis,
  };

  const blob = new Blob([JSON.stringify(projectFile, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Sanitize title for use as a filename
  const safeTitle = (script.title || 'podcast_project').replace(/[\/\\?%*:|"<>]/g, '-');
  a.download = `${safeTitle}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
