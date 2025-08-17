'use client'
import { createContext, useContext, useState, useEffect } from "react";
import { loginToSandbox, createSandboxUser } from "@/lib/sandbox";
import type { LoginInfo } from "@/lib/sandbox";

const ADMIN_USERNAME = "AlbertDing123";
const ADMIN_PASSWORD = "Fieryzk9631!";

type AccountContextType = {
  loginToken: string | null;
  userId: string | null;
  accountId: string | null;
  setLoginToken: (token: string) => void;
  setUserId: (id: string) => void;
  setAccountId: (id: string) => void;
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loginToken, setLoginToken] = useState<string | null>(null);

  useEffect(() => {
    const autoSetup = async () => {
      try {
        // Auto-login admin
        const token = await loginToSandbox(ADMIN_USERNAME, ADMIN_PASSWORD);
        setLoginToken(token);
        
      } catch (error) {
        console.error("Auto-setup failed:", error);
      }
    };
    
    autoSetup();
  }, []);

  return (
    <AccountContext.Provider value={{ loginToken, userId, accountId, setLoginToken, setUserId, setAccountId }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccountContext = () => {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccountContext must be used within AccountProvider");
  return context;
};