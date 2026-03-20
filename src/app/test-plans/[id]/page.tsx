"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { StatusPill, TypePill } from "@/components/shared/StatusPill";
import { GitHubRefBadge } from "@/components/shared/GitHubRefBadge";

interface TestCase {
  id: string;
  title: string;
  testType: string;
  status: string;
  forkDepth: number;
  isCanonical: boolean;
  owner?: { id: string; name: string; email?: string } | null;
  component?: { id: string; name: string } | null;
  _count: { testRuns: number };
}

interface TestPlanDetail {
  id: string;
  title: string;
  description?: string | null;
  milestone?: string | null;
  status: string;
  startDate?: string | null;
  targetDate?: string | null;
  testCases: TestCase[];
  githubRef?: {
    repoUrl: string;
    commitSha?: string | null;
    prNumber?: number | null;
    releaseTag?: string | null;
    branchName?: string | null;
  } | null;
  archive?: any;
}

const STATUS_OPTIONS = ["All", "PLANNED", "IN_PROGRESS", "PASSED", "FAILED", "BLOCKED", "CONCLUDED", "WAIVED"];
const TYPE_OPTIONS = ["All", "FLIGHT", "COMPLIANCE", "FUNCTIONAL", "REGRESSION", "MAINTENANCE", "EXPERIMENTAL", "SOFTWARE", "FIRMWARE", "HARDWARE"];

export default function TestPlanDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [plan, setPlan] = useState<TestPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [concluding, setConcluding] = useState(false);

  const role = (session?.user as any)?.role as string | undefined;
  const canConclude = role === "QA" || role === "ADMIN";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/test-plans/${planId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setPlan(data))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [planId]);

  const owners = useMemo(() => {
    if (!plan) return [];
    const map = new Map<string, string>();
    plan.testCases.forEach((tc) => {
      if (tc.owner) map.set(tc.owner.id, tc.owner.name);
    });
    return Array.from(map.entries());
  }, [plan]);

  const filteredCases = useMemo(() => {
    if (!plan) return [];
    return plan.testCases.filter((tc) => {
      if (statusFilter !== "All" && tc.status !== statusFilter) return false;
      if (typeFilter !== "All" && tc.testType !== typeFilter) return false;
      if (ownerFilter !== "All" && tc.owner?.id !== ownerFilter) return false;
      return true;
    });
  }, [plan, statusFilter, typeFilter, ownerFilter]);

  const progressPercent = useMemo(() => {
    if (!plan || plan.testCases.length === 0) return 0;
    const done = plan.testCases.filter(
      (tc) => tc.status === "PASSED" || tc.status === "CONCLUDED"
    ).length;
    return Math.round((done / plan.testCases.length) * 100);
  }, [plan]);

  const handleConclude = async () => {
    if (!confirm("Are you sure you want to conclude this test plan? This will archive it.")) return;
    setConcluding(true);
    try {
      await fetch(`/api/test-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      setPlan((prev) => (prev ? { ...prev, status: "ARCHIVED" } : prev));
    } catch {
      alert("Failed to conclude plan.");
    } finally {
      setConcluding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
        <div className="text-[#8888a8]">Loading...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
        <div className="text-[#555570]">Test plan not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/test-plans")}
          className="text-sm text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
        >
          &larr; Back to Test Plans
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{plan.title}</h1>
            <StatusPill status={plan.status} size="md" />
          </div>
          {plan.description && (
            <p className="text-[#8888a8] max-w-2xl">{plan.description}</p>
          )}
        </div>
        {canConclude && plan.status !== "ARCHIVED" && (
          <button
            onClick={handleConclude}
            disabled={concluding}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {concluding ? "Concluding..." : "Conclude Plan"}
          </button>
        )}
      </div>

      {/* Meta info */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">Milestone</div>
            <div className="text-sm">{plan.milestone || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">Start Date</div>
            <div className="text-sm">
              {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">Target Date</div>
            <div className="text-sm">
              {plan.targetDate ? new Date(plan.targetDate).toLocaleDateString() : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">GitHub Ref</div>
            <div className="text-sm">
              {plan.githubRef ? (
                <GitHubRefBadge githubRef={plan.githubRef} />
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#8888a8]">Progress</span>
          <span className="text-sm font-mono-value">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-[#1a1a24] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#22c55e] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-[#555570] mt-1">
          {plan.testCases.filter((tc) => tc.status === "PASSED" || tc.status === "CONCLUDED").length} of{" "}
          {plan.testCases.length} test cases passed or concluded
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
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
          <label className="text-sm text-[#8888a8] mr-2">Owner:</label>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="All">All</option>
            {owners.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg overflow-hidden">
        {filteredCases.length === 0 ? (
          <div className="p-6 text-center text-[#555570]">No test cases match the current filters.</div>
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
                <th className="px-6 py-3 font-medium">Fork</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((tc) => (
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
                    {tc.forkDepth > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#8888a8]">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#555570]">
                          <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v1.836A2.492 2.492 0 005 7h4a1 1 0 001-1v-.628A2.25 2.25 0 109.5 3.25a2.25 2.25 0 00-1 1.122V6a2.5 2.5 0 01-2.5 2.5H5V5.372zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" />
                        </svg>
                        d{tc.forkDepth}
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
      </div>
    </div>
  );
}
