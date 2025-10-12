import React, { useState, useEffect } from 'react';
import type { ScriptSegment } from '../types';

interface SegmentEditorModalProps {
  segment: ScriptSegment;
  onSave: (updatedSegment: ScriptSegment) => void;
  onClose: () => void;
}

const Slider: React.FC<{ label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: number; max: number; step: number; }> = ({ label, value, onChange, min, max, step }) => (
    <div>
        <label className="block text-sm font-medium text-dark-text-secondary flex justify-between">
            <span>{label}</span>
            <span>{value.toFixed(2)}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-secondary"
        />
    </div>
);

export const SegmentEditorModal: React.FC<SegmentEditorModalProps> = ({ segment, onSave, onClose }) => {
  const [editedLine, setEditedLine] = useState(segment.editedLine ?? segment.line);
  const [rate, setRate] = useState(segment.rate ?? 1);
  const [pitch, setPitch] = useState(segment.pitch ?? 1);
  const [volume, setVolume] = useState(segment.volume ?? 1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    onSave({
      ...segment,
      editedLine,
      rate,
      pitch,
      volume,
    });
  };
  
  const handleResetDefaults = () => {
    setEditedLine(segment.line);
    setRate(1);
    setPitch(1);
    setVolume(1);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-dark-card border border-dark-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-white">Edit Segment</h2>
          <p className="text-sm text-dark-text-secondary">Speaker: <span className="font-semibold">{segment.speaker}</span></p>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label htmlFor="editedLine" className="block text-lg font-semibold mb-2">Spoken Text</label>
            <textarea
              id="editedLine"
              value={editedLine}
              onChange={(e) => setEditedLine(e.target.value)}
              rows={5}
              className="w-full p-3 bg-dark-bg border border-dark-border rounded-md focus:ring-2 focus:ring-brand-secondary focus:outline-none transition-shadow"
              placeholder="Enter the text to be spoken..."
            />
             <p className="text-xs text-dark-text-secondary mt-1">Modify this text to change what is spoken. You can remove elements like ` ` or fix pronunciation.</p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Voice Delivery</h3>
            <Slider label="Rate" value={rate} onChange={e => setRate(parseFloat(e.target.value))} min={0.5} max={2} step={0.1} />
            <Slider label="Pitch" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} min={0.5} max={2} step={0.1} />
            <Slider label="Volume" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} min={0} max={1} step={0.05} />
          </div>
        </div>
        
        <div className="p-6 border-t border-dark-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={handleResetDefaults}
            className="text-sm text-dark-text-secondary hover:text-white transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-4">
            <button
                onClick={onClose}
                className="bg-dark-border hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-md transition-colors"
            >
                Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
