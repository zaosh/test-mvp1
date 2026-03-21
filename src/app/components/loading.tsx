export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-36 bg-[var(--surface-elevated)] rounded" />
        <div className="h-4 w-32 bg-[var(--surface)] rounded mt-2" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 h-10 bg-[var(--surface)] border border-[var(--border)] rounded-lg" />
        <div className="h-10 w-36 bg-[var(--surface-elevated)] rounded-lg" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
              <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
            </div>
            <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full mb-3" />
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-12 bg-[var(--surface-elevated)] rounded" />
                <div className="h-3 w-16 bg-[var(--surface-elevated)] rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-8 bg-[var(--surface-elevated)] rounded" />
                <div className="h-3 w-24 bg-[var(--surface-elevated)] rounded" />
              </div>
            </div>
            <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
