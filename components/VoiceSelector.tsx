import React, { useEffect, useState } from "react";

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (voice: string) => void;
}

interface Voice {
  id?: string;
  name: string;
  lang?: string;
  description?: string;
}

export function VoiceSelector({ selectedVoice, onSelect }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch("/voices");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setVoices(data);
        console.info("[VoiceSelector] Loaded voices:", data);
      } catch (err: any) {
        console.error("[VoiceSelector] Failed to load voices:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVoices();
  }, []);

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Select Voice</h3>

      {loading && (
        <p className="text-gray-400 text-sm italic">Loading voices...</p>
      )}

      {error && (
        <p className="text-red-400 text-sm">Error loading voices: {error}</p>
      )}

      {!loading && !error && voices.length === 0 && (
        <p className="text-gray-400 text-sm">No voices available.</p>
      )}

      {!loading && !error && voices.length > 0 && (
        <select
          value={selectedVoice}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        >
          {voices.map((v) => (
            <option key={v.id || v.name} value={v.name}>
              {v.lang ? `${v.lang} (${v.name})` : v.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
