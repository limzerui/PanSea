export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { message, messages } = body;

    // Backwards compatibility: if only messages[] is sent, extract last user message
    if (!message && Array.isArray(messages)) {
      message = messages[messages.length - 1]?.content;
    }

    if (!message) {
      return new Response(
        JSON.stringify({ reply: "No message provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const outbound = [
      {
        role: "system",
        content: `
        You are a virtual banking assistant.

        CRITICAL INSTRUCTION: You MUST respond with ONLY valid JSON. NO thinking process or <think> blocks. ONLY the JSON object.

        CONTEXT AWARENESS:
        - ALWAYS check the first message in the conversation for user context (userId, accountId, loginToken)
        - ALWAYS include the loginToken from context in your parameters
        - If loginToken is available in context, use it; if not, set it to null
        - If users want to transfer money, they are only allowed to transfer money to the accounts listed below. Inform them of the recipient
        names and banks if they ask to transfer money.

        Your response format MUST be exactly this structure:
        {
          "action": "transfer",
          "required": ["login_token", "from_bank", "to_bank", "from_account_id", "to_account_id", "amount"],
          "parameters": {
            "login_token": "token123",
            "from_bank": "banka",
            "to_bank": "bankb",
            "from_account_id": "60d31a56-ad9b-444f-afa8-ee47e5240124",
            "to_account_id": "9c701fd4-86ce-4007-bbf1-568bf19eb2ba",
            "amount": 100
          },
          "response": "I'll help you transfer 100 SGD from your Bank A account to the specified bank account."
        }

        Available actions:
        - "create": When user wants to create/open a new bank account, sign up, register
        - "transfer": When user wants to move funds between accounts OR to other people's accounts. 
        - "greeting": When user says hello, hi, or general conversation without banking intent
        - "other": For any other banking-related queries that don't fit above categories

        Required fields for each action:
        - create: ["login_token", "email", "password", "first_name", "last_name", "bank_id"]
        - transfer: ["login_token", "from_bank", "to_bank", "from_account_id", "to_account_id", "amount"]
        - greeting: []
        - other: []

        Rules:
        - RESPOND WITH ONLY JSON - nothing else
        - ALWAYS include login_token from context in parameters
        - Include "parameters" with ALL values the user has given you
        - If a value is missing, use null in "parameters"
        - Do NOT remove keys from "parameters" — always include them
        - If all required fields are present, proceed without asking again
        - If any required field is missing, clearly ask for it in "response"

        BANK RESTRICTIONS (ENFORCED):
        - ONLY these 3 banks are supported: "banka", "bankb", "bankC"
        - If user mentions any other bank, inform them only these 3 banks are available

        BANK NAME MAPPING (AUTOMATIC):
        When user mentions bank names, automatically map them to the correct bank_id:
        - "Bank A", "BankA", "banka" → "banka"
        - "Bank B", "BankB", "bankb" → "bankb"  
        - "Bank C", "BankC", "bankC" → "bankC"

        ONLY VALID DESTINATION ACCOUNTS FOR TRANSFER:
        - Maxi Smith's account at banka: "60d31a56-ad9b-444f-afa8-ee47e5240124"
        - Peter Tan's account at bankb: "9c701fd4-86ce-4007-bbf1-568bf19eb2ba"
        - Amanda Goh's account at bankC: "fc73a698-428f-434c-a425-67dd52e572c2"

        ACCOUNT RESTRICTIONS (ENFORCED):
        - Users can ONLY transfer to the users listed below
        - Users cannot transfer to accounts that don't exist

        AUTOMATIC ACCOUNT ID MAPPING:
        - When user specifies "banka" or "Bank A", automatically use account_id: "60d31a56-ad9b-444f-afa8-ee47e5240124"
        - When user specifies "bankb" or "Bank B", automatically use account_id: "9c701fd4-86ce-4007-bbf1-568bf19eb2ba"
        - When user specifies "bankC" or "Bank C", automatically use account_id: "fc73a698-428f-434c-a425-67dd52e572c2"

        TRANSFER VALIDATION:
        - Validate that from_bank and to_bank are one of: "banka", "bankb", "bankC"
        - Validate that to_account_id matches the TRANSFERABLE account for that bank
        - If validation fails, explain the restrictions clearly

        REMEMBER: ONLY JSON OUTPUT. NO OTHER TEXT. ALWAYS INCLUDE LOGIN_TOKEN FROM CONTEXT.
        `.trim()
      },
      ...(messages || [{ role: "user", content: message }])
    ];

    const response = await fetch("https://api.sea-lion.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SEA_LION_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "aisingapore/Llama-SEA-LION-v3.5-8B-R",
        messages: outbound,
        max_completion_tokens: 500,
        temperature: 0.2
      }),
    });

    const data = await response.json();
    let content = data?.choices?.[0]?.message?.content || "";

    // Remove <think> blocks
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    let parsedJson: any = null;
    let displayText = content;

    // Try to parse JSON from the content
    try {
      // First, try to parse the entire content as JSON
      try {
        parsedJson = JSON.parse(content.trim());
      } catch (e) {
        // If that fails, try to extract JSON using a more precise regex
        // Look for JSON objects that start with { and end with }
        const jsonMatches = content.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        
        if (jsonMatches) {
          // Try each potential JSON match, starting with the longest one
          const sortedMatches = jsonMatches.sort((a: string, b: string) => b.length - a.length);
          
          for (const match of sortedMatches) {
            try {
              const potentialJson = JSON.parse(match);
              // Validate that it has the expected structure
              if (potentialJson && typeof potentialJson === 'object' && 
                  (potentialJson.action || potentialJson.response || potentialJson.parameters)) {
                parsedJson = potentialJson;
                break;
              }
            } catch (parseError) {
              // Continue to next match
              continue;
            }
          }
        }
        
        // If still no valid JSON found, try a more aggressive approach
        if (!parsedJson) {
          // Look for anything that looks like JSON structure
          const aggressiveMatch = content.match(/\{[^}]*"action"[^}]*\}/);
          if (aggressiveMatch) {
            try {
              parsedJson = JSON.parse(aggressiveMatch[0]);
            } catch (e) {
              console.warn("Failed to parse aggressive JSON match:", e);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse AI JSON, using raw content", e);
      console.warn("Raw content that failed to parse:", content);
    }

    // Use parsed JSON response if available, otherwise use raw content
    if (parsedJson && parsedJson.response) {
      displayText = parsedJson.response;
    } else if (parsedJson) {
      // If we have JSON but no response field, create a user-friendly message
      displayText = "I understand your request. Please provide more details to proceed.";
    }

    // Log only if all required fields are valid
    if (
      parsedJson &&
      parsedJson.action &&
      Array.isArray(parsedJson.required) &&
      parsedJson.parameters &&
      parsedJson.required.every(
        (field: string) =>
          field in parsedJson.parameters &&
          parsedJson.parameters[field] !== null &&
          parsedJson.parameters[field] !== ""
      )
    ) {
      console.log(
        JSON.stringify(
          { action: parsedJson.action, required: parsedJson.required, parameters: parsedJson.parameters },
          null,
          2
        )
      );
    }

    // Always return raw as string to avoid `.trim()` errors in frontend
    const rawString = parsedJson ? JSON.stringify(parsedJson) : String(content);

    return new Response(
      JSON.stringify({ reply: displayText, raw: rawString }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}