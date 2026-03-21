export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-40 bg-[var(--surface-elevated)] rounded" />
        <div className="h-4 w-56 bg-[var(--surface)] rounded mt-2" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <div className="h-9 w-16 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-4 w-28 bg-[var(--surface-elevated)] rounded" />
          </div>
        ))}
      </div>

      {/* Active Test Plans */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-6 w-36 bg-[var(--surface-elevated)] rounded mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 bg-[var(--surface-elevated)] rounded" />
                <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
              </div>
              <div className="h-2 w-full bg-[var(--surface-elevated)] rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Failure Rate Chart */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-6 w-56 bg-[var(--surface-elevated)] rounded mb-4" />
        <div className="h-[280px] bg-[var(--surface-elevated)] rounded" />
      </div>

      {/* Two column: Issues + Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <div className="h-6 w-32 bg-[var(--surface-elevated)] rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between py-2">
                  <div className="h-4 w-40 bg-[var(--surface-elevated)] rounded" />
                  <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-6 w-36 bg-[var(--surface-elevated)] rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)]" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-[var(--surface-elevated)] rounded mb-1" />
                <div className="h-3 w-24 bg-[var(--surface-elevated)] rounded" />
              </div>
              <div className="h-3 w-16 bg-[var(--surface-elevated)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
