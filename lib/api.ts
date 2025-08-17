import { create } from "./services";
import { LoginInfo, makeTransaction, SUPPORTED_BANK } from "./sandbox";
import { EXISTING_USERS } from "./users";

// types
type Msg = { role: "user" | "assistant"; content: string };

// Helper function to validate account IDs
function validateAccountId(accountId: string, bankId: string): boolean {
  return EXISTING_USERS[0].accounts.some(account => 
    account.account_id === accountId && account.bank_id === bankId
  );
}

// Helper function to get available accounts formatted for display
function getAvailableAccountsDisplay(): string {
  return EXISTING_USERS[0].accounts.map((account, index) => 
    `${index + 1}. ${account.bank_id} - Account ID: ${account.account_id}`
  ).join("\n");
}

// Helper function to extract login token from context
function extractLoginTokenFromContext(history: Msg[]): string | null {
  if (history.length === 0) return null;
  
  try {
    // Check if the first message contains context
    const firstMessage = history[0];
    if (firstMessage.role === "user") {
      const contextData = JSON.parse(firstMessage.content);
      return contextData.loginToken || null;
    }
  } catch (e) {
    console.warn("Failed to extract login token from context:", e);
  }
  
  return null;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";
export async function getAssistantResponse(history: Msg[], recursionDepth: number = 0): Promise<{accountId?: string, response: string}> {
  const safeHistory: Msg[] = Array.isArray(history) ? history : [];
  
  // Prevent infinite recursion
  if (recursionDepth > 2) {
    console.warn("Recursion limit reached, returning fallback response");
    return { response: "I'm having trouble processing your request. Please try again with more specific information." };
  }

  // Extract login token from context
  const loginToken = extractLoginTokenFromContext(safeHistory);
  console.log("Extracted login token from context:", loginToken);

  // if (USE_MOCK) {
  //   await sleep(400);
  //   const lastUser = [...safeHistory].reverse().find(m => m.role === "user");
  //   return mockResponder(lastUser?.content || "");
  // }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages: [
          {
            role: "system",
            content: `CRITICAL: Respond ONLY with valid JSON. NO explanations, NO thinking process, NO text before or after JSON. ONLY the JSON object.

CONTEXT: Current login token is: ${loginToken || 'null'}

ALWAYS include this login_token in your parameters.`
          },
          ...safeHistory
        ]
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: { raw?: string; reply?: string } = await res.json();
    const reply = data.reply?.trim() || "AI did not respond.";
    const raw = data.raw?.trim() || reply;
    console.log("Raw AI response:", raw);
    console.log("User-friendly reply:", reply);

    // Only return the human-friendly reply, don't process JSON for actions
    return { response: reply };
  } catch (err: any) {
    console.error("Error in getAssistantResponse:", err);
    return { response: "Could not reach the backend. Please check your connection or use mock mode." };
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