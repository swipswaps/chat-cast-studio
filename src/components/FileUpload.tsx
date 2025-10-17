// src/components/FileUpload.tsx
// PRF-COMPLIANT — ChatCast Studio (2025-10-15)
// Updated to include optional onTextPasted handler for pasted chat text
// and async support for onFileSelected (since App.tsx awaited it).

import React, { useRef } from "react";

export interface FileUploadProps {
  // Allow async handlers (App.tsx uses an async function)
  onFileSelected: (file: File) => void | Promise<void>;

  // Optional handler for text pasted directly into the drop area
  onTextPasted?: (text: string) => void;
}

export function FileUpload({ onFileSelected, onTextPasted }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text");
    if (text && onTextPasted) {
      e.preventDefault();
      onTextPasted(text);
    }
  };

  return (
    <div
      className="p-4 border-2 border-dashed rounded-lg text-center"
      onPaste={handlePaste} // enable paste detection
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.json,.zip"
        className="hidden"
        onChange={handleChange}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => fileInputRef.current?.click()}
      >
        Upload Chat Log or Paste Text
      </button>
      <p className="text-sm text-gray-500 mt-2">
        You can also paste copied chat text directly here.
      </p>
    </div>
  );
}
