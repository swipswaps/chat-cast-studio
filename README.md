# Chatcast Studio

Chatcast Studio is an innovative, AI-powered web application designed to transform raw chat logs (from platforms like ChatGPT, Claude, etc.) into professionally styled, multi-voice podcast scripts.

This tool automates the heavy lifting of scriptwriting, allowing content creators to generate engaging audio content with structured narratives, distinct speaker roles, and production cues, all from a simple conversation.

## Key Features

- **AI-Powered Script Generation**: Leverages the Gemini API to intelligently convert unstructured chat logs into a well-structured podcast script with a title, hook, distinct segments, and an outro.
- **Multiple Input Formats**: Supports uploading `.txt`, `.json`, and `.zip` chat logs, as well as directly pasting raw text.
- **Customizable Podcast Style**: Choose from different styles (e.g., Narrative Interview, Tech Deep-Dive) and technicality levels to tailor the script's tone and content to your audience.
- **Voice Casting**: Assign distinct podcast names and browser-based voices to each speaker in the chat for in-app previews.
- **Interactive Script Editor**: Fine-tune the generated script directly in the browser. Edit spoken text, adjust voice delivery (rate, pitch, volume) for each line.
- **Advanced Playback Controls**: A full-featured player with a visual timeline, true pause/resume, stop, and click-to-play functionality for any segment.
- **High-Quality Media Export (MP3 & MP4)**: Exports your project directly to `.mp3` or `.mp4` files using a backend audio generation service and a browser-based version of FFMPEG.
  - **Backend Server Required**: To generate the final, high-quality audio, this application requires a backend TTS server to be running. This server takes the generated script and uses a professional TTS service (like ElevenLabs, Google TTS, etc.) to create the audio file. See the `tts_server/README.md` for instructions on setting up the required backend.
- **Project Save/Load**: Save your complete, edited project—including the script and all your settings—as a single `.json` file and load it back in later to continue your work.

## Getting Started

1.  **Provide a Chat Log**:
    *   **Drag & Drop**: Drop your `.txt`, `.json`, or `.zip` file onto the upload area.
    *   **Paste Text**: Paste the raw text of your conversation into the text area and click "Process".
    *   **Use an Example**: If you don't have a log handy, click one of the "Load Example" buttons to see how it works.

2.  **Configure Your Podcast**:
    *   After the chat is analyzed, you'll be taken to the settings screen.
    *   Choose a **Podcast Style** and **Technicality Level**.
    *   In the **Voice Casting** section, assign a "Podcast Name" (e.g., Host, Guest) and a browser voice to each original speaker for the in-app preview.

3.  **Generate & Preview**:
    *   Click **"Generate Podcast Script"**. The AI will create your script.
    *   On the preview screen, use the player controls to listen to the browser-based audio preview.
    *   Click on any line in the script to start playback from that point.

4.  **Edit & Refine**:
    *   Click the pencil icon next to any line to open the editor.
    *   You can change the text that will be spoken, or adjust the **rate**, **pitch**, and **volume** of the voice for that specific line.
    *   All your edits are saved automatically for your session.

5.  **Save & Export**:
    *   **Important**: Before exporting, ensure you have the backend TTS server running (see `tts_server/README.md`).
    *   Click **"Save Project"** at any time to download a `.json` file containing all your work. You can drop this file back onto the upload screen later to resume where you left off.
    *   Click **"Export"** to open the export modal. The application will send the script to your backend to generate the real audio, then package it as an `.mp3` or `.mp4` in your browser.