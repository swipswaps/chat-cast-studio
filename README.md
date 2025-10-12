# Chatcast Studio

Chatcast Studio is an innovative, AI-powered web application designed to transform raw chat logs (from platforms like ChatGPT, Claude, etc.) into professionally styled, multi-voice podcast scripts.

This tool automates the heavy lifting of scriptwriting, allowing content creators to generate engaging audio content with structured narratives, distinct speaker roles, and production cues, all from a simple conversation.

## 🚀 Quick Start Guide

Follow these steps to get the application running correctly.

1.  **Install Dependencies**: Open your terminal in the project directory and run:
    ```bash
    npm install
    ```

2.  **Run the Application**: To use all features, including media export, you **must** use the `start` command:
    ```bash
    npm start
    ```
    This command concurrently starts both:
    *   The Vite frontend development server (usually on `http://localhost:5173`).
    *   The local backend TTS server required for audio export (on `http://localhost:3000`).

3.  **Open in Browser**: Navigate to `http://localhost:5173` in your web browser.

That's it! The application should now be fully functional.

---

## Troubleshooting & FAQ

If you run into problems, check here for solutions to common issues.

#### **Q: The app looks weird, unstyled, or like plain HTML.**

This almost always means the project dependencies are missing or the styling framework is not configured correctly.

*   **Solution**: Stop the application (`Ctrl+C` in your terminal), run `npm install` again to ensure all packages are correctly installed, and then restart it with `npm start`.

#### **Q: The 'Export' button does nothing, gets stuck, or shows a connection error.**

This feature depends on the local backend server, which is the most common point of failure.

*   **Did you use `npm start`?** The export feature **requires** the local backend server. The `npm start` command runs both the frontend and this server. If you only run `npm run dev`, the server will not be active, and export will fail. The error message in the export pop-up should tell you if it can't connect.
*   **Is the server running correctly?** Check the terminal where you ran `npm start`. You should see output for both the Vite server and a line like `Server listening on port 3000`. If you see errors related to the server, it may not have started correctly.
*   **Alternative to `npm start`**: If the `start` command fails for any reason, you can run the two services separately. Open **two separate terminals**:
    *   In Terminal 1, run `npm run dev` for the frontend.
    *   In Terminal 2, run `npm run server` for the backend.

#### **Q: Can I use the app *without* the backend server?**

**Yes!** You can do everything **except** the final MP3/MP4 export. If you only want to generate and edit a script, you don't need the backend.

To do this, just run `npm run dev` in your terminal and ignore the export feature. You can still:
*   Upload/paste a chat log.
*   Generate a podcast script with AI.
*   Listen to a preview using your browser's built-in voices.
*   Edit the script line-by-line.
*   Save your project as a `.json` file to continue later.

#### **Q: I'm getting errors about `SharedArrayBuffer` or FFMPEG won't load.**

This is related to browser security policies required for FFMPEG to work in the browser.
*   The `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers in `index.html` are **required** and should not be removed.
*   Ensure you are serving the app from `localhost` via the Vite dev server (`npm start`). Opening the `index.html` file directly in your browser will not work.
*   Some browser extensions (like certain ad-blockers) can interfere with these security policies. If you have persistent issues, try disabling extensions for the app's local domain.