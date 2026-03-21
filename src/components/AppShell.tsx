"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./shared/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openIssueCount, setOpenIssueCount] = useState(0);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    fetch("/api/issues?status=OPEN&status=IN_PROGRESS")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOpenIssueCount(data.length);
      })
      .catch(() => {});
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const user = {
    name: "Admin",
    role: "ADMIN",
    email: "admin@testlab.internal",
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar user={user} openIssueCount={openIssueCount} />
      <main className="flex-1 ml-60 p-6">{children}</main>
    </div>
  );
}
