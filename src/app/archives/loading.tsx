export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Header */}
        <div className="h-8 w-24 bg-[var(--surface-elevated)] rounded mb-8" />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-40 bg-[var(--surface-elevated)] rounded-lg" />
          ))}
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
              {/* Title */}
              <div className="h-5 w-48 bg-[var(--surface-elevated)] rounded mb-3" />
              {/* Pills */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-28 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
              </div>
              {/* Meta */}
              <div className="flex items-center gap-4 mb-3">
                <div className="h-3 w-20 bg-[var(--surface-elevated)] rounded" />
                <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded" />
              </div>
              {/* Summary */}
              <div className="space-y-1.5 mb-3">
                <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
                <div className="h-4 w-3/4 bg-[var(--surface-elevated)] rounded" />
              </div>
              {/* Tags */}
              <div className="flex gap-1.5">
                <div className="h-5 w-14 bg-[var(--surface-elevated)] rounded" />
                <div className="h-5 w-18 bg-[var(--surface-elevated)] rounded" />
                <div className="h-5 w-12 bg-[var(--surface-elevated)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
