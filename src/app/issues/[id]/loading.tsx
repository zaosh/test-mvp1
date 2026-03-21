export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Back link */}
        <div className="h-4 w-24 bg-[var(--surface)] rounded mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-64 bg-[var(--surface-elevated)] rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
            <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
              <div className="h-3 w-16 bg-[var(--surface-elevated)] rounded mb-2" />
              <div className="h-5 w-24 bg-[var(--surface-elevated)] rounded" />
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-6">
          <div className="h-5 w-24 bg-[var(--surface-elevated)] rounded mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-4 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-4 w-2/3 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>

        {/* Update form area */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
          <div className="h-5 w-28 bg-[var(--surface-elevated)] rounded mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-10 bg-[var(--surface-elevated)] rounded-lg" />
            <div className="h-10 bg-[var(--surface-elevated)] rounded-lg" />
          </div>
          <div className="h-24 w-full bg-[var(--surface-elevated)] rounded-lg mb-4" />
          <div className="h-10 w-28 bg-[var(--surface-elevated)] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
