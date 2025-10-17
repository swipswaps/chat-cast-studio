import type { GeneratedScript, PodcastConfig, SerializablePodcastConfig } from "../types";
import logger from './loggingService';

function serializeConfig(config: PodcastConfig): SerializablePodcastConfig {
    return { ...config, voiceMapping: Array.from(config.voiceMapping.entries()) };
}

export async function generateAudioFromServer(
    script: GeneratedScript,
    config: PodcastConfig
): Promise<Blob> {
    const endpoint = 'http://localhost:3000/api/generate-audio';
    logger.info(`Sending script to backend for audio generation at ${endpoint}`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script, config: serializeConfig(config) }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Server responded with status ${response.status}: ${errorBody || 'Server error'}`);
        }

        const audioBlob = await response.blob();
        if (audioBlob.size === 0) throw new Error("Received empty audio file from server.");
        logger.info(`Received generated audio (${(audioBlob.size/1024).toFixed(1)} KB).`);
        return audioBlob;

    } catch (error) {
        logger.error('Failed to generate audio from server.', error);
        if (error instanceof TypeError) {
            throw new Error(
                'Could not connect to the local audio generation server. Ensure it is running (`npm start`).'
            );
        }
        throw error;
    }
}
