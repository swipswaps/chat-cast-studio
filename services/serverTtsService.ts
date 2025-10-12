import type { GeneratedScript, PodcastConfig, SerializablePodcastConfig } from '../types';
import logger from './loggingService';

/**
 * This service is responsible for communicating with a backend TTS server.
 * The server is expected to take a script and config, generate high-quality
 * audio using a service like ElevenLabs or Google TTS, and return the
 * final audio file.
 *
 * See the `tts_server/README.md` for details on the required backend.
 */

// Converts the Map to a plain array for JSON serialization.
function serializeConfig(config: PodcastConfig): SerializablePodcastConfig {
    return {
        ...config,
        voiceMapping: Array.from(config.voiceMapping.entries()),
    };
}

/**
 * Sends the script to the backend server to generate an audio file.
 * @param script The podcast script.
 * @param config The podcast configuration.
 * @returns A promise that resolves to a Blob containing the generated audio data.
 */
export async function generateAudioFromServer(
    script: GeneratedScript,
    config: PodcastConfig,
): Promise<Blob> {
    const endpoint = '/api/generate-audio'; // The hypothetical server endpoint.
    logger.info(`Sending script to backend for audio generation at ${endpoint}`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                script: script,
                config: serializeConfig(config),
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Server responded with status ${response.status}: ${errorBody || 'Server error'}`);
        }

        // The server should respond with the raw audio file (e.g., audio/mpeg).
        const audioBlob = await response.blob();
        if (audioBlob.size === 0) {
            throw new Error("Received empty audio file from server.");
        }
        logger.info(`Successfully received generated audio from server (${(audioBlob.size / 1024).toFixed(1)} KB).`);
        return audioBlob;

    } catch (error) {
        logger.error('Failed to generate audio from server.', error);
        throw new Error(
            'Could not connect to the audio generation server. ' +
            'Please ensure the backend TTS server is running and accessible. ' +
            'See `tts_server/README.md` for setup instructions.'
        );
    }
}
