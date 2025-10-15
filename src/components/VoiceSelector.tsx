// File: src/components/VoiceSelector.tsx
// PRF-COMPLIANT FIX 2025-10-15
// Dynamically populates voices from backend + browser speechSynthesis.

import React, { useEffect, useState } from "react";
import { fetchBackendVoices } from "../services/tts";
import { logEvent } from "../services/logService";

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (voice: string) => void;
}

export function VoiceSelector({ selectedVoice, onSelect }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const backend = await fetchBackendVoices();
        const localVoices =
          window.speechSynthesis
            ?.getVoices()
            ?.map((v) => ({ name: v.name, lang: v.lang })) || [];
        const merged = [...backend, ...localVoices];
        setVoices(merged);
        logEvent("INFO", `VoiceSelector loaded ${merged.length} voices`, merged, "VoiceSelector");
      } catch (err) {
        logEvent("ERROR", "Failed to load voices", err, "VoiceSelector");
      }
    })();
  }, []);

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Select Voice</h3>
      <select
        value={selectedVoice}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full p-2 rounded bg-gray-700 border border-gray-600"
      >
        {voices.length === 0 ? (
          <option value="">Loading voices...</option>
        ) : (
          voices.map((v) => (
            <option key={`${v.name}-${v.lang}`} value={v.name}>
              {`${v.lang} — ${v.name}`}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
