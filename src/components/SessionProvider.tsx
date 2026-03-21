"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

const mockSession = {
  user: {
    id: "mock-admin",
    name: "Admin",
    email: "admin@testlab.internal",
    role: "ADMIN",
  },
  expires: "2099-12-31T23:59:59.999Z",
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider session={mockSession as never}>
      {children}
    </NextAuthSessionProvider>
  );
}
