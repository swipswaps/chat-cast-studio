// src/components/FileUpload.tsx
import React, { useRef } from "react";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
}

export function FileUpload({ onFileSelected }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div className="p-4 border-2 border-dashed rounded-lg text-center">
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
        Upload Chat Log
      </button>
    </div>
  );
}
