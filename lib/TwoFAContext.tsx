'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type TwoFAContextType = {
  isVerified: boolean;
  setIsVerified: (v: boolean) => void;
};

const TwoFAContext = createContext<TwoFAContextType | undefined>(undefined);

export function TwoFAProvider({ children }: { children: ReactNode }) {
  const [isVerified, setIsVerifiedState] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("is2FAVerified");
    if (stored === "true") setIsVerifiedState(true);
  }, []);

  const setIsVerified = (v: boolean) => {
    setIsVerifiedState(v);
    sessionStorage.setItem("is2FAVerified", v ? "true" : "false");
  };

  return (
    <TwoFAContext.Provider value={{ isVerified, setIsVerified }}>
      {children}
    </TwoFAContext.Provider>
  );
}

export function useTwoFA() {
  const ctx = useContext(TwoFAContext);
  if (!ctx) throw new Error("useTwoFA must be used within TwoFAProvider");
  return ctx;
}