import React, { useState, useEffect, useRef } from 'react';
import logger, { LogEntry } from '../services/loggingService';
import { ChevronsUpDownIcon, BotIcon } from './icons';

export const DebugLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());
  const [isOpen, setIsOpen] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setLogs([...logger.getLogs()]);
    };
    logger.subscribe(handleUpdate);
    return () => logger.unsubscribe(handleUpdate);
  }, []);

  useEffect(() => {
    if (isOpen && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="fixed bottom-0 right-0 m-4 z-50">
      <div className={`w-80 sm:w-96 transition-all duration-300 ${isOpen ? 'h-80' : 'h-12'}`}>
        <div className="bg-dark-card border border-dark-border rounded-lg shadow-2xl flex flex-col h-full">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full p-3 bg-dark-border rounded-t-lg cursor-pointer"
            aria-expanded={isOpen}
            aria-controls="debug-log-content"
          >
            <div className="flex items-center">
              <BotIcon className="w-5 h-5 mr-2 text-brand-accent" />
              <h3 className="font-semibold text-white">Debug Log</h3>
            </div>
            <ChevronsUpDownIcon className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <div
              id="debug-log-content"
              ref={logContainerRef}
              className="flex-grow p-2 overflow-y-auto"
              aria-live="polite"
            >
              <ul className="text-xs font-mono space-y-1">
                {logs.map((log, index) => (
                  <li key={index} className={`flex items-start ${getLogColor(log.type)}`}>
                    <span className="flex-shrink-0 mr-2 opacity-60">
                      {log.timestamp.toLocaleTimeString([], { hour12: false })}
                    </span>
                    <span className="break-all">{log.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
