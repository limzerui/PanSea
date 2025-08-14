# PanSea Voice Frontend (Next.js)

Frontend-only demo that:
- Captures voice and transcribes to text (Web Speech API)
- Displays spoken text and responses
- Speaks responses with text-to-speech
- Prepares for a backend response but works without one via mock mode

## Run

```bash
# From the project root
npm install
npm run dev
```

Open `http://localhost:3000`.

## Configure Backend (Optional)

Set an environment variable to point to your backend endpoint that accepts POST JSON `{ message: string }` and returns `{ reply: string }` or plain text:

```bash
# Example
NEXT_PUBLIC_BACKEND_URL=https://your-backend.example.com/respond npm run dev
```

If `NEXT_PUBLIC_BACKEND_URL` is not set (or `NEXT_PUBLIC_USE_MOCK=1`), the app returns mock responses locally.

## Notes
- Speech recognition relies on the browser Web Speech API. It is best supported in Chromium-based browsers.
- Text-to-speech is widely supported, but available voices vary by OS/browser.
- No OpenAI SDK or backend code is included. 