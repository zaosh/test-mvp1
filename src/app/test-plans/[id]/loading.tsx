export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-28 bg-[var(--surface)] rounded mb-6" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-64 bg-[var(--surface-elevated)] rounded mb-2" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
            <div className="h-4 w-32 bg-[var(--surface)] rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-[var(--surface-elevated)] rounded-lg" />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-5 w-28 bg-[var(--surface-elevated)] rounded" />
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-6">
        <div className="h-5 w-24 bg-[var(--surface-elevated)] rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
          <div className="h-4 w-2/3 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>

      {/* Test Cases table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-5 w-24 bg-[var(--surface-elevated)] rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
              <div className="h-4 w-44 bg-[var(--surface-elevated)] rounded" />
              <div className="flex items-center gap-4">
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-4 w-8 bg-[var(--surface-elevated)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
