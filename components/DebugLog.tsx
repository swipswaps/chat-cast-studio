
import React, { useState, useEffect } from 'react';
import logger, { LogEntry } from '../services/loggingService';

export const DebugLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = logger.subscribe(setLogs);
    return () => unsubscribe();
  }, []);

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-dark-card border border-dark-border text-white px-4 py-2 rounded-lg shadow-lg hover:bg-dark-bg"
      >
        Show Debug Log
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 h-1/3 w-full md:w-1/2 lg:w-1/3 bg-dark-card border-t-2 border-l-2 border-dark-border shadow-2xl flex flex-col z-50">
      <div className="p-2 flex justify-between items-center border-b border-dark-border bg-dark-bg">
        <h3 className="font-bold text-white">Debug Log</h3>
        <button onClick={() => setIsOpen(false)} className="text-white font-bold text-xl px-2">&times;</button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto font-mono text-xs">
        {logs.slice().reverse().map((log, index) => (
          <div key={index} className="flex border-b border-dark-border/50 py-1">
            <span className="text-gray-600 mr-2 flex-shrink-0">{log.timestamp.toLocaleTimeString()}</span>
            <span className={`${getLogColor(log.level)} mr-2 font-bold w-12 flex-shrink-0`}>{log.level.toUpperCase()}</span>
            <span className="whitespace-pre-wrap break-all">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
