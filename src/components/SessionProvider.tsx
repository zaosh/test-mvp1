"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useMode } from "./ModeContext";

const MODE_SESSIONS = {
  admin: {
    user: { id: "mock-admin", name: "Admin", email: "admin@testlab.internal", role: "ADMIN", mustChangePassword: false, sessionVersion: 1 },
    expires: "2099-12-31T23:59:59.999Z",
  },
  testing: {
    user: { id: "mock-qa", name: "QA Engineer", email: "qa@testlab.internal", role: "QA", mustChangePassword: false, sessionVersion: 1 },
    expires: "2099-12-31T23:59:59.999Z",
  },
  dev: {
    user: { id: "mock-dev", name: "Developer", email: "dev@testlab.internal", role: "ENGINEER", mustChangePassword: false, sessionVersion: 1 },
    expires: "2099-12-31T23:59:59.999Z",
  },
};

// MVP: Auth disabled — mock sessions per mode.
// The /api/auth/session endpoint is also overridden to return mock data,
// so useSession() stays "authenticated" on refetch.
// When re-enabling auth, revert this to plain NextAuthSessionProvider.

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useMode();

  return (
    <NextAuthSessionProvider
      session={MODE_SESSIONS[mode] as never}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
