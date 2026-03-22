"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusPill } from "./StatusPill";
import { useMode, type AppMode } from "../ModeContext";

interface SidebarProps {
  user: {
    name: string;
    role: string;
    email: string;
  };
  openIssueCount?: number;
}

const NAV_ITEMS = [
  {
    href: "/master",
    label: "Dashboard",
    roles: ["ADMIN", "QA", "MANAGER"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    href: "/my-tests",
    label: "My Tests",
    roles: ["ADMIN", "QA", "ENGINEER", "MANAGER"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/test-plans",
    label: "Test Plans",
    roles: ["ADMIN", "QA", "ENGINEER", "MANAGER"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
  },
  {
    href: "/test-cases",
    label: "Test Cases",
    roles: ["ADMIN", "QA", "ENGINEER", "MANAGER"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    href: "/test-runs",
    label: "Test Runs",
    roles: ["ADMIN", "QA", "ENGINEER", "MANAGER"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    href: "/components",
    label: "Components",
    roles: ["ADMIN", "QA", "ENGINEER", "MANAGER"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
  },
  {
    href: "/issues",
    label: "Issues",
    roles: ["ADMIN", "QA", "ENGINEER", "MANAGER"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    showBadge: true,
  },
  {
    href: "/archives",
    label: "Archives",
    roles: ["ADMIN", "QA", "ENGINEER", "MANAGER"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
  },
];

export function Sidebar({ user, openIssueCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#111118] border-r border-[#2a2a38] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#2a2a38]">
        <span className="font-mono text-sm font-semibold tracking-widest text-[#e8e8f0]">
          TESTLAB
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.filter((item) => item.roles.includes(user.role)).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-[#1a1a24] text-[#e8e8f0]"
                  : "text-[#8888a8] hover:bg-[#1a1a24] hover:text-[#e8e8f0]"
              }`}
            >
              <span className={isActive ? "text-[#e8e8f0]" : "text-[#555570]"}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.showBadge && openIssueCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#ef4444]/15 text-[#ef4444]">
                  {openIssueCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mode switcher */}
      <div className="px-3 py-3 border-t border-[#2a2a38]">
        <ModeSwitcher />
      </div>

      {/* User section */}
      <div className="px-4 py-4 border-t border-[#2a2a38]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <StatusPill status={user.role} />
          </div>
        </div>
      </div>
    </aside>
  );
}

const MODE_OPTIONS: { value: AppMode; label: string; color: string }[] = [
  { value: "admin", label: "Admin", color: "#3b82f6" },
  { value: "testing", label: "Testing", color: "#22c55e" },
  { value: "dev", label: "Dev", color: "#f59e0b" },
];

function ModeSwitcher() {
  const { mode, setMode } = useMode();

  return (
    <div className="flex gap-1 p-0.5 rounded-md bg-[#0a0a0f]">
      {MODE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setMode(opt.value)}
          className="flex-1 text-xs py-1.5 rounded transition-all font-medium"
          style={{
            background: mode === opt.value ? opt.color + "20" : "transparent",
            color: mode === opt.value ? opt.color : "#555570",
            borderBottom: mode === opt.value ? `2px solid ${opt.color}` : "2px solid transparent",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
