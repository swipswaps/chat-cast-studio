// A browser-only service that uses the Web Audio API to process audio.

let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Decodes an audio blob into an AudioBuffer.
 * @param blob - The audio data blob.
 * @returns A promise that resolves to an AudioBuffer.
 */
async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const context = getAudioContext();
  return context.decodeAudioData(arrayBuffer);
}

/**
 * Stitches multiple audio blobs into a single audio file.
 * @param audioBlobs - An array of audio blobs to concatenate.
 * @returns A promise that resolves to a single blob of the combined audio in WAV format.
 */
export async function stitchAudio(audioBlobs: Blob[]): Promise<Blob> {
  const context = getAudioContext();
  const buffers = await Promise.all(audioBlobs.map(decodeAudioBlob));

  if (buffers.length === 0) {
    throw new Error("Cannot stitch audio: no audio buffers provided.");
  }

  const totalLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0);
  const outputBuffer = context.createBuffer(
    buffers[0].numberOfChannels,
    totalLength,
    buffers[0].sampleRate
  );

  let offset = 0;
  for (const buffer of buffers) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      outputBuffer.getChannelData(channel).set(buffer.getChannelData(channel), offset);
    }
    offset += buffer.length;
  }

  return audioBufferToWav(outputBuffer);
}


// Helper function to convert an AudioBuffer to a WAV file (Blob)
// Source: https://github.com/mattdiamond/Recorderjs/blob/master/src/recorder.js
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferOut = new ArrayBuffer(length);
    const view = new DataView(bufferOut);
    const channels = [];
    let i = 0;
    let sample = 0;
    let offset = 0;
  
    const setUint16 = (data: number) => {
      view.setUint16(offset, data, true);
      offset += 2;
    };
  
    const setUint32 = (data: number) => {
      view.setUint32(offset, data, true);
      offset += 4;
    };
  
    // RIFF chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
  
    // FMT sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // 16 for PCM
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample
  
    // data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length - offset - 4);
  
    for (i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
  
    let pos = 0;
    while (pos < buffer.length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][pos]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
      pos++;
    }
  
    return new Blob([view], { type: 'audio/wav' });
  }
