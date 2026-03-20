"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./shared/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [openIssueCount, setOpenIssueCount] = useState(0);

  const isLoginPage = pathname === "/login";
  const isLoading = status === "loading";

  useEffect(() => {
    if (!isLoginPage && status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, isLoginPage, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/issues?status=OPEN&status=IN_PROGRESS")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setOpenIssueCount(data.length);
        })
        .catch(() => {});
    }
  }, [session]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="text-[#555570] text-sm">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = {
    name: session.user?.name || "User",
    role: (session.user as Record<string, string>)?.role || "ENGINEER",
    email: session.user?.email || "",
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar user={user} openIssueCount={openIssueCount} />
      <main className="flex-1 ml-60 p-6">{children}</main>
    </div>
  );
}
