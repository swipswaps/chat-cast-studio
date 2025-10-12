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
- **High-Quality Media Export (MP3 & MP4)**: Exports your project directly to `.mp3` or `.mp4` files using a local backend server for audio generation and a browser-based version of FFMPEG for video creation.
- **Project Save/Load**: Save your complete, edited project—including the script and all your settings—as a single `.json` file and load it back in later to continue your work.

## Getting Started

This project uses a Vite-based frontend and a local Node.js server for backend audio processing.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the Application**:
    ```bash
    npm start
    ```
    This command will concurrently start:
    *   The Vite frontend development server (usually on `http://localhost:5173`).
    *   The local backend TTS server (on `http://localhost:3000`).

3.  **Provide a Chat Log**:
    *   Open the application in your browser.
    *   **Drag & Drop**: Drop your `.txt`, `.json`, or `.zip` file onto the upload area.
    *   **Paste Text**: Paste the raw text of your conversation into the text area and click "Process".
    *   **Use an Example**: If you don't have a log handy, click one of the "Load Example" buttons to see how it works.

4.  **Configure Your Podcast**:
    *   After the chat is analyzed, you'll be taken to the settings screen.
    *   Choose a **Podcast Style** and **Technicality Level**.
    *   In the **Voice Casting** section, assign a "Podcast Name" (e.g., Host, Guest) and a browser voice to each original speaker for the in-app preview.

5.  **Generate & Preview**:
    *   Click **"Generate Podcast Script"**. The AI will create your script.
    *   On the preview screen, use the player controls to listen to the browser-based audio preview.

6.  **Edit & Refine**:
    *   Click the pencil icon next to any line to open the editor.
    *   You can change the text that will be spoken, or adjust the **rate**, **pitch**, and **volume** of the voice for that specific line.

7.  **Save & Export**:
    *   Click **"Save Project"** at any time to download a `.json` file containing all your work.
    *   Click **"Export"** to open the export modal. The application will send the script to the local backend to generate the real audio, then package it as an `.mp3` or `.mp4` in your browser.
