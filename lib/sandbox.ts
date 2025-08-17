// This is the users' login details
export type LoginInfo = {
    email: string;
    username: string; // same as email
    // password requirements: Your password should EITHER be 
    // 1. >= 10 characters & contain mixed numbers and both upper & lower case letters and >= one special character
    // 2. the length should be > 16 and <= 512.
    password: string; 
    first_name: string;
    last_name: string;
}

export enum SUPPORTED_BANK {
    BANKA = "banka",
    BANKB = "bankb",
    BANKC = "bankC"
}

// my self-hosted api :)
const MY_API_HOST = "https://obp-api-production-bd77.up.railway.app"

// returns a login token if successful, this only needs to be done once to obtain the token, 
// then future authenticated API calls will use the token
// Note that the username and password is from sandbox account, NOT THE USERS' LOGIN INFO
export async function loginToSandbox(username: string, password: string): Promise<string> {
    console.log("Logging in to sandbox with username:", username);
    console.log("Using API host:", MY_API_HOST);
    console.log("Using consumer key:", process.env.NEXT_PUBLIC_MY_API_CONSUMER_KEY);
    console.log("password: ", password);
    const response = await fetch(MY_API_HOST + "/my/logins/direct", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "directlogin": `username=${username},password=${password},consumer_key=${process.env.NEXT_PUBLIC_MY_API_CONSUMER_KEY}`
        }
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({message: ''}));
        console.error("Sandbox login failed:", response.status, data.message); // console logging instead of throwing to frontend
        return "";
    }
    const data = await response.json()
    return data.token;
}

// returns a user_id 
export async function createSandboxUser(loginInfo: LoginInfo, loginToken: string): Promise<string> {
    try {
        const response = await fetch(MY_API_HOST + "/obp/v4.0.0/users", {
            method: "POST",
            headers: { 
            "Content-Type": "application/json",
            "directlogin": `token=${loginToken}` 
            },
            body: JSON.stringify(loginInfo)
        });
    if (!response.ok) {
        const data = await response.json().catch(() => ({message: ''}));
        console.log(data.message);
        throw new Error(`HTTP ${response.status}: ${data.message}`);
    }
        const data = await response.json();
        return data.user_id;
    } catch (error) {
        console.error("Error creating sandbox user:", error);
        throw error; // or return a default value/null if you prefer
    }
}

// returns a bank account id for the specific bank
// current available bank ids: banka, bankb, bankC (accidentally capitalised the last one oops)
// names: Bank of A, Bank of B, Bank of C
export async function createBankAccount(user_id: string, bank: SUPPORTED_BANK, loginToken: string): Promise<string> {
    try {
        const response = await fetch(`${MY_API_HOST}/obp/v5.1.0/banks/${bank}/accounts`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "directlogin": `token=${loginToken}` 
            },
            body: JSON.stringify({
                user_id: user_id,
                label: "My Account",
                product_code: "1234BW",
                balance: {
                    currency: "SGD",
                    amount: 0 // Must be 0 for account creation
                },
                branch_id: "DERBY6",
                account_routings: [
                    {
                        scheme: "OBP",
                        address: crypto.randomUUID()
                    }
                ]
            })
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({message: ''}));
            console.log(data.message);
            throw new Error(`HTTP ${response.status}: ${data.message}`);
        }
        const data = await response.json();
        return data.account_id;
    } catch (error) {
        console.error("Error creating bank account:", error);
        throw error;
    }
}

// For now stick to transaction amounts < 1000 (999.99 works, but 1000 will have some other behaviour)
// Balance of any account can be artificially 
// increased by using the same from_ids and to_ids (and same banks)
// returns "COMPLETED" if transaction is successful - it should return completed instantly
export async function makeTransaction(
    from_bank: SUPPORTED_BANK, from_account_id: string, 
    to_bank: SUPPORTED_BANK, to_account_id: string, 
    amount: Number, 
    loginToken: string
): Promise<string> {
    const response = await fetch(`${MY_API_HOST}/obp/v5.1.0/banks/${from_bank}/accounts/${from_account_id}/owner/transaction-request-types/SANDBOX_TAN/transaction-requests`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "directlogin": `token=${loginToken}` 
        },
        body: JSON.stringify({
            to: {
                bank_id: to_bank,
                account_id: to_account_id
            },
            value: {
                currency: "SGD",
                amount: `${amount}`
            },
            description: "transfer"
        })
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({message: ''}));
        console.log(data.message);
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.status;
}

