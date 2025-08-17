# Virtual Banking Assistant

A chat-based banking assistant powered by an LLM, connected to a sandbox bank API that mimics real banking operations. Powered by SEA-LION, the assistant can seamlessly handle banking tasks in multiple Southeast Asian languages — from English and Bahasa Indonesia to Tagalog, Thai, and Vietnamese — enabling users to open accounts, deposit, withdraw, and transfer funds in their own language.



---

## What It Does
- Provides a conversational interface for everyday banking, reducing the need for complex app navigation  
- Supports key operations to mimic real banking:  
  - Account creation → onboard new users quickly  
  - Deposits → add funds easily  
  - Withdrawals → access funds on demand  
  - Transfers → move money between accounts instantly  
- Understands and responds in multiple Southeast Asian languages (English, Bahasa Indonesia, Tagalog, Thai, Vietnamese), making banking more inclusive and accessible  
- Automatically validates and asks for missing details, ensuring smooth and error-free transactions  
- Records every successful action in structured JSON, enabling easy integration with real banking systems  
---

## How It Works
1. User message → sent to LLM (SEA-LION), which can interpret banking requests in Southeast Asian languages (e.g. Bahasa Indonesia, Tagalog, Thai, Vietnamese) and normalize them into English for processing.  
2. LLM (SEA-LION) → responds in a strict JSON schema for the sandbox banking API.  
3. Sandbox Bank API → executes the simulated banking operation.  
4. Backend returns both a clean reply for the user in their original language and the raw JSON for the bank API to process cleanly.  
---

## Tech Stack
- Next.js (App Router) 
- SEA-LION LLM for language understanding  
- In-memory Sandbox Bank API for simulating transactions  

---

## Setup and Run
- Create a .env.local file in the project root with: SEA_LION_API_KEY=your_api_key_here
- npm run dev

