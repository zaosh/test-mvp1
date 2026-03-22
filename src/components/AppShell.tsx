"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./shared/Sidebar";
import { useMode } from "./ModeContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useMode();
  const [openIssueCount, setOpenIssueCount] = useState(0);

  useEffect(() => {
    fetch("/api/issues?status=OPEN&status=IN_PROGRESS")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOpenIssueCount(data.length);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar user={user} openIssueCount={openIssueCount} />
      <main className="flex-1 ml-60 p-6">{children}</main>
    </div>
  );
}
