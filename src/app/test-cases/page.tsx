"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StatusPill, TypePill } from "@/components/shared/StatusPill";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState, EMPTY_ICONS } from "@/components/shared/EmptyState";

interface TestCaseSummary {
  id: string;
  title: string;
  testType: string;
  status: string;
  forkDepth: number;
  isCanonical: boolean;
  owner?: { id: string; name: string } | null;
  component?: { id: string; name: string } | null;
  _count: { testRuns: number; forks: number };
}

interface FilterOption {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ["All", "PLANNED", "IN_PROGRESS", "PASSED", "FAILED", "BLOCKED", "CONCLUDED", "WAIVED"];
const TYPE_OPTIONS = ["All", "FLIGHT", "COMPLIANCE", "FUNCTIONAL", "REGRESSION", "MAINTENANCE", "EXPERIMENTAL", "SOFTWARE", "FIRMWARE", "HARDWARE"];

export default function TestCasesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [cases, setCases] = useState<TestCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState<FilterOption[]>([]);
  const [users, setUsers] = useState<FilterOption[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [componentFilter, setComponentFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [hasForksOnly, setHasForksOnly] = useState(false);

  const role = (session?.user as any)?.role as string | undefined;
  const canCreate = role === "QA" || role === "ADMIN";

  // Fetch filter options
  useEffect(() => {
    fetch("/api/components")
      .then((r) => r.json())
      .then((data) => setComponents(Array.isArray(data) ? data : []))
      .catch(() => setComponents([]));

    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, componentFilter, ownerFilter, hasForksOnly]);

  // Fetch test cases with filters and pagination
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (typeFilter !== "All") params.set("type", typeFilter);
    if (componentFilter !== "All") params.set("componentId", componentFilter);
    if (ownerFilter !== "All") params.set("ownerId", ownerFilter);
    if (hasForksOnly) params.set("hasForksOnly", "true");
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    setLoading(true);
    fetch(`/api/test-cases?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !Array.isArray(data) && Array.isArray(data.data)) {
          setCases(data.data);
          setTotal(data.total);
        } else {
          setCases(Array.isArray(data) ? data : []);
          setTotal(Array.isArray(data) ? data.length : 0);
        }
      })
      .catch(() => { setCases([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter, componentFilter, ownerFilter, hasForksOnly, page]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Test Cases</h1>
        {canCreate && (
          <button
            onClick={() => router.push("/test-cases/new")}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Test Case
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="text-sm text-[#8888a8] mr-2">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-[#8888a8] mr-2">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-[#8888a8] mr-2">Component:</label>
          <select
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="All">All</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-[#8888a8] mr-2">Owner:</label>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="All">All</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#8888a8] cursor-pointer">
          <input
            type="checkbox"
            checked={hasForksOnly}
            onChange={(e) => setHasForksOnly(e.target.checked)}
            className="rounded border-[#2a2a38] bg-[#1a1a24] text-[#3b82f6] focus:ring-[#3b82f6]"
          />
          Has forks
        </label>
      </div>

      {/* Table */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-[#8888a8]">Loading...</div>
        ) : cases.length === 0 ? (
          <EmptyState
            icon={EMPTY_ICONS.testCase}
            title="No test cases found"
            description="Create your first test case to start tracking tests."
            actionLabel={canCreate ? "Create Test Case" : undefined}
            actionHref={canCreate ? "/test-cases/new" : undefined}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a38] text-left text-[#8888a8]">
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Component</th>
                <th className="px-6 py-3 font-medium">Owner</th>
                <th className="px-6 py-3 font-medium text-right">Runs</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Forks</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((tc) => (
                <tr
                  key={tc.id}
                  onClick={() => router.push(`/test-cases/${tc.id}`)}
                  className="border-b border-[#2a2a38] last:border-0 hover:bg-[#1a1a24] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium">{tc.title}</td>
                  <td className="px-6 py-4">
                    <TypePill type={tc.testType} />
                  </td>
                  <td className="px-6 py-4 text-[#8888a8]">
                    {tc.component?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-[#8888a8]">
                    {tc.owner?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-right font-mono-value">
                    {tc._count.testRuns}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={tc.status} />
                  </td>
                  <td className="px-6 py-4">
                    {tc._count.forks > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#8888a8]">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#555570]">
                          <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v1.836A2.492 2.492 0 005 7h4a1 1 0 001-1v-.628A2.25 2.25 0 109.5 3.25a2.25 2.25 0 00-1 1.122V6a2.5 2.5 0 01-2.5 2.5H5V5.372zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" />
                        </svg>
                        {tc._count.forks}
                      </span>
                    ) : (
                      <span className="text-[#555570]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
