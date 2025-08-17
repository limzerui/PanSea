'use client'
import { createContext, useContext, useState } from "react";

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