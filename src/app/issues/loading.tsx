export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-[var(--surface-elevated)] rounded" />
            <div className="h-6 w-16 bg-[var(--surface-elevated)] rounded-full" />
          </div>
          <div className="h-10 w-32 bg-[var(--surface-elevated)] rounded-lg" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-36 bg-[var(--surface-elevated)] rounded-lg" />
          ))}
        </div>

        {/* Table */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center border-b border-[var(--border)] px-4 py-3 gap-4">
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-[2]" />
            <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded flex-1" />
            <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded flex-1" />
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
            <div className="h-4 w-10 bg-[var(--surface-elevated)] rounded flex-1" />
            <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded flex-1" />
          </div>
          {/* Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center border-b border-[var(--border)] last:border-0 px-4 py-3 gap-4">
              <div className="h-4 w-40 bg-[var(--surface-elevated)] rounded flex-[2]" />
              <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full flex-1" />
              <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full flex-1" />
              <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
              <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
              <div className="h-4 w-8 bg-[var(--surface-elevated)] rounded flex-1" />
              <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
