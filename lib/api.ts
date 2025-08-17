import { create } from "./services";
import { LoginInfo, makeTransaction, SUPPORTED_BANK } from "./sandbox";

// types
type Msg = { role: "user" | "assistant"; content: string };

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";
export async function getAssistantResponse(history: Msg[]): Promise<{accountId?: string, response: string}> {
  const safeHistory: Msg[] = Array.isArray(history) ? history : [];

  // if (USE_MOCK) {
  //   await sleep(400);
  //   const lastUser = [...safeHistory].reverse().find(m => m.role === "user");
  //   return mockResponder(lastUser?.content || "");
  // }

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
          // Validate required fields
          const requiredFields = ["email", "password", "first_name", "last_name", "bank_id", "login_token"];
          const missingFields = requiredFields.filter(field => !parsed.parameters[field]);
          if (missingFields.length > 0) {
            // Return a direct user-friendly message instead of making another API call
            return { 
              response: `I need some additional information to complete your request. Please provide the following missing details: ${missingFields.join(", ")}. You can provide this information in your next message.`
            };
          }

          const loginInfo: LoginInfo = {
            email: parsed.parameters.email,
            username: parsed.parameters.email,
            password: parsed.parameters.password,
            first_name: parsed.parameters.first_name,
            last_name: parsed.parameters.last_name,
          };
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
                : `The user requested an action "${action}". The backend has successfully completed the action and account is setup for user: ${parsed.parameters.email} accountId: ${newAccountId}). Generate a clear, friendly message to the user summarizing the result.`
            }
          ];

          const response = (await getAssistantResponse(followUpHistory)).response;
          if (!createError) {
            return { accountId: newAccountId, response: response};
          }
          return { response: response };
        } else if (action == "transfer") {
          // Validate required fields for transfer
          const requiredFields = ["from_bank", "from_account_id", "to_bank", "to_account_id", "amount", "login_token"];
          const missingFields = requiredFields.filter(field => !parsed.parameters[field]);
          if (missingFields.length > 0) {
            // Return a direct user-friendly message instead of making another API call
            return { 
              response: `I need some additional information to complete your transfer. Please provide the following missing details: ${missingFields.join(", ")}. You can provide this information in your next message.`
            };
          }

          // Validate bank names are supported
          const supportedBanks = Object.values(SUPPORTED_BANK);
          const fromBank = parsed.parameters.from_bank;
          const toBank = parsed.parameters.to_bank;
          
          if (!supportedBanks.includes(fromBank) || !supportedBanks.includes(toBank)) {
            return {
              response: `Invalid bank name. Supported banks are: ${supportedBanks.join(", ")}. Please provide valid bank names.`
            };
          }

          let transferStatus = "";
          let transferError = null;
          try {
            transferStatus = await makeTransaction(
              fromBank as SUPPORTED_BANK,
              parsed.parameters.from_account_id,
              toBank as SUPPORTED_BANK,
              parsed.parameters.to_account_id,
              parsed.parameters.amount,
              parsed.parameters.login_token
            );
          } catch (err) {
            transferError = err;
          }

          const followUpHistory: Msg[] = [
            ...safeHistory,
            { role: "assistant", content: raw },
            {
              role: "user",
              content: transferError
                ? `The user requested a transfer action. The backend failed to complete the transfer from ${fromBank} account ${parsed.parameters.from_account_id} to ${toBank} account ${parsed.parameters.to_account_id} for amount ${parsed.parameters.amount}. Error: ${transferError}. Generate a clear, friendly message to the user explaining the failure and possible next steps.`
                : `The user requested a transfer action. The backend has successfully completed the transfer from ${fromBank} account ${parsed.parameters.from_account_id} to ${toBank} account ${parsed.parameters.to_account_id} for amount ${parsed.parameters.amount}. Status: ${transferStatus}. Generate a clear, friendly message to the user summarizing the result.`
            }
          ];

          const response = (await getAssistantResponse(followUpHistory)).response;
          return { response: response };
        }
        // ...handle other actions...
      } catch (err) {
        console.error(`[Action failed] ${parsed.action || ""}:`, err);
        return { response: parsed.response || parsed.reply || raw };
      }
    }

    return { response: parsed?.response || parsed?.reply || raw };
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