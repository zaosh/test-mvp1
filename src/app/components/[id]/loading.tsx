export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 bg-[var(--surface)] rounded" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--surface-elevated)] rounded mb-2" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
            <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <div className="h-7 w-12 bg-[var(--surface-elevated)] rounded mb-1" />
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-[var(--surface-elevated)] rounded mb-1" />
              <div className="h-4 w-28 bg-[var(--surface-elevated)] rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Test Runs */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-5 w-32 bg-[var(--surface-elevated)] rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
              <div className="h-4 w-36 bg-[var(--surface-elevated)] rounded" />
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
