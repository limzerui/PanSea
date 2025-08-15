// This is the users' login details
interface LoginInfo {
    email: string;
    username: string; // same as email
    password: string;
    first_name: string;
    last_name: string;
}
// my self-hosted api :)
const MY_API_HOST = "https://obp-api-production-bd77.up.railway.app"

// returns a login token if successful, this only needs to be done once to obtain the token, 
// then future authenticated API calls will use the token
// Note that the username and password is from sandbox account, NOT THE USERS' LOGIN INFO
export async function loginToSandbox(username: string, password: string): Promise<string> {
    const response = await fetch(MY_API_HOST + "/my/logins/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({directLogin: {
            username: username + Math.random().toString(36).substring(0, 8),
            password: password,
            consumer_key: process.env.SANDBOX_CONSUMER_KEY
        }})
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({message: ''}));
        console.log(data.message);
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json()
    return data.token;
}

// returns a user_id 
export async function createSandboxUser(loginInfo: LoginInfo, loginToken: string): Promise<string> {
    const response = await fetch(MY_API_HOST + "/obp/v4.0.0/users", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "directlogin": `token=${loginToken}` 
        },
        body: JSON.stringify(loginInfo)
    })
    if (!response.ok) {
        const data = await response.json().catch(() => ({message: ''}));
        console.log(data.message);
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.user_id;
}

// returns a bank account id for the specific bank
// current available bank ids: banka, bankb, bankC (accidentally capitalised the last one oops)
// names: Bank of A, Bank of B, Bank of C
export async function createBankAccount(user_id: string, bank_id: string, loginToken: string): Promise<string> {
    const response = await fetch(`${MY_API_HOST}/obp/v5.1.0/banks/${bank_id}/accounts`, {
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
                amount: 0
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
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.account_id;
}