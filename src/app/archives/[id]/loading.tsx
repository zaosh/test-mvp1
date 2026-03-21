export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Back link */}
        <div className="h-4 w-28 bg-[var(--surface)] rounded mb-6" />

        {/* Document header */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8 mb-6">
          <div className="h-8 w-72 bg-[var(--surface-elevated)] rounded mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-5 w-28 bg-[var(--surface-elevated)] rounded-full" />
            <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-3 w-24 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-20 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-28 bg-[var(--surface-elevated)] rounded" />
          </div>
          {/* Summary */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-4 w-2/3 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>

        {/* Findings */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-6">
          <div className="h-6 w-20 bg-[var(--surface-elevated)] rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-[var(--border)] rounded-lg p-4">
                <div className="h-4 w-48 bg-[var(--surface-elevated)] rounded mb-2" />
                <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Test Cases */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
          <div className="h-6 w-24 bg-[var(--surface-elevated)] rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="h-4 w-44 bg-[var(--surface-elevated)] rounded" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                  <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
