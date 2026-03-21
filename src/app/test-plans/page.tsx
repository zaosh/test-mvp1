"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/shared/StatusPill";
import { GitHubRefBadge } from "@/components/shared/GitHubRefBadge";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState, EMPTY_ICONS } from "@/components/shared/EmptyState";

interface TestPlan {
  id: string;
  title: string;
  description?: string | null;
  milestone?: string | null;
  status: string;
  startDate?: string | null;
  targetDate?: string | null;
  _count: { testCases: number };
  githubRef?: {
    repoUrl: string;
    commitSha?: string | null;
    prNumber?: number | null;
    releaseTag?: string | null;
    branchName?: string | null;
  } | null;
}

const STATUS_OPTIONS = [
  "All",
  "DRAFT",
  "ACTIVE",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
] as const;

export default function TestPlansPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [plans, setPlans] = useState<TestPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const role = (session?.user as any)?.role as string | undefined;
  const canCreate = role === "QA" || role === "ADMIN";

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "All") params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    setLoading(true);
    fetch(`/api/test-plans?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !Array.isArray(data) && Array.isArray(data.data)) {
          setPlans(data.data);
          setTotal(data.total);
        } else {
          setPlans(Array.isArray(data) ? data : []);
          setTotal(Array.isArray(data) ? data.length : 0);
        }
      })
      .catch(() => { setPlans([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Test Plans</h1>
        {canCreate && (
          <button
            onClick={() => router.push("/test-plans/new")}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Plan
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <label className="text-sm text-[#8888a8] mr-2">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3b82f6]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table card */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-[#8888a8]">Loading...</div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={EMPTY_ICONS.testPlan}
            title="No test plans found"
            description="Create a test plan to organize your test cases."
            actionLabel={canCreate ? "Create Plan" : undefined}
            actionHref={canCreate ? "/test-plans/new" : undefined}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a38] text-left text-[#8888a8]">
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Milestone</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right"># Cases</th>
                <th className="px-6 py-3 font-medium">Target Date</th>
                <th className="px-6 py-3 font-medium">GitHub Ref</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  onClick={() => router.push(`/test-plans/${plan.id}`)}
                  className="border-b border-[#2a2a38] last:border-0 hover:bg-[#1a1a24] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium">{plan.title}</td>
                  <td className="px-6 py-4 text-[#8888a8]">
                    {plan.milestone || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={plan.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {plan._count.testCases}
                  </td>
                  <td className="px-6 py-4 text-[#8888a8]">
                    {plan.targetDate
                      ? new Date(plan.targetDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {plan.githubRef ? (
                      <GitHubRefBadge githubRef={plan.githubRef} />
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
