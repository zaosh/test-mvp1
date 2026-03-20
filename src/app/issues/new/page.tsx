"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

interface CreateIssuePayload {
  title: string;
  description: string;
  severity: string;
  componentId?: string;
  assigneeId?: string;
  testRunId?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_OPTIONS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateIssuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedTestRunId = searchParams.get("testRunId") ?? "";

  // Lookup data
  const [users, setUsers] = useState<User[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("");
  const [componentId, setComponentId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [testRunId, setTestRunId] = useState<string>(preSelectedTestRunId);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch lookups ----
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [usersRes, componentsRes, testRunsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/components"),
          fetch("/api/test-runs"),
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (componentsRes.ok) setComponents(await componentsRes.json());
        if (testRunsRes.ok) setTestRuns(await testRunsRes.json());
      } catch {
        // Non-critical
      }
    };
    fetchLookups();
  }, []);

  // ---- Submit ----
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: CreateIssuePayload = {
      title: title.trim(),
      description: description.trim(),
      severity,
    };
    if (componentId) payload.componentId = componentId;
    if (assigneeId) payload.assigneeId = assigneeId;
    if (testRunId) payload.testRunId = testRunId;

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to create issue");
      }

      const created = await res.json();
      router.push(`/issues/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Styles ----
  const inputClasses =
    "w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#555570]";
  const labelClasses = "block text-sm font-medium text-[#8888a8] mb-1.5";

  // ---- Render ----
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1 className="text-2xl font-bold tracking-tight mb-8">Create Issue</h1>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className={labelClasses}>
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              className={inputClasses}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className={labelClasses}>
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation, steps to reproduce, expected vs actual behavior..."
              className={`${inputClasses} resize-y`}
            />
          </div>

          {/* Severity */}
          <div>
            <label htmlFor="severity" className={labelClasses}>
              Severity <span className="text-red-400">*</span>
            </label>
            <select
              id="severity"
              required
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className={inputClasses}
            >
              <option value="" disabled>
                Select severity
              </option>
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Component */}
          <div>
            <label htmlFor="component" className={labelClasses}>
              Component
            </label>
            <select
              id="component"
              value={componentId}
              onChange={(e) => setComponentId(e.target.value)}
              className={inputClasses}
            >
              <option value="">None</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="assignee" className={labelClasses}>
              Assignee
            </label>
            <select
              id="assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={inputClasses}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Linked Test Run */}
          <div>
            <label htmlFor="testRun" className={labelClasses}>
              Linked Test Run
            </label>
            <select
              id="testRun"
              value={testRunId}
              onChange={(e) => setTestRunId(e.target.value)}
              className={inputClasses}
            >
              <option value="">None</option>
              {testRuns.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.testCase?.title ?? tr.id} &mdash;{" "}
                  {new Date(tr.runDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? "Creating..." : "Create Issue"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-transparent border border-[#2a2a38] text-[#8888a8] hover:text-[#e8e8f0] hover:border-[#555570] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
