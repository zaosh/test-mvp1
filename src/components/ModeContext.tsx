"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type AppMode = "admin" | "testing" | "dev";

interface ModeUser {
  name: string;
  role: string;
  email: string;
}

const MODE_PROFILES: Record<AppMode, ModeUser> = {
  admin: { name: "Admin", role: "ADMIN", email: "admin@testlab.internal" },
  testing: { name: "QA Engineer", role: "QA", email: "qa@testlab.internal" },
  dev: { name: "Developer", role: "ENGINEER", email: "dev@testlab.internal" },
};

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  user: ModeUser;
}

const ModeContext = createContext<ModeContextValue>({
  mode: "admin",
  setMode: () => {},
  user: MODE_PROFILES.admin,
});

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("admin");

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
  }, []);

  return (
    <ModeContext.Provider value={{ mode, setMode, user: MODE_PROFILES[mode] }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
