import React from "react";

export function Loader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-300">
      <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
      <p>{message || "Loading..."}</p>
    </div>
  );
}
