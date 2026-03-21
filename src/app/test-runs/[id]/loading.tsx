export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-28 bg-[var(--surface)] rounded" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-[var(--surface-elevated)] rounded mb-2" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
            <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <div className="h-3 w-20 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-5 w-28 bg-[var(--surface-elevated)] rounded" />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
          <div className="h-4 w-2/3 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>

      {/* Measured Values + Flight Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <div className="h-5 w-32 bg-[var(--surface-elevated)] rounded mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex justify-between py-1">
                  <div className="h-4 w-28 bg-[var(--surface-elevated)] rounded" />
                  <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Issues */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 w-40 bg-[var(--surface-elevated)] rounded" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
