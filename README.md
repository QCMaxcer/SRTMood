# SRTMood

SRTMood is a local full-stack web app that uses the TypeSafe Jev model to classify the emotion of subtitle lines and optionally append matching emoji.

## Features

- Upload and parse `.srt` and `.txt` subtitle files.
- Classify each line with Jev using a configurable context window.
- Configure custom emotion categories, colors, multiple emoji, and semantic boundaries.
- Ask Jev whether an emoji should be added to a given line.
- Suppress repeated emoji for consecutive lines with the same emotion.
- Preview per-line results and export the modified subtitle file.
- Store the TypeSafe API key only on the server in `server/.env`.

## Requirements

- Node.js 20 or newer
- A TypeSafe API key from https://console.typesafe.ai/keys

## Setup

```bash
npm install
npm run dev
```

Open the Vite URL printed by the client process (normally http://localhost:5173). Enter your TypeSafe API key in the left panel on first use; it is stored only in `server/.env`.

## Scripts

- `npm run dev` runs the Express API and the Vite client together.
- `npm run build` produces `server/dist` and `client/dist`.
- `npm start` serves the built client from the Express server.
- `npm test` runs server and client unit tests.

## License

MIT
