"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { StatusPill, TypePill } from "@/components/shared/StatusPill";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
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

type IssueSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WONT_FIX" | "DEFERRED";

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: User | null;
  assignee: User | null;
  component: Component | null;
  testRun: TestRun | null;
  resolutionNotes?: string;
  deferredTo?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: IssueStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "WONT_FIX",
  "DEFERRED",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ageDays = (createdAt: string): number =>
  Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IssueDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const issueId = params.id as string;

  // Data
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update form
  const [newStatus, setNewStatus] = useState<IssueStatus | "">("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [deferredTo, setDeferredTo] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // ---- Fetch issue ----
  useEffect(() => {
    const fetchIssue = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/issues/${issueId}`);
        if (!res.ok) throw new Error("Failed to fetch issue");
        const data: Issue = await res.json();
        setIssue(data);
        setNewStatus(data.status);
        setResolutionNotes(data.resolutionNotes ?? "");
        setDeferredTo(data.deferredTo ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (issueId) fetchIssue();
  }, [issueId]);

  // ---- Determine if current user can update status ----
  const sessionUser = session?.user as (User & { role?: string }) | undefined;
  const canUpdateStatus =
    sessionUser &&
    issue &&
    (sessionUser.role === "ADMIN" ||
      sessionUser.role === "QA" ||
      sessionUser.id === issue.assignee?.id);

  // ---- Handle status update ----
  const handleStatusUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStatus || !issue) return;

    if (newStatus === "RESOLVED" && !resolutionNotes.trim()) {
      setUpdateError("Resolution notes are required when resolving an issue.");
      return;
    }

    setUpdating(true);
    setUpdateError(null);

    try {
      const payload: Record<string, string> = { status: newStatus };
      if (newStatus === "RESOLVED") payload.resolutionNotes = resolutionNotes.trim();
      if (newStatus === "DEFERRED") payload.deferredTo = deferredTo.trim();

      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to update issue");
      }

      const updated: Issue = await res.json();
      setIssue(updated);
      setNewStatus(updated.status);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUpdating(false);
    }
  };

  // ---- Styles ----
  const inputClasses =
    "w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#555570]";
  const labelClasses = "block text-sm font-medium text-[#8888a8] mb-1.5";
  const cardClasses = "bg-[#111118] border border-[#2a2a38] rounded-lg p-6";

  // ---- Render: loading / error ----
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-[#555570]">
        Loading issue...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-red-400">
        {error ?? "Issue not found"}
      </div>
    );
  }

  // ---- Render: issue detail ----
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <button
          onClick={() => router.push("/issues")}
          className="text-[#8888a8] hover:text-[#e8e8f0] text-sm mb-6 inline-flex items-center gap-1 transition-colors"
        >
          &larr; Back to Issues
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-start gap-3 mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex-1 min-w-0">
            {issue.title}
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusPill status={issue.severity} />
            <StatusPill status={issue.status} />
            <span className="inline-flex items-center bg-[#1a1a24] border border-[#2a2a38] text-[#8888a8] text-xs rounded-full px-2.5 py-0.5">
              {ageDays(issue.createdAt)}d old
            </span>
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#8888a8] mb-8">
          <span>
            Created by{" "}
            <span className="text-[#e8e8f0]">
              {issue.createdBy?.name ?? "Unknown"}
            </span>
          </span>
          <span>
            Created{" "}
            <span className="text-[#e8e8f0]">{formatDate(issue.createdAt)}</span>
          </span>
          <span>
            Assignee{" "}
            <span className="text-[#e8e8f0]">
              {issue.assignee?.name ?? "Unassigned"}
            </span>
          </span>
        </div>

        {/* Description */}
        <div className={`${cardClasses} mb-6`}>
          <h2 className="text-sm font-semibold text-[#8888a8] uppercase tracking-wider mb-3">
            Description
          </h2>
          <p className="text-[#e8e8f0] whitespace-pre-wrap leading-relaxed">
            {issue.description}
          </p>
        </div>

        {/* Linked cards row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Linked Test Run */}
          {issue.testRun && (
            <button
              onClick={() =>
                router.push(`/test-runs/${issue.testRun!.id}`)
              }
              className={`${cardClasses} text-left hover:border-[#555570] transition-colors`}
            >
              <h3 className="text-xs font-semibold text-[#555570] uppercase tracking-wider mb-2">
                Linked Test Run
              </h3>
              <p className="font-medium text-[#e8e8f0] mb-1">
                {issue.testRun.testCase?.title ?? "Untitled"}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#8888a8]">
                <span>{formatDate(issue.testRun.runDate)}</span>
                <StatusPill status={issue.testRun.status} />
              </div>
            </button>
          )}

          {/* Linked Component */}
          {issue.component && (
            <button
              onClick={() =>
                router.push(`/components/${issue.component!.id}`)
              }
              className={`${cardClasses} text-left hover:border-[#555570] transition-colors`}
            >
              <h3 className="text-xs font-semibold text-[#555570] uppercase tracking-wider mb-2">
                Linked Component
              </h3>
              <p className="font-medium text-[#e8e8f0] mb-1">
                {issue.component.name}
              </p>
              <TypePill type={issue.component.type} />
            </button>
          )}
        </div>

        {/* Status update section */}
        {canUpdateStatus && (
          <div className={cardClasses}>
            <h2 className="text-sm font-semibold text-[#8888a8] uppercase tracking-wider mb-4">
              Update Status
            </h2>

            {updateError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {updateError}
              </div>
            )}

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              {/* Status dropdown */}
              <div>
                <label htmlFor="status" className={labelClasses}>
                  Status
                </label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                  className={inputClasses}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resolution Notes (shown when RESOLVED) */}
              {newStatus === "RESOLVED" && (
                <div>
                  <label htmlFor="resolutionNotes" className={labelClasses}>
                    Resolution Notes <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="resolutionNotes"
                    rows={4}
                    required
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe the resolution..."
                    className={`${inputClasses} resize-y`}
                  />
                </div>
              )}

              {/* Deferred To (shown when DEFERRED) */}
              {newStatus === "DEFERRED" && (
                <div>
                  <label htmlFor="deferredTo" className={labelClasses}>
                    Deferred To
                  </label>
                  <input
                    id="deferredTo"
                    type="text"
                    value={deferredTo}
                    onChange={(e) => setDeferredTo(e.target.value)}
                    placeholder="e.g. v2.1, Sprint 14, Q3 2026"
                    className={inputClasses}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={updating}
                className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
