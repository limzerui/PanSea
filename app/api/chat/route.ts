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

        Always respond ONLY in valid JSON, no text outside JSON, no <think> blocks.
        
        JSON format:
        {
          "action": "<create|deposit|withdraw|transaction|greeting|other>",
          "required": [ ...list of required fields based on action... ],
          "parameters": { ...always include all known values here, even if some are missing... },
          "response": "<user-facing message>"
        }
        
        Rules:
        - For create: required = ["login_token", "email", "password", "first_name", "last_name", "bank_id"]
        - For deposit: required = ["bank_id", "account_id", "deposit_sum", "result_balance"]
        - For withdraw: required = ["bank_id", "account_id", "withdrawal_sum", "result_balance"]
        - For transaction: required = ["login_token", "from_bank", "to_bank", "from_account_id", "to_account_id", "amount"]
        - For greeting: required = []
        
        - Always include "parameters" with ALL values the user has already given you.
        - If a value is missing, keep the key in "parameters" with null as the value.
        - Do NOT remove keys from "parameters" just because they are missing — always include them.
        - If all required fields are present, proceed without asking again.
        - If any required field is missing, clearly ask for it in "response".
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

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedJson = JSON.parse(jsonMatch[0]);

        // Only check missing fields for banking actions
        if (
          parsedJson &&
          ["create", "deposit", "withdraw", "transaction"].includes(parsedJson.action)
        ) {
          const missingFields = parsedJson.required.filter(
            (field: string) => !(field in parsedJson.parameters) || parsedJson.parameters[field] == null
          );

          if (missingFields.length > 0) {
            parsedJson.response = `I still need the following details: ${missingFields.join(", ")}. Please provide them.`;
          }
        }

        displayText = parsedJson.response || displayText;
      }
    } catch (e) {
      console.warn("Failed to parse JSON:", e, "Raw content:", content);
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