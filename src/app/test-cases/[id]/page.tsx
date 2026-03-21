"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { StatusPill, TypePill } from "@/components/shared/StatusPill";
import { GitHubRefBadge } from "@/components/shared/GitHubRefBadge";
import { ForkTree } from "@/components/shared/ForkTree";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

interface ForkNode {
  id: string;
  title: string;
  status: string;
  forkDepth: number;
  forkReason?: string | null;
  isCanonical: boolean;
  parameters?: Record<string, unknown>;
  owner?: { id?: string; name: string };
  forks?: ForkNode[];
}

interface TestRun {
  id: string;
  runDate: string;
  environment?: string | null;
  status: string;
  notes?: string | null;
  loggedBy?: { id: string; name: string } | null;
}

interface TestCaseDetail {
  id: string;
  title: string;
  objective: string;
  testType: string;
  status: string;
  parameters?: Record<string, unknown> | null;
  passCriteria?: string | null;
  steps?: any;
  forkDepth: number;
  forkReason?: string | null;
  isCanonical: boolean;
  createdAt: string;
  owner?: { id: string; name: string; email?: string } | null;
  component?: { id: string; name: string } | null;
  testPlan?: { id: string; title: string } | null;
  parent?: { id: string; title: string } | null;
  forks: ForkNode[];
  githubRef?: {
    repoUrl: string;
    commitSha?: string | null;
    prNumber?: number | null;
    releaseTag?: string | null;
    branchName?: string | null;
  } | null;
  testRuns: TestRun[];
  archiveEntries?: any[];
}

export default function TestCaseDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;

  const [tc, setTc] = useState<TestCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Fork modal state
  const [showForkModal, setShowForkModal] = useState(false);
  const [forkReason, setForkReason] = useState("");
  const [forkParams, setForkParams] = useState<{ key: string; value: string }[]>([]);
  const [forkTitle, setForkTitle] = useState("");
  const [forking, setForking] = useState(false);

  // Conclude modal state
  const [showConcludeModal, setShowConcludeModal] = useState(false);
  const [concludedNotes, setConcludedNotes] = useState("");
  const [isCanonical, setIsCanonical] = useState(false);
  const [concluding, setConcluding] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const role = (session?.user as any)?.role as string | undefined;
  const canConclude = role === "QA" || role === "ADMIN";
  const canDelete = role === "QA" || role === "ADMIN";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/test-cases/${caseId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setTc(data))
      .catch(() => setTc(null))
      .finally(() => setLoading(false));
  }, [caseId]);

  // Build fork tree
  const forkTreeRoot = useMemo<ForkNode | null>(() => {
    if (!tc) return null;
    const selfNode: ForkNode = {
      id: tc.id,
      title: tc.title,
      status: tc.status,
      forkDepth: tc.forkDepth,
      forkReason: tc.forkReason,
      isCanonical: tc.isCanonical,
      parameters: tc.parameters as Record<string, unknown> | undefined,
      owner: tc.owner ? { name: tc.owner.name } : undefined,
      forks: tc.forks,
    };

    if (tc.parent) {
      // This is a fork — show parent as root with this test as a child
      return {
        id: tc.parent.id,
        title: tc.parent.title,
        status: "",
        forkDepth: tc.forkDepth - 1,
        isCanonical: false,
        forks: [selfNode],
      };
    }

    return selfNode;
  }, [tc]);

  const hasForkTree = forkTreeRoot && (forkTreeRoot.forks?.length || tc?.parent);

  const handleFork = async () => {
    if (!forkReason.trim()) return;
    setForking(true);
    try {
      const body: any = { forkReason: forkReason.trim() };
      if (forkTitle.trim()) body.overrideTitle = forkTitle.trim();
      if (forkParams.length > 0) {
        const overrides: Record<string, string> = {};
        forkParams.forEach((p) => {
          if (p.key.trim()) overrides[p.key.trim()] = p.value;
        });
        if (Object.keys(overrides).length > 0) body.overrideParameters = overrides;
      }

      const res = await fetch(`/api/test-cases/${caseId}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const forked = await res.json();
        router.push(`/test-cases/${forked.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to fork test case.");
      }
    } catch {
      alert("Failed to fork test case.");
    } finally {
      setForking(false);
    }
  };

  const handleConclude = async () => {
    if (!concludedNotes.trim()) return;
    setConcluding(true);
    try {
      const res = await fetch(`/api/test-cases/${caseId}/conclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concludedNotes: concludedNotes.trim(),
          isCanonical,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTc((prev) => (prev ? { ...prev, status: updated.status ?? "CONCLUDED", isCanonical: updated.isCanonical ?? isCanonical } : prev));
        setShowConcludeModal(false);
        setConcludedNotes("");
        setIsCanonical(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to conclude test case.");
      }
    } catch {
      alert("Failed to conclude test case.");
    } finally {
      setConcluding(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/test-cases/${caseId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/test-cases");
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Failed to delete test case.");
      }
    } catch {
      alert("Failed to delete test case.");
    } finally {
      setDeleting(false);
    }
  };

  const addParamRow = () => setForkParams([...forkParams, { key: "", value: "" }]);
  const removeParamRow = (idx: number) => setForkParams(forkParams.filter((_, i) => i !== idx));
  const updateParamRow = (idx: number, field: "key" | "value", val: string) => {
    const updated = [...forkParams];
    updated[idx][field] = val;
    setForkParams(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
        <div className="text-[#8888a8]">Loading...</div>
      </div>
    );
  }

  if (!tc) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
        <div className="text-[#555570]">Test case not found.</div>
      </div>
    );
  }

  const stepsArray = Array.isArray(tc.steps) ? tc.steps : [];
  const parametersEntries = tc.parameters ? Object.entries(tc.parameters) : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/test-cases")}
          className="text-sm text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
        >
          &larr; Back to Test Cases
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{tc.title}</h1>
            <TypePill type={tc.testType} size="md" />
            <StatusPill status={tc.status} size="md" />
            {tc.isCanonical && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#8b5cf6]/15 text-[#8b5cf6]">
                CANONICAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-[#8888a8]">
            {tc.owner && <span>Owner: {tc.owner.name}</span>}
            {tc.component && <span>Component: {tc.component.name}</span>}
            {tc.testPlan && (
              <button
                onClick={() => router.push(`/test-plans/${tc.testPlan!.id}`)}
                className="hover:text-[#e8e8f0] transition-colors"
              >
                Plan: {tc.testPlan.title}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setForkReason("");
              setForkTitle("");
              setForkParams([]);
              setShowForkModal(true);
            }}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Fork this test
          </button>
          {canConclude && tc.status !== "CONCLUDED" && (
            <button
              onClick={() => {
                setConcludedNotes("");
                setIsCanonical(false);
                setShowConcludeModal(true);
              }}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Conclude this test
            </button>
          )}
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

      {/* Objective */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 mb-6">
        <h2 className="text-sm text-[#555570] uppercase tracking-wider mb-2">Objective</h2>
        <p className="text-[#e8e8f0]">{tc.objective}</p>
      </div>

      {/* Parameters */}
      {parametersEntries.length > 0 && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 mb-6">
          <h2 className="text-sm text-[#555570] uppercase tracking-wider mb-3">Parameters</h2>
          <div className="grid grid-cols-2 gap-2">
            {parametersEntries.map(([key, value]) => (
              <div key={key} className="contents">
                <div className="text-sm text-[#8888a8] py-1.5 px-3 bg-[#1a1a24] rounded-l">{key}</div>
                <div className="text-sm font-mono-value text-[#e8e8f0] py-1.5 px-3 bg-[#1a1a24] rounded-r">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {stepsArray.length > 0 && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 mb-6">
          <h2 className="text-sm text-[#555570] uppercase tracking-wider mb-3">Steps</h2>
          <ol className="list-decimal list-inside space-y-2">
            {stepsArray.map((step: any, idx: number) => (
              <li key={idx} className="text-sm text-[#e8e8f0]">
                {typeof step === "string" ? step : step.description || step.step || JSON.stringify(step)}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Pass Criteria */}
      {tc.passCriteria && (
        <div className="bg-[#111118] border border-[#22c55e]/20 rounded-lg p-6 mb-6">
          <h2 className="text-sm text-[#22c55e] uppercase tracking-wider mb-2">Pass Criteria</h2>
          <p className="text-[#e8e8f0]">{tc.passCriteria}</p>
        </div>
      )}

      {/* GitHub Ref */}
      {tc.githubRef && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 mb-6">
          <h2 className="text-sm text-[#555570] uppercase tracking-wider mb-2">GitHub Reference</h2>
          <GitHubRefBadge githubRef={tc.githubRef} />
        </div>
      )}

      {/* Fork Tree Preview */}
      {hasForkTree && forkTreeRoot && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm text-[#555570] uppercase tracking-wider">Fork Tree</h2>
            <button
              onClick={() => router.push(`/test-cases/${caseId}/forks`)}
              className="text-xs text-[#3b82f6] hover:text-[#2563eb] transition-colors"
            >
              View full tree &rarr;
            </button>
          </div>
          <ForkTree root={forkTreeRoot} compact />
        </div>
      )}

      {/* Run History */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 mb-6">
        <h2 className="text-sm text-[#555570] uppercase tracking-wider mb-3">
          Run History (Last 5)
        </h2>
        {tc.testRuns.length === 0 ? (
          <p className="text-sm text-[#555570]">No runs recorded.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a38] text-left text-[#8888a8]">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Environment</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Logged By</th>
                <th className="px-4 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {tc.testRuns.map((run) => (
                <tr key={run.id} className="border-b border-[#2a2a38] last:border-0">
                  <td className="px-4 py-2 text-[#8888a8]">
                    {new Date(run.runDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 font-mono-value text-[#8888a8]">
                    {run.environment || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <StatusPill status={run.status} />
                  </td>
                  <td className="px-4 py-2 text-[#8888a8]">
                    {run.loggedBy?.name || "—"}
                  </td>
                  <td className="px-4 py-2 text-[#8888a8] max-w-xs truncate">
                    {run.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Fork Modal */}
      {showForkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Fork Test Case</h3>

            <div className="mb-4">
              <label className="block text-sm text-[#8888a8] mb-1">Fork Reason *</label>
              <textarea
                value={forkReason}
                onChange={(e) => setForkReason(e.target.value)}
                rows={3}
                className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6] resize-none"
                placeholder="Why are you forking this test?"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#8888a8] mb-1">Override Title (optional)</label>
              <input
                type="text"
                value={forkTitle}
                onChange={(e) => setForkTitle(e.target.value)}
                className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
                placeholder="Leave empty to auto-generate"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-[#8888a8]">Parameter Overrides</label>
                <button
                  onClick={addParamRow}
                  className="text-xs text-[#3b82f6] hover:text-[#2563eb] transition-colors"
                >
                  + Add parameter
                </button>
              </div>
              {forkParams.length === 0 ? (
                <p className="text-xs text-[#555570]">No parameter overrides. Click &quot;Add parameter&quot; to add.</p>
              ) : (
                <div className="space-y-2">
                  {forkParams.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={p.key}
                        onChange={(e) => updateParamRow(idx, "key", e.target.value)}
                        placeholder="Key"
                        className="flex-1 bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3b82f6]"
                      />
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => updateParamRow(idx, "value", e.target.value)}
                        placeholder="Value"
                        className="flex-1 bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3b82f6] font-mono-value"
                      />
                      <button
                        onClick={() => removeParamRow(idx)}
                        className="text-[#555570] hover:text-[#ef4444] transition-colors px-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowForkModal(false)}
                className="text-sm text-[#8888a8] hover:text-[#e8e8f0] transition-colors px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleFork}
                disabled={!forkReason.trim() || forking}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {forking ? "Forking..." : "Create Fork"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        title="Delete Test Case"
        description="This test case will be soft-deleted and hidden from all lists. This action can be reversed by an administrator."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleting}
      />

      {/* Conclude Modal */}
      {showConcludeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Conclude Test Case</h3>

            <div className="mb-4">
              <label className="block text-sm text-[#8888a8] mb-1">Concluded Notes *</label>
              <textarea
                value={concludedNotes}
                onChange={(e) => setConcludedNotes(e.target.value)}
                rows={4}
                className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6] resize-none"
                placeholder="Summary of conclusions..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-[#8888a8] mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={isCanonical}
                onChange={(e) => setIsCanonical(e.target.checked)}
                className="rounded border-[#2a2a38] bg-[#1a1a24] text-[#8b5cf6] focus:ring-[#8b5cf6]"
              />
              Mark as canonical version
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConcludeModal(false)}
                className="text-sm text-[#8888a8] hover:text-[#e8e8f0] transition-colors px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConclude}
                disabled={!concludedNotes.trim() || concluding}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {concluding ? "Concluding..." : "Conclude"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
