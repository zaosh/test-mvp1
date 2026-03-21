"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { StatusPill, TypePill } from "@/components/shared/StatusPill";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

interface ComponentDetail {
  id: string;
  name: string;
  type: string;
  version: string | null;
  serialNumber: string | null;
  description: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  _count: { testCases: number; testRuns: number; issues: number };
}

interface TestRun {
  id: string;
  runDate: string;
  environment: string;
  status: string;
  notes: string | null;
  testCase: { id: string; title: string; testType: string };
  loggedBy: { id: string; name: string };
}

interface Issue {
  id: string;
  title: string;
  severity: string;
  status: string;
  assignee: { id: string; name: string } | null;
}

interface TestCase {
  id: string;
  title: string;
  testType: string;
  status: string;
  owner: { id: string; name: string } | null;
}

export default function ComponentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session, status: authStatus } = useSession();

  const [component, setComponent] = useState<ComponentDetail | null>(null);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (authStatus === "authenticated" && id) {
      Promise.all([
        fetch(`/api/components/${id}`).then((r) => {
          if (!r.ok) throw new Error("Failed to load component");
          return r.json();
        }),
        fetch(`/api/test-runs?componentId=${id}`).then((r) => r.json()),
        fetch(`/api/issues?componentId=${id}`).then((r) => r.json()),
        fetch(`/api/test-cases?componentId=${id}`).then((r) => r.json()),
      ])
        .then(([compData, runsData, issuesData, casesData]) => {
          setComponent(compData);
          setTestRuns(
            Array.isArray(runsData)
              ? runsData.sort(
                  (a: TestRun, b: TestRun) =>
                    new Date(b.runDate).getTime() -
                    new Date(a.runDate).getTime()
                )
              : []
          );
          setIssues(Array.isArray(issuesData) ? issuesData : []);
          setTestCases(Array.isArray(casesData) ? casesData : []);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [authStatus, id, router]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const activeIssues = issues.filter(
    (i) => i.status === "OPEN" || i.status === "IN_PROGRESS"
  );

  const sessionUser = session?.user as { role?: string } | undefined;
  const canDelete =
    sessionUser?.role === "ADMIN" || sessionUser?.role === "QA";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/components/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete component");
      router.push("/components");
    } catch {
      setDeleting(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8888a8] text-sm">Loading component...</div>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-[#ef4444] text-sm">
          {error ?? "Component not found"}
        </div>
        <button
          onClick={() => router.push("/components")}
          className="bg-transparent border border-[#2a2a38] text-[#8888a8] hover:text-[#e8e8f0] hover:border-[#555570] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Back to Components
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => router.push("/components")}
        className="text-[#8888a8] hover:text-[#e8e8f0] text-sm transition-colors flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Components
      </button>

      {/* Header */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl text-[#e8e8f0] tracking-tight">
              {component.name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <TypePill type={component.type} size="md" />
              <StatusPill status={component.status} size="md" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="space-y-1 text-right">
              {component.version && (
                <div>
                  <span className="text-xs text-[#555570] uppercase tracking-wider">
                    Version{" "}
                  </span>
                  <span className="font-mono-value text-sm text-[#e8e8f0]">
                    {component.version}
                  </span>
                </div>
              )}
              {component.serialNumber && (
                <div>
                  <span className="text-xs text-[#555570] uppercase tracking-wider">
                    S/N{" "}
                  </span>
                  <span className="font-mono-value text-sm text-[#e8e8f0]">
                    {component.serialNumber}
                  </span>
                </div>
              )}
            </div>
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {component.description && (
          <div className="mt-4 pt-4 border-t border-[#2a2a38]">
            <p className="text-sm text-[#8888a8] leading-relaxed">
              {component.description}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-[#2a2a38] grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-[#555570] uppercase tracking-wider">
              Test Runs
            </div>
            <div className="font-mono-value text-lg text-[#e8e8f0] mt-0.5">
              {component._count.testRuns}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#555570] uppercase tracking-wider">
              Test Cases
            </div>
            <div className="font-mono-value text-lg text-[#e8e8f0] mt-0.5">
              {component._count.testCases}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#555570] uppercase tracking-wider">
              Issues
            </div>
            <div className="font-mono-value text-lg text-[#e8e8f0] mt-0.5">
              {component._count.issues}
            </div>
          </div>
        </div>
      </div>

      {/* Test History Timeline */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <h2 className="text-sm text-[#8888a8] uppercase tracking-wider mb-4">
          Test History ({testRuns.length})
        </h2>

        {testRuns.length === 0 ? (
          <p className="text-xs text-[#555570]">
            No test runs recorded for this component.
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#2a2a38]" />

            <div className="space-y-0">
              {testRuns.map((run, _index) => (
                <div
                  key={run.id}
                  onClick={() => router.push(`/test-runs/${run.id}`)}
                  className="relative pl-8 py-3 hover:bg-[#1a1a24] cursor-pointer transition-colors rounded-lg -ml-2 px-2 pl-10"
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute left-2 top-[18px] w-[11px] h-[11px] rounded-full border-2 border-[#0a0a0f]"
                    style={{
                      backgroundColor:
                        run.status === "PASSED"
                          ? "#22c55e"
                          : run.status === "FAILED"
                          ? "#ef4444"
                          : run.status === "IN_PROGRESS"
                          ? "#3b82f6"
                          : "#f97316",
                    }}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-[#e8e8f0]">
                          {run.testCase.title}
                        </span>
                        <StatusPill status={run.status} />
                      </div>
                      {run.notes && (
                        <p className="text-xs text-[#555570] line-clamp-1">
                          {run.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#555570] whitespace-nowrap">
                      <span>{run.loggedBy.name}</span>
                      <span>{formatDate(run.runDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Issues */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <h2 className="text-sm text-[#8888a8] uppercase tracking-wider mb-4">
          Active Issues ({activeIssues.length})
        </h2>

        {activeIssues.length === 0 ? (
          <p className="text-xs text-[#555570]">
            No active issues for this component.
          </p>
        ) : (
          <div className="space-y-2">
            {activeIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => router.push(`/issues/${issue.id}`)}
                className="flex items-center justify-between bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-3 hover:border-[#555570] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm text-[#e8e8f0] truncate">
                    {issue.title}
                  </span>
                  <StatusPill status={issue.severity} />
                  <StatusPill status={issue.status} />
                </div>
                <span className="text-xs text-[#555570] whitespace-nowrap ml-3">
                  {issue.assignee?.name ?? "Unassigned"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Coverage */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <h2 className="text-sm text-[#8888a8] uppercase tracking-wider mb-4">
          Test Coverage ({testCases.length})
        </h2>

        {testCases.length === 0 ? (
          <p className="text-xs text-[#555570]">
            No test cases linked to this component.
          </p>
        ) : (
          <div className="space-y-2">
            {testCases.map((tc) => (
              <div
                key={tc.id}
                onClick={() => router.push(`/test-cases/${tc.id}`)}
                className="flex items-center justify-between bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-3 hover:border-[#555570] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm text-[#e8e8f0] truncate">
                    {tc.title}
                  </span>
                  <TypePill type={tc.testType} />
                  <StatusPill status={tc.status} />
                </div>
                <span className="text-xs text-[#555570] whitespace-nowrap ml-3">
                  {tc.owner?.name ?? "No owner"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Component"
        description="This component will be soft-deleted and hidden from lists."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleting}
      />
    </div>
  );
}
