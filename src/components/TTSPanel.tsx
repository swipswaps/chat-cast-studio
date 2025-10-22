// File: src/components/TTSPanel.tsx
// ---------------------------------------------------------------------------
// React component to control TTS generation and playback
// Uses src/services/api.js for backend calls
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from "react";
import { getVoices, generateTTS } from "../services/api";

const TTSPanel: React.FC = () => {
  const [voices, setVoices] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [speakingRate, setSpeakingRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0.0);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch available voices from backend
  useEffect(() => {
    getVoices()
      .then((v) => {
        setVoices(v);
        if (v.length > 0) setSelectedVoice(v[0]);
      })
      .catch((err) => console.error("Voice fetch failed:", err));
  }, []);

  async function handleGenerate() {
    if (!text.trim()) {
      alert("Please enter text to synthesize.");
      return;
    }

    setLoading(true);
    try {
      const audioUrl = await generateTTS({
        text,
        voice: selectedVoice,
        speakingRate,
        pitch,
      });
      new Audio(audioUrl).play();
    } catch (e: any) {
      console.error(e);
      alert("Failed to process chat or script.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-900 text-gray-100 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">🎙️ ChatCast Studio – TTS Panel</h2>

      <label className="block mb-2 font-semibold">Text to synthesize:</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="w-full p-2 text-gray-900 rounded-md mb-4"
        placeholder="Type or paste chat/script text here..."
      />

      <div className="flex items-center gap-2 mb-4">
        <label className="font-semibold">Voice:</label>
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          className="flex-1 p-2 text-gray-900 rounded-md"
        >
          {voices.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="font-semibold">Speed:</label>
          <input
            type="number"
            min="0.5"
            max="2"
            step="0.1"
            value={speakingRate}
            onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
            className="ml-2 w-20 text-gray-900 rounded-md p-1"
          />
        </div>

        <div>
          <label className="font-semibold">Pitch:</label>
          <input
            type="number"
            min="-10"
            max="10"
            step="0.5"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="ml-2 w-20 text-gray-900 rounded-md p-1"
          />
        </div>
      </div>

      <button
        disabled={loading}
        onClick={handleGenerate}
        className={`w-full py-2 rounded-md font-bold ${
          loading
            ? "bg-gray-600 cursor-wait"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {loading ? "Generating..." : "Generate Speech"}
      </button>
    </div>
  );
};

export default TTSPanel;
