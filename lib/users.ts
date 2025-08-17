import { SUPPORTED_BANK } from "./sandbox";

interface AccountInfo {
    bank_id: SUPPORTED_BANK;
    account_id: string;
}
export interface User {
    id: string;
    accounts: AccountInfo[];
    first_name: string;
    last_name: string;
}

// this is just for easy access and testing, i can add 
// api calls to get this info as well but will be more confusing
export const EXISTING_USERS: User[] = [
    {
        id: "dedacac6-06b2-415f-b225-c2fcae95c498",
        accounts: [
            {
                bank_id: SUPPORTED_BANK.BANKA,
                account_id: "60d31a56-ad9b-444f-afa8-ee47e5240124" 
            },
            {
                bank_id: SUPPORTED_BANK.BANKB,
                account_id: "9c701fd4-86ce-4007-bbf1-568bf19eb2ba" 
            },
            {
                bank_id: SUPPORTED_BANK.BANKC,
                account_id: "fc73a698-428f-434c-a425-67dd52e572c2" 
            }
        ],
        first_name: "Maxi",
        last_name: "Smith"
    }
];