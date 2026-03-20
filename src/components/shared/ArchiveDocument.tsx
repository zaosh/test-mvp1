"use client";

import { StatusPill } from "./StatusPill";

interface Finding {
  findingId: string;
  description: string;
  severity: string;
  disposition: string;
}

interface ArchiveTestCaseEntry {
  testCase: {
    id: string;
    title: string;
    testType: string;
    status: string;
    isCanonical: boolean;
    owner?: { name: string };
  };
  wasCanonical: boolean;
}

interface ArchiveData {
  id: string;
  title: string;
  category: string;
  outcome: string;
  summary: string;
  findings: Finding[];
  githubRef?: string | null;
  releaseTag?: string | null;
  attachments: string[];
  tags: string[];
  isImmutable: boolean;
  archivedAt: string;
  archivedBy: { name: string };
  testPlan?: { id: string; title: string } | null;
  testCases: ArchiveTestCaseEntry[];
}

interface ArchiveDocumentProps {
  archive: ArchiveData;
}

export function ArchiveDocument({ archive }: ArchiveDocumentProps) {
  const passedCount = archive.testCases.filter(
    (tc) => tc.testCase.status === "PASSED" || tc.testCase.status === "CONCLUDED"
  ).length;
  const failedCount = archive.testCases.filter(
    (tc) => tc.testCase.status === "FAILED"
  ).length;
  const totalCount = archive.testCases.length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  const canonicalForks = archive.testCases.filter((tc) => tc.wasCanonical);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#2a2a38] pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{archive.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusPill status={archive.outcome} size="md" />
              <span className="text-sm text-[#8888a8]">
                {new Date(archive.archivedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-sm text-[#555570]">
                by {archive.archivedBy.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <section className="card">
        <h2 className="text-sm font-semibold text-[#8888a8] uppercase tracking-wider mb-3">
          Metadata
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#555570]">Category</span>
            <p className="mt-0.5">{archive.category.replace(/_/g, " ")}</p>
          </div>
          {archive.releaseTag && (
            <div>
              <span className="text-[#555570]">Release Tag</span>
              <p className="mt-0.5 font-mono-value">{archive.releaseTag}</p>
            </div>
          )}
          {archive.testPlan && (
            <div>
              <span className="text-[#555570]">Test Plan</span>
              <p className="mt-0.5">{archive.testPlan.title}</p>
            </div>
          )}
          {archive.githubRef && (
            <div>
              <span className="text-[#555570]">GitHub Ref</span>
              <p className="mt-0.5 font-mono-value">{archive.githubRef}</p>
            </div>
          )}
        </div>
      </section>

      {/* Summary */}
      <section>
        <h2 className="text-sm font-semibold text-[#8888a8] uppercase tracking-wider mb-3">
          Summary
        </h2>
        <p className="text-sm leading-relaxed text-[#e8e8f0]">{archive.summary}</p>
      </section>

      {/* Test Results Summary */}
      <section className="card">
        <h2 className="text-sm font-semibold text-[#8888a8] uppercase tracking-wider mb-3">
          Test Results Summary
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-semibold">{totalCount}</p>
            <p className="text-xs text-[#555570] mt-1">Total Cases</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-[#22c55e]">{passedCount}</p>
            <p className="text-xs text-[#555570] mt-1">Passed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-[#ef4444]">{failedCount}</p>
            <p className="text-xs text-[#555570] mt-1">Failed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold">{passRate}%</p>
            <p className="text-xs text-[#555570] mt-1">Pass Rate</p>
          </div>
        </div>
      </section>

      {/* Fork History */}
      {canonicalForks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#8888a8] uppercase tracking-wider mb-3">
            Fork History
          </h2>
          <div className="space-y-2">
            {canonicalForks.map((entry) => (
              <div key={entry.testCase.id} className="flex items-center gap-3 text-sm">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#8b5cf6]/15 text-[#8b5cf6]">
                  CANONICAL
                </span>
                <span>{entry.testCase.title}</span>
                <StatusPill status={entry.testCase.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Key Findings */}
      <section>
        <h2 className="text-sm font-semibold text-[#8888a8] uppercase tracking-wider mb-3">
          Key Findings
        </h2>
        <div className="space-y-3">
          {(archive.findings as Finding[]).map((finding) => (
            <div key={finding.findingId} className="card-elevated">
              <div className="flex items-start gap-3">
                <span className="font-mono-value text-[#555570] flex-shrink-0">
                  {finding.findingId}
                </span>
                <div className="flex-1">
                  <p className="text-sm">{finding.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <StatusPill status={finding.severity} />
                    <span className="text-xs text-[#555570]">{finding.disposition}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Attachments */}
      {archive.attachments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#8888a8] uppercase tracking-wider mb-3">
            Attachments
          </h2>
          <ul className="space-y-1">
            {archive.attachments.map((att, i) => (
              <li key={i} className="text-sm font-mono-value text-[#8888a8]">
                {att}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tags */}
      {archive.tags.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#8888a8] uppercase tracking-wider mb-3">
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {archive.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded border border-[#2a2a38] text-[#8888a8]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="border-t border-[#2a2a38] pt-4 mt-8">
        <p className="text-xs text-[#555570] text-center">
          This archive is immutable. Concluded by {archive.archivedBy.name} on{" "}
          {new Date(archive.archivedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          .
        </p>
      </div>
    </div>
  );
}
