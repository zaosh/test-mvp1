"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { StatusPill } from "@/components/shared/StatusPill";
import { ForkTree } from "@/components/shared/ForkTree";

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

interface TestCaseData {
  id: string;
  title: string;
  status: string;
  forkDepth: number;
  forkReason?: string | null;
  isCanonical: boolean;
  parameters?: Record<string, unknown> | null;
  owner?: { id: string; name: string } | null;
  parent?: { id: string; title: string } | null;
  forks: ForkNode[];
}

export default function ForkTreePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;

  const [tc, setTc] = useState<TestCaseData | null>(null);
  const [parentData, setParentData] = useState<TestCaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [markingCanonical, setMarkingCanonical] = useState(false);

  const role = (session?.user as any)?.role as string | undefined;
  const canManage = role === "QA" || role === "ADMIN";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/test-cases/${caseId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(async (data: TestCaseData) => {
        setTc(data);
        // If this test case has a parent, fetch the parent to get full sibling tree
        if (data.parent) {
          try {
            const parentRes = await fetch(`/api/test-cases/${data.parent.id}`);
            if (parentRes.ok) {
              const pd = await parentRes.json();
              setParentData(pd);
            }
          } catch {
            // ignore - we'll just show what we have
          }
        }
      })
      .catch(() => setTc(null))
      .finally(() => setLoading(false));
  }, [caseId]);

  // Build the full tree
  const treeRoot = useMemo<ForkNode | null>(() => {
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

    if (parentData) {
      // Use parent as root, with all its forks (siblings)
      return {
        id: parentData.id,
        title: parentData.title,
        status: parentData.status,
        forkDepth: parentData.forkDepth,
        forkReason: parentData.forkReason,
        isCanonical: parentData.isCanonical,
        parameters: parentData.parameters as Record<string, unknown> | undefined,
        owner: parentData.owner ? { name: parentData.owner.name } : undefined,
        forks: parentData.forks,
      };
    }

    if (tc.parent) {
      // Parent fetch failed or not loaded yet — show parent stub
      return {
        id: tc.parent.id,
        title: tc.parent.title,
        status: "",
        forkDepth: tc.forkDepth - 1,
        isCanonical: false,
        forks: [selfNode],
      };
    }

    // This test is the root
    return selfNode;
  }, [tc, parentData]);

  // Collect all nodes for comparison
  const allNodes = useMemo<ForkNode[]>(() => {
    if (!treeRoot) return [];
    const nodes: ForkNode[] = [];
    const walk = (node: ForkNode) => {
      nodes.push(node);
      node.forks?.forEach(walk);
    };
    walk(treeRoot);
    return nodes;
  }, [treeRoot]);

  const selectedNodes = useMemo(
    () => allNodes.filter((n) => selectedIds.includes(n.id)),
    [allNodes, selectedIds]
  );

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // keep last selection + new
      return [...prev, id];
    });
  };

  const handleMarkCanonical = async (nodeId: string) => {
    if (!confirm("Mark this test case as canonical?")) return;
    setMarkingCanonical(true);
    try {
      const res = await fetch(`/api/test-cases/${nodeId}/conclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concludedNotes: "Marked as canonical from fork tree view.",
          isCanonical: true,
        }),
      });
      if (res.ok) {
        // Reload the page data
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to mark as canonical.");
      }
    } catch {
      alert("Failed to mark as canonical.");
    } finally {
      setMarkingCanonical(false);
    }
  };

  // Compute parameter diff between two nodes
  const paramDiff = useMemo(() => {
    if (selectedNodes.length !== 2) return null;
    const [a, b] = selectedNodes;
    const paramsA = a.parameters || {};
    const paramsB = b.parameters || {};
    const allKeys = new Set([...Object.keys(paramsA), ...Object.keys(paramsB)]);
    const diff: { key: string; valueA: string; valueB: string; changed: boolean }[] = [];
    allKeys.forEach((key) => {
      const vA = key in paramsA ? String(paramsA[key]) : "—";
      const vB = key in paramsB ? String(paramsB[key]) : "—";
      diff.push({ key, valueA: vA, valueB: vB, changed: vA !== vB });
    });
    return diff;
  }, [selectedNodes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
        <div className="text-[#8888a8]">Loading...</div>
      </div>
    );
  }

  if (!tc || !treeRoot) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
        <div className="text-[#555570]">Test case not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-[#8888a8]">
        <button
          onClick={() => router.push(`/test-cases/${caseId}`)}
          className="hover:text-[#e8e8f0] transition-colors"
        >
          &larr; Back to Test Case
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Fork Tree</h1>
        <p className="text-sm text-[#8888a8]">
          Select two nodes to compare parameters side by side.
        </p>
      </div>

      {/* Fork Tree */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 mb-6">
        <ForkTree
          root={treeRoot}
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
      </div>

      {/* Mark as Canonical */}
      {canManage && selectedIds.length === 1 && (
        <div className="mb-6">
          <button
            onClick={() => handleMarkCanonical(selectedIds[0])}
            disabled={markingCanonical}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {markingCanonical ? "Marking..." : "Mark as Canonical"}
          </button>
        </div>
      )}

      {/* Side-by-side comparison */}
      {selectedNodes.length === 2 && paramDiff && (
        <div className="mb-6">
          <h2 className="text-sm text-[#555570] uppercase tracking-wider mb-3">
            Parameter Comparison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Node A card */}
            <div className="bg-[#111118] border border-[#3b82f6] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">{selectedNodes[0].title}</span>
                <StatusPill status={selectedNodes[0].status} />
                {selectedNodes[0].isCanonical && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#8b5cf6]/15 text-[#8b5cf6]">
                    CANONICAL
                  </span>
                )}
              </div>
              {selectedNodes[0].forkReason && (
                <p className="text-xs text-[#8888a8] mb-3">Reason: {selectedNodes[0].forkReason}</p>
              )}
              <div className="space-y-1">
                {paramDiff.map((d) => (
                  <div
                    key={d.key}
                    className={`flex justify-between text-sm px-2 py-1 rounded ${
                      d.changed ? "bg-[#3b82f6]/10" : ""
                    }`}
                  >
                    <span className="text-[#8888a8]">{d.key}</span>
                    <span className={`font-mono-value ${d.changed ? "text-[#3b82f6]" : "text-[#e8e8f0]"}`}>
                      {d.valueA}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Node B card */}
            <div className="bg-[#111118] border border-[#3b82f6] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">{selectedNodes[1].title}</span>
                <StatusPill status={selectedNodes[1].status} />
                {selectedNodes[1].isCanonical && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#8b5cf6]/15 text-[#8b5cf6]">
                    CANONICAL
                  </span>
                )}
              </div>
              {selectedNodes[1].forkReason && (
                <p className="text-xs text-[#8888a8] mb-3">Reason: {selectedNodes[1].forkReason}</p>
              )}
              <div className="space-y-1">
                {paramDiff.map((d) => (
                  <div
                    key={d.key}
                    className={`flex justify-between text-sm px-2 py-1 rounded ${
                      d.changed ? "bg-[#3b82f6]/10" : ""
                    }`}
                  >
                    <span className="text-[#8888a8]">{d.key}</span>
                    <span className={`font-mono-value ${d.changed ? "text-[#3b82f6]" : "text-[#e8e8f0]"}`}>
                      {d.valueB}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
