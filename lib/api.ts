// takes in raw ai response, parse it safely, then
// detect any actions returned, if yes, call our backend that relays to bank
// feedback backend response to ai again to output human-readable response
// if no action, return the reply field (should be simple text)

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === '1';

export async function getAssistantResponse(userText: string): Promise<string> {
  if (USE_MOCK) {
    await sleep(400);
    return mockResponder(userText);
  }

  try {
    // call our chat api (which just relays to sealion api)
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: { raw: string } = await res.json();
    const raw = data.raw?.trim() || "AI did not respond.";
    console.log("Raw AI response:", raw);
    // try to safely extract json from ai output
    let parsed: any = null;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("Failed to parse AI JSON, returning raw output.", e);
    }
    console.log(parsed)
    // if ai returned an action, call our backend endpoint that relays to bank
    if (parsed?.action?.name) {
      try {
        const actionRes = await fetch(`/api/${parsed.action.name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.action.params || {}), // WARNING: no safety check for param validity here, but we definitely should later
        });
        const actionData = await actionRes.json();

        // Feed backend response back to AI for human-readable reply
        const humanReply = await getAssistantResponse(
          `The user requested an action "${parsed.action.name}". The backend returned: ${JSON.stringify(
            actionData
          )}. Generate a clear, friendly message to the user summarizing the result.`
        );

        return humanReply;
      } catch (err) {
        console.error(`Failed to call action "${parsed.action.name}":`, err);
        return `${parsed.reply}\n\n[Action failed]`;
      }
    }

    // no action or failed json parse, return reply or raw
    return parsed?.reply || raw;

  } catch (err: any) {
    console.error("Error in getAssistantResponse:", err);
    return 'Could not reach the backend. Please check your connection or use mock mode.';
  }
}

// helper sleep for mock
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// mock responder for testing
function mockResponder(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return 'Say something and I will respond.';
  const canned = [
    `You said: "${trimmed}". I hear you loud and clear.`,
    `Echo: ${trimmed}. What would you like to do next?`,
    `I understood: ${trimmed}. Here is a helpful response.`,
  ];
  return canned[Math.floor(Math.random() * canned.length)];
}
