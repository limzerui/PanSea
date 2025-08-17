import { createSandboxUser, createBankAccount, SUPPORTED_BANK } from "./sandbox";
import type { LoginInfo } from "./sandbox";

/**
 * automate creating a sandbox user and a bank account for that user.
 * one user is allowed to have only one bank account
 * @param loginInfo - The login details for the new user.
 * @param bank - The bank to create the account at.
 * @param loginToken - The sandbox API login token.
 * @returns The created account ID.
 */
export async function create(
  loginInfo: LoginInfo,
  bank: SUPPORTED_BANK,
  loginToken: string
): Promise<string> {
  // Step 1: Create the sandbox user
  const userId = await createSandboxUser(loginInfo, loginToken);

  // Step 2: Create the bank account for the user
  const accountId = await createBankAccount(userId, bank, loginToken);

  return accountId;
}