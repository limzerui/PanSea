import { create } from "./services";
import { LoginInfo } from "./sandbox";

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

    if (parsed?.action && parsed?.parameters.login_token) {
      try {
        const action = parsed.action;
        if (action == "create") {
          const loginInfo: LoginInfo = {
            email: parsed.parameters.email,
            username: parsed.parameters.email,
            password: parsed.parameters.password,
            first_name: parsed.parameters.first_name,
            last_name: parsed.parameters.last_name,
          };
          let newUserId = "";
          let newAccountId = "";
          let createError = null;
          try {
            newAccountId = await create(loginInfo, parsed.parameters.bank_id, parsed.parameters.login_token);
          } catch (err) {
            createError = err;
          }

          const followUpHistory: Msg[] = [
            ...safeHistory,
            { role: "assistant", content: raw },
            {
              role: "user",
              content: createError
                ? `The user requested an action "${action}". The backend failed to create the account for user: ${parsed.parameters.email}. Error: ${createError}. Generate a clear, friendly message to the user explaining the failure and possible next steps.`
                : `The user requested an action "${action}". The backend has successfully completed the action and account is setup for user: ${parsed.parameters.email} (userId: ${newUserId}, accountId: ${newAccountId}). Generate a clear, friendly message to the user summarizing the result.`
            }
          ];

          return await getAssistantResponse(followUpHistory);
        }
        // ...handle other actions...
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