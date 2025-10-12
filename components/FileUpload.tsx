
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { ProcessedFile } from '../types';
import { parseFile, parseTextContent } from '../services/parserService';
import { EXAMPLE_CHAT_JSON, EXAMPLE_CHAT_TEXT } from '../constants';
import { UploadCloudIcon, FileIcon } from './icons';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  onTextPasted: (text: string) => void;
}


export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, onTextPasted }) => {
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFileName(acceptedFiles[0].name);
      onFileSelected(acceptedFiles[0]);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'application/zip': ['.zip'],
    },
    multiple: false,
  });

  const handlePaste = () => {
    if (!pastedText.trim()) return;
    onTextPasted(pastedText);
  };
  
  const loadExample = (content: string) => {
      setPastedText(content);
  }

  return (
    <div className="space-y-6">
      <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-brand-primary bg-dark-bg' : 'border-dark-border hover:border-brand-secondary'}`}>
        <input {...getInputProps()} />
        <UploadCloudIcon className="w-12 h-12 mx-auto text-dark-text-secondary" />
        <p className="mt-4 text-white">Drag &amp; drop a chat log file here</p>
        <p className="text-sm text-dark-text-secondary">(.json, .txt, or .zip)</p>
        <button type="button" className="mt-4 px-4 py-2 bg-brand-secondary text-white rounded-md text-sm">Or Select File</button>
        {fileName && <p className="mt-4 text-sm text-green-400 flex items-center justify-center"><FileIcon className="w-4 h-4 mr-2" />{fileName}</p>}
      </div>

      <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-dark-border" />
          </div>
          <div className="relative flex justify-center">
              <span className="bg-dark-card px-2 text-sm text-dark-text-secondary">OR</span>
          </div>
      </div>

      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste your chat log content here..."
          rows={8}
          className="w-full p-2 bg-dark-card border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary"
        />
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-dark-text-secondary">
                Load an example:
                <button onClick={() => loadExample(EXAMPLE_CHAT_JSON)} className="ml-2 text-brand-secondary hover:underline">JSON</button>
                <button onClick={() => loadExample(EXAMPLE_CHAT_TEXT)} className="ml-2 text-brand-secondary hover:underline">Text</button>
            </div>
          <button onClick={handlePaste} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-md hover:bg-brand-secondary">
            Process Pasted Text
          </button>
        </div>
      </div>
    </div>
  );
};
