import type { RecordingState } from "../types";

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioStream: MediaStream | null = null;

export type RecordingServiceCallbacks = {
  onStateChange: (state: RecordingState) => void;
  onDataAvailable: (blob: Blob) => void;
  onError: (error: string) => void;
};

let callbacks: RecordingServiceCallbacks | null = null;

function setState(state: RecordingState) {
  callbacks?.onStateChange(state);
}

export function initializeRecording(cb: RecordingServiceCallbacks) {
  callbacks = cb;
  setState('idle');
}

export async function startRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    console.warn('Recording is already in progress.');
    return;
  }

  setState('permission');
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(audioStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      setState('processing');
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      callbacks?.onDataAvailable(audioBlob);
      audioStream?.getTracks().forEach(track => track.stop());
      audioStream = null;
      setState('finished');
    };

    mediaRecorder.onerror = (event) => {
        const error = (event as any).error || new Error('Unknown MediaRecorder error');
        console.error('MediaRecorder error:', error);
        callbacks?.onError(error.message || 'An unknown recording error occurred.');
        setState('error');
    };

    mediaRecorder.start();
    setState('recording');
  } catch (err) {
    console.error('Error starting recording:', err);
    if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            callbacks?.onError('Microphone permission denied.');
        } else {
            callbacks?.onError(`Could not start recording: ${err.message}`);
        }
    } else {
        callbacks?.onError('An unknown error occurred while requesting microphone permission.');
    }
    setState('error');
  }
}

export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  } else {
    console.warn('No active recording to stop.');
  }
}

export function cleanupRecording() {
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
    }
    mediaRecorder = null;
    audioChunks = [];
    callbacks = null;
}
