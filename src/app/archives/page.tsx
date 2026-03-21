"use client";

import { useState, useEffect, useCallback, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState, EMPTY_ICONS } from "@/components/shared/EmptyState";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ArchiveCategory =
  | "RELEASE_CERTIFICATION"
  | "REGRESSION_SUITE"
  | "COMPLIANCE_AUDIT"
  | "FIELD_INVESTIGATION"
  | "MAINTENANCE_CYCLE"
  | "EXPERIMENTAL";

type ArchiveOutcome =
  | "PASSED"
  | "FAILED"
  | "CONDITIONAL_PASS"
  | "INCONCLUSIVE";

interface Archive {
  id: string;
  title: string;
  summary: string;
  category: ArchiveCategory;
  outcome: ArchiveOutcome;
  archivedAt: string;
  releaseTag?: string;
  tags: string[];
  createdAt: string;
  archivedBy: { id: string; name: string } | null;
  testPlan: { id: string; title: string } | null;
  _count?: { testCases: number };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: ArchiveCategory[] = [
  "RELEASE_CERTIFICATION",
  "REGRESSION_SUITE",
  "COMPLIANCE_AUDIT",
  "FIELD_INVESTIGATION",
  "MAINTENANCE_CYCLE",
  "EXPERIMENTAL",
];

const OUTCOME_OPTIONS: ArchiveOutcome[] = [
  "PASSED",
  "FAILED",
  "CONDITIONAL_PASS",
  "INCONCLUSIVE",
];

const CATEGORY_COLORS: Record<ArchiveCategory, { bg: string; text: string }> = {
  RELEASE_CERTIFICATION: { bg: "bg-blue-500/15", text: "text-blue-400" },
  REGRESSION_SUITE: { bg: "bg-purple-500/15", text: "text-purple-400" },
  COMPLIANCE_AUDIT: { bg: "bg-amber-500/15", text: "text-amber-400" },
  FIELD_INVESTIGATION: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  MAINTENANCE_CYCLE: { bg: "bg-green-500/15", text: "text-green-400" },
  EXPERIMENTAL: { bg: "bg-pink-500/15", text: "text-pink-400" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const formatCategory = (cat: string): string =>
  cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ArchivesPage() {
  const router = useRouter();

  // Data
  const [archives, setArchives] = useState<Archive[]>([]);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch archives ----
  const fetchArchives = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (categoryFilter) params.set("category", categoryFilter);
    if (outcomeFilter) params.set("outcome", outcomeFilter);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (tagFilter.trim()) params.set("tag", tagFilter.trim());

    try {
      const res = await fetch(`/api/archives?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch archives");
      setArchives(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, outcomeFilter, searchQuery, tagFilter]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  // ---- Handle tag input ----
  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setTagFilter(tagInput.trim());
    }
  };

  // ---- Styles ----
  const selectClasses =
    "bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6] transition-colors";

  // ---- Render ----
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1 className="text-2xl font-bold tracking-tight mb-8">Archives</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={selectClasses}
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {formatCategory(c)}
              </option>
            ))}
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className={selectClasses}
          >
            <option value="">All Outcomes</option>
            {OUTCOME_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archives..."
            className={`${selectClasses} min-w-[200px] placeholder:text-[#555570]`}
          />

          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => setTagFilter(tagInput.trim())}
            placeholder="Filter by tag (Enter)"
            className={`${selectClasses} min-w-[170px] placeholder:text-[#555570]`}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#555570]">
            Loading archives...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-400">
            {error}
          </div>
        ) : archives.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <EmptyState
              icon={EMPTY_ICONS.archive}
              title="No archives found"
              description="Archives are created when test plans are concluded. No archives match your current filters."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {archives.map((archive) => {
              const catColor = CATEGORY_COLORS[archive.category];

              return (
                <button
                  key={archive.id}
                  onClick={() => router.push(`/archives/${archive.id}`)}
                  className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 text-left hover:border-[#555570] transition-colors group"
                >
                  {/* Title */}
                  <h2 className="font-semibold text-[#e8e8f0] mb-3 group-hover:text-white transition-colors">
                    {archive.title}
                  </h2>

                  {/* Pills row */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {/* Category pill */}
                    <span
                      className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 ${catColor.bg} ${catColor.text}`}
                    >
                      {formatCategory(archive.category)}
                    </span>

                    {/* Outcome */}
                    <StatusPill status={archive.outcome} />
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8888a8] mb-3">
                    <span>{formatDate(archive.archivedAt)}</span>
                    {archive.releaseTag && (
                      <span className="font-mono bg-[#1a1a24] px-1.5 py-0.5 rounded text-[#8888a8]">
                        {archive.releaseTag}
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-[#8888a8] leading-relaxed mb-3">
                    {truncate(archive.summary, 150)}
                  </p>

                  {/* Tags */}
                  {archive.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {archive.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center bg-[#1a1a24] border border-[#2a2a38] text-[#8888a8] text-xs rounded px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
