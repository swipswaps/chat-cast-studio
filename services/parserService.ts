
import JSZip from 'jszip';
import type { ChatMessage } from '../types';

const CODE_FENCE = '```';

/**
 * Main parsing function that delegates to specific parsers based on file type.
 */
export async function parseFile(file: File): Promise<ChatMessage[]> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  switch (fileExtension) {
    case 'json':
      return parseJson(await file.text());
    case 'txt':
      return parseTxt(await file.text());
    case 'zip':
      return parseZip(file);
    default:
      throw new Error(`Unsupported file type: .${fileExtension}`);
  }
}

/**
 * Parses raw text content, attempting to auto-detect if it's JSON or plain text.
 */
export function parseTextContent(content: string, typeHint?: 'json' | 'text'): ChatMessage[] {
  if (typeHint === 'json' || (content.trim().startsWith('[') && content.trim().endsWith(']'))) {
    try {
      return parseJson(content);
    } catch (e) {
      // Fallback to text parser if JSON parsing fails
      return parseTxt(content);
    }
  }
  return parseTxt(content);
}

/**
 * Parses a ChatGPT JSON export.
 */
function parseJson(content: string): ChatMessage[] {
  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('Invalid JSON format: Expected an array of messages.');
    }
    const messages = data.map((item: any) => ({
      role: item.role || 'unknown',
      content: item.content || '',
    }));
    return processCodeBlocks(messages);
  } catch (error) {
    console.error("JSON parsing error:", error);
    throw new Error('Failed to parse JSON file. Please ensure it is a valid JSON array of messages.');
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

  if(messages.length === 0) {
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
    return parseJson(await jsonFile.async('string'));
  }
  const txtFile = zip.file('chat.txt');
  if (txtFile) {
    return parseTxt(await txtFile.async('string'));
  }
  
  // Look for any json/txt file
  // FIX: Using Object.keys().map() instead of Object.values() to fix type inference issues with JSZip files.
  const files = Object.keys(zip.files).map(name => zip.files[name]);

  const anyJson = files.find(f => f.name.endsWith('.json'));
  if (anyJson) {
    return parseJson(await anyJson.async('string'));
  }

  const anyTxt = files.find(f => f.name.endsWith('.txt'));
  if (anyTxt) {
    return parseTxt(await anyTxt.async('string'));
  }

  throw new Error('No "chat.json" or "chat.txt" file found in the zip archive.');
}


/**
 * Splits messages containing code blocks into separate message objects.
 */
function processCodeBlocks(messages: ChatMessage[]): ChatMessage[] {
  const processed: ChatMessage[] = [];
  messages.forEach(msg => {
    const parts = msg.content.split(CODE_FENCE);
    let inCodeBlock = false;
    parts.forEach((part, index) => {
      if (part.trim()) {
        if (inCodeBlock) {
          const language = part.split('\n')[0].trim();
          const code = part.substring(language.length).trim();
          processed.push({
            role: msg.role,
            content: code,
            isCodeBlock: true,
          });
        } else {
          processed.push({
            role: msg.role,
            content: part.trim(),
            isCodeBlock: false,
          });
        }
      }
      // Every other part is a code block, starting from the second part
      if(index < parts.length - 1) {
         inCodeBlock = !inCodeBlock;
      }
    });
  });
  return processed;
}
