// src/components/DebugLog.tsx
import React from "react";
import { getLogs } from "../services/logService";

export function DebugLog() {
  const logs = getLogs();
  return (
    <div className="p-4 bg-black text-green-400 h-64 overflow-y-scroll font-mono text-sm">
      {logs.map((l, i) => (
        <div key={i}>
          [{l.timestamp}] [{l.level}] {l.message}
          {l.data && <pre>{JSON.stringify(l.data, null, 2)}</pre>}
        </div>
      ))}
    </div>
  );
}
