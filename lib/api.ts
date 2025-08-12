const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === '1' || !BACKEND_URL;

export async function getAssistantResponse(userText: string): Promise<string> {
  if (USE_MOCK) {
    await sleep(400);
    return mockResponder(userText);
  }

  try {
    const res = await fetch(`${BACKEND_URL}`.replace(/\/$/, ''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json().catch(() => ({ reply: '' }));
    // Expect backend to return { reply: string }
    if (typeof data.reply === 'string' && data.reply.trim()) {
      return data.reply as string;
    }
    // If backend returns plain text
    const text = await res.text().catch(() => '');
    return text || 'Received an empty response from the server.';
  } catch (err: any) {
    return 'Could not reach the backend. Please check NEXT_PUBLIC_BACKEND_URL or use mock mode.';
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mockResponder(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return 'Say something and I will respond.';
  const canned = [
    `You said: "${trimmed}". I hear you loud and clear.`,
    `Echo: ${trimmed}. What would you like to do next?`,
    `I understood: ${trimmed}. Here is a helpful response.`
  ];
  return canned[Math.floor(Math.random() * canned.length)];
} 