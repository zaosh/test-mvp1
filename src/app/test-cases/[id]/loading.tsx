export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8 animate-pulse">
      {/* Back link + Header */}
      <div className="mb-6">
        <div className="h-4 w-24 bg-[var(--surface)] rounded mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-72 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="flex items-center gap-3">
              <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
              <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-[var(--surface-elevated)] rounded-lg" />
            <div className="h-9 w-24 bg-[var(--surface-elevated)] rounded-lg" />
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded mb-3" />
            <div className="h-5 w-32 bg-[var(--surface-elevated)] rounded" />
          </div>
        ))}
      </div>

      {/* Objective */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-6">
        <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
          <div className="h-4 w-3/4 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>

      {/* Parameters + Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <div className="h-5 w-24 bg-[var(--surface-elevated)] rounded mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between py-1">
                  <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded" />
                  <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Test Runs table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-5 w-24 bg-[var(--surface-elevated)] rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
              <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
              <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
              <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
