// File: src/components/Loader.tsx
// PRF-COMPLIANT FULL VERSION
// Purpose: Generic loader/spinner component for async operations.
// Optional message can be displayed for context.

import React from "react";

interface LoaderProps {
  message?: string;
}

export function Loader({ message }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-300">
      {/* Spinner */}
      <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>

      {/* Optional message */}
      <p>{message || "Loading..."}</p>
    </div>
  );
}
