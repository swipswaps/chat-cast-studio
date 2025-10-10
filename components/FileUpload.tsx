
import React, { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '../types';
import { parseFile, parseTextContent } from '../services/parserService';
import { EXAMPLE_CHAT_JSON, EXAMPLE_CHAT_TEXT } from '../constants';
import { FileUpIcon, ClipboardPasteIcon, BotIcon } from './icons';

interface FileUploadProps {
  onFileProcessed: (messages: ChatMessage[]) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setError: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, setIsLoading, setLoadingMessage, setError }) => {
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('Parsing chat log...');
    setError('');
    try {
      const messages = await parseFile(file);
      onFileProcessed(messages);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during parsing.');
    } finally {
      setIsLoading(false);
    }
  }, [onFileProcessed, setIsLoading, setLoadingMessage, setError]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setError('Pasted text cannot be empty.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Parsing pasted text...');
    setError('');
    try {
        const messages = parseTextContent(pastedText);
        onFileProcessed(messages);
    } catch(err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to parse pasted text.');
    } finally {
        setIsLoading(false);
    }
  };

  const loadExample = (content: string, type: 'json' | 'text') => {
    setIsLoading(true);
    setLoadingMessage('Loading example...');
    setError('');
    try {
        const messages = parseTextContent(content, type);
        onFileProcessed(messages);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load example.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div 
        className="relative border-2 border-dashed border-dark-border rounded-lg p-8 text-center cursor-pointer hover:border-brand-secondary transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center text-dark-text-secondary">
          <FileUpIcon className="w-12 h-12 mb-4 text-brand-accent"/>
          <p className="font-semibold text-lg">Drag & drop your chat log file here</p>
          <p className="text-sm">(.txt, .json, or .zip)</p>
          <p className="mt-4">or <span className="text-brand-secondary font-bold">click to browse</span></p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.json,.zip"
          onChange={handleFileChange}
        />
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-dark-border"></div>
        <span className="flex-shrink mx-4 text-dark-text-secondary">OR</span>
        <div className="flex-grow border-t border-dark-border"></div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg p-6">
        <h3 className="text-lg font-semibold flex items-center mb-3">
          <ClipboardPasteIcon className="w-5 h-5 mr-2 text-brand-accent"/>
          Paste Chat Log
        </h3>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste your raw chat log content here..."
          rows={8}
          className="w-full p-3 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary focus:outline-none transition-shadow"
        />
        <button
          onClick={handlePasteSubmit}
          disabled={!pastedText.trim()}
          className="mt-4 bg-brand-secondary hover:bg-brand-primary text-white font-bold py-2 px-4 rounded-md transition-all duration-300 w-full sm:w-auto disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Process Pasted Text
        </button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg p-6">
        <h3 className="text-lg font-semibold flex items-center mb-3">
          <BotIcon className="w-5 h-5 mr-2 text-brand-accent"/>
          Don't have a log? Try an example
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button onClick={() => loadExample(EXAMPLE_CHAT_JSON, 'json')} className="flex-1 bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
            Load Tech Example (.json)
          </button>
          <button onClick={() => loadExample(EXAMPLE_CHAT_TEXT, 'text')} className="flex-1 bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
            Load Simple Example (.txt)
          </button>
        </div>
      </div>
    </div>
  );
};
