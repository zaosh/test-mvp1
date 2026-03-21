export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] p-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 bg-[var(--surface)] rounded mb-6" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-48 bg-[var(--surface-elevated)] rounded mb-2" />
          <div className="h-4 w-64 bg-[var(--surface)] rounded" />
        </div>
        <div className="h-9 w-32 bg-[var(--surface-elevated)] rounded-lg" />
      </div>

      {/* Fork tree skeleton */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="space-y-4">
          {/* Root node */}
          <div className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg">
            <div className="h-5 w-5 bg-[var(--surface-elevated)] rounded" />
            <div className="h-4 w-48 bg-[var(--surface-elevated)] rounded" />
            <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full ml-auto" />
          </div>
          {/* Child nodes */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ml-8 flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg">
              <div className="h-5 w-5 bg-[var(--surface-elevated)] rounded" />
              <div className="h-4 w-40 bg-[var(--surface-elevated)] rounded" />
              <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
