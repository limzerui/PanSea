// types
type Msg = { role: "user" | "assistant"; content: string };

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";
export async function getAssistantResponse(history: Msg[]): Promise<string> {
  const safeHistory: Msg[] = Array.isArray(history) ? history : [];

  if (USE_MOCK) {
    await sleep(400);
    const lastUser = [...safeHistory].reverse().find(m => m.role === "user");
    return mockResponder(lastUser?.content || "");
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: safeHistory })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: { raw?: string; reply?: string } = await res.json();
    const raw = data.raw?.trim() || data.reply?.trim() || "AI did not respond.";
    console.log("Raw AI response:", raw);

    let parsed: any = null;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("Failed to parse AI JSON, returning raw output.", e);
    }

    if (parsed?.action) {
      try {
        const actionRes = await fetch(`/api/${parsed.action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.parameters || {})
        });
        const actionData = await actionRes.json();

        const followUpHistory: Msg[] = [
          ...safeHistory, // <- not the original `history`
          { role: "assistant", content: raw },
          {
            role: "user",
            content: `The user requested an action "${parsed.action}". The backend returned: ${JSON.stringify(
              actionData
            )}. Generate a clear, friendly message to the user summarizing the result.`
          }
        ];

        return await getAssistantResponse(followUpHistory);
      } catch (err) {
        console.error(`[Action failed] ${parsed.action || ""}:`, err);
        return parsed.response || parsed.reply || raw;
      }
    }

    return parsed?.response || parsed?.reply || raw;
  } catch (err: any) {
    console.error("Error in getAssistantResponse:", err);
    return "Could not reach the backend. Please check your connection or use mock mode.";
  }
}

// helper sleep
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// mock responder
function mockResponder(input: string): string {
  const t = input.trim();
  if (!t) return "Say something and I will respond.";
  const canned = [
    `You said: "${t}". I hear you loud and clear.`,
    `Echo: ${t}. What would you like to do next?`,
    `I understood: ${t}. Here is a helpful response.`
  ];
  return canned[Math.floor(Math.random() * canned.length)];
}