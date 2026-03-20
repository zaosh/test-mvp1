"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArchiveDocument } from "@/components/shared/ArchiveDocument";

// ---------------------------------------------------------------------------
// Types (matching the actual API response from GET /api/archives/[id])
// ---------------------------------------------------------------------------

interface Finding {
  findingId: string;
  description: string;
  severity: string;
  disposition: string;
}

interface ArchiveTestCaseEntry {
  id: string;
  archiveId: string;
  testCaseId: string;
  wasCanonical: boolean;
  testCase: {
    id: string;
    title: string;
    testType: string;
    status: string;
    isCanonical: boolean;
    owner: { id: string; name: string } | null;
    component: { id: string; name: string } | null;
    _count: { testRuns: number };
  };
}

interface ArchiveDetail {
  id: string;
  title: string;
  category: string;
  outcome: string;
  summary: string;
  findings: Finding[] | unknown;
  githubRef?: string | null;
  releaseTag?: string | null;
  attachments: string[];
  tags: string[];
  isImmutable: boolean;
  archivedAt: string;
  archivedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  testPlan: {
    id: string;
    title: string;
  } | null;
  testCases: ArchiveTestCaseEntry[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ArchiveDetailPage() {
  const router = useRouter();
  const params = useParams();
  const archiveId = params.id as string;

  const [archive, setArchive] = useState<ArchiveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch archive ----
  useEffect(() => {
    const fetchArchive = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/archives/${archiveId}`);
        if (!res.ok) throw new Error("Failed to fetch archive");
        setArchive(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (archiveId) fetchArchive();
  }, [archiveId]);

  // ---- Print handler ----
  const handlePrint = () => {
    window.print();
  };

  // ---- Render: loading / error ----
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-[#555570]">
        Loading archive...
      </div>
    );
  }

  if (error || !archive) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-red-400">
        {error ?? "Archive not found"}
      </div>
    );
  }

  // ---- Transform data to match ArchiveDocument's expected shape ----
  const findings: Finding[] = Array.isArray(archive.findings)
    ? (archive.findings as Finding[])
    : [];

  const archiveDocData = {
    id: archive.id,
    title: archive.title,
    category: archive.category,
    outcome: archive.outcome,
    summary: archive.summary,
    findings,
    githubRef: archive.githubRef,
    releaseTag: archive.releaseTag,
    attachments: archive.attachments ?? [],
    tags: archive.tags ?? [],
    isImmutable: archive.isImmutable,
    archivedAt: archive.archivedAt,
    archivedBy: { name: archive.archivedBy?.name ?? "Unknown" },
    testPlan: archive.testPlan,
    testCases: archive.testCases.map((entry) => ({
      testCase: {
        id: entry.testCase.id,
        title: entry.testCase.title,
        testType: entry.testCase.testType,
        status: entry.testCase.status,
        isCanonical: entry.testCase.isCanonical,
        owner: entry.testCase.owner ? { name: entry.testCase.owner.name } : undefined,
      },
      wasCanonical: entry.wasCanonical,
    })),
  };

  // ---- Render ----
  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }

          .print-container * {
            color: #000000 !important;
            border-color: #cccccc !important;
            background-color: transparent !important;
          }

          .print-container h1,
          .print-container h2,
          .print-container h3 {
            color: #000000 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print-container">
          {/* Top actions bar */}
          <div className="flex items-center justify-between mb-6 no-print">
            <button
              onClick={() => router.push("/archives")}
              className="text-[#8888a8] hover:text-[#e8e8f0] text-sm inline-flex items-center gap-1 transition-colors"
            >
              &larr; Back to Archives
            </button>

            <button
              onClick={handlePrint}
              className="bg-transparent border border-[#2a2a38] text-[#8888a8] hover:text-[#e8e8f0] hover:border-[#555570] px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Export to PDF
            </button>
          </div>

          {/* Archive document */}
          <ArchiveDocument archive={archiveDocData} />
        </div>
      </div>
    </>
  );
}
