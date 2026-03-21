"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/shared/StatusPill";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState, EMPTY_ICONS } from "@/components/shared/EmptyState";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  name: string;
  email: string;
}

interface Component {
  id: string;
  name: string;
  type: string;
}

interface TestRun {
  id: string;
  testCase: {
    id: string;
    title: string;
  };
  status: string;
  runDate: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WONT_FIX" | "DEFERRED";
  createdAt: string;
  updatedAt: string;
  createdBy: User | null;
  assignee: User | null;
  component: Component | null;
  testRun: TestRun | null;
}

// ---------------------------------------------------------------------------
// Severity sort order (CRITICAL first)
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<Issue["severity"], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const SEVERITY_OPTIONS: Issue["severity"][] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUS_OPTIONS: Issue["status"][] = ["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX", "DEFERRED"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IssuesPage() {
  const router = useRouter();

  // Data
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [components, setComponents] = useState<Component[]>([]);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [componentFilter, setComponentFilter] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch lookup data on mount ----
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [usersRes, componentsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/components"),
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (componentsRes.ok) setComponents(await componentsRes.json());
      } catch {
        // Non-critical — dropdowns just stay empty
      }
    };
    fetchLookups();
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [severityFilter, statusFilter, assigneeFilter, componentFilter]);

  // ---- Fetch issues whenever filters or page change ----
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (severityFilter) params.set("severity", severityFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (assigneeFilter) params.set("assigneeId", assigneeFilter);
    if (componentFilter) params.set("componentId", componentFilter);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    try {
      const res = await fetch(`/api/issues?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch issues");
      const data = await res.json();

      if (data && !Array.isArray(data) && Array.isArray(data.data)) {
        setIssues(data.data);
        setTotal(data.total);
      } else {
        const arr: Issue[] = Array.isArray(data) ? data : [];
        arr.sort((a, b) => {
          const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          if (sevDiff !== 0) return sevDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setIssues(arr);
        setTotal(arr.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter, assigneeFilter, componentFilter, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // ---- Derived ----
  const openCount = issues.filter(
    (i) => i.status === "OPEN" || i.status === "IN_PROGRESS"
  ).length;

  const ageDays = (createdAt: string): number =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);

  // ---- Select helper ----
  const selectClasses =
    "bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6] transition-colors";

  // ---- Render ----
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
            <span className="inline-flex items-center justify-center bg-[#3b82f6]/15 text-[#3b82f6] text-xs font-semibold rounded-full px-2.5 py-0.5">
              {openCount} open
            </span>
          </div>

          <button
            onClick={() => router.push("/issues/new")}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Issue
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={selectClasses}
          >
            <option value="">All Severities</option>
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClasses}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className={selectClasses}
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value)}
            className={selectClasses}
          >
            <option value="">All Components</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#555570]">
              Loading issues...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-red-400">
              {error}
            </div>
          ) : issues.length === 0 ? (
            <EmptyState
              icon={EMPTY_ICONS.issue}
              title="No issues found"
              description="No issues match your current filters. Try adjusting them or create a new issue."
              actionLabel="Create Issue"
              actionHref="/issues/new"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a38] text-[#8888a8] text-left">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Component</th>
                    <th className="px-4 py-3 font-medium">Assignee</th>
                    <th className="px-4 py-3 font-medium">Age</th>
                    <th className="px-4 py-3 font-medium">Linked Test Run</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a38]">
                  {issues.map((issue) => (
                    <tr
                      key={issue.id}
                      onClick={() => router.push(`/issues/${issue.id}`)}
                      className="hover:bg-[#1a1a24] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#e8e8f0] max-w-[260px] truncate">
                        {issue.title}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={issue.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={issue.status} />
                      </td>
                      <td className="px-4 py-3 text-[#8888a8]">
                        {issue.component?.name ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-[#8888a8]">
                        {issue.assignee?.name ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-[#8888a8]">
                        {ageDays(issue.createdAt)}d
                      </td>
                      <td className="px-4 py-3 text-[#8888a8] max-w-[200px] truncate">
                        {issue.testRun?.testCase?.title ?? "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
