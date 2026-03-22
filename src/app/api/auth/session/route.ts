import { NextResponse } from "next/server";

// MVP: Auth disabled — return mock admin session so useSession() stays "authenticated".
// When re-enabling auth, DELETE this file so /api/auth/session falls through to [...nextauth].

const MOCK_SESSION = {
  user: {
    id: "mock-admin",
    name: "Admin",
    email: "admin@testlab.internal",
    role: "ADMIN",
    mustChangePassword: false,
    sessionVersion: 1,
  },
  expires: "2099-12-31T23:59:59.999Z",
};

export async function GET() {
  return NextResponse.json(MOCK_SESSION);
}
