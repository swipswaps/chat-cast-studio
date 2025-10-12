# TTS Server (Backend for High-Quality Audio Generation)

This directory contains the blueprint for a Python-based backend service designed to handle high-quality Text-to-Speech (TTS) audio generation for the Chat2Podcast application.

## Purpose

While the main application can generate audio previews using the browser's built-in speech synthesis, this approach has two key limitations:
1.  **Variable Quality**: The voice quality and availability depend entirely on the user's browser and operating system.
2.  **Inability to Capture Audio**: Web standards do not allow a web page to directly capture the audio output from the browser's TTS engine, making it impossible to create a final MP3/MP4 file reliably on the client-side.

This backend server is the professional solution to these limitations.

## Architecture

1.  **API Endpoint**: The server exposes a simple HTTP endpoint that accepts a JSON payload containing the podcast script and voice configuration.
2.  **TTS Integration**: It integrates with a professional, third-party TTS service (e.g., ElevenLabs, Google Cloud Text-to-Speech, Amazon Polly) to generate high-quality, consistent audio for each line of the script.
3.  **Audio Processing**: It uses a library like `pydub` to concatenate the individual audio clips into a single track.
4.  **Media Generation**: For video output, it can use `FFMPEG` to combine the final audio track with a background image and subtitles.
5.  **Job Queue (Optional)**: For longer scripts, a task queue like Celery with Redis could be implemented to handle rendering jobs asynchronously.

## Getting Started (Example)

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2.  Set up API keys for your chosen TTS service in a `.env` file.
3.  Run the server:
    ```bash
    python main.py
    ```

The frontend application would then be configured to send its export requests to this server instead of performing the rendering in the browser.
