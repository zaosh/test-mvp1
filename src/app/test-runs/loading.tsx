export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-28 bg-[var(--surface-elevated)] rounded" />
          <div className="h-4 w-24 bg-[var(--surface)] rounded mt-2" />
        </div>
        <div className="h-10 w-32 bg-[var(--surface-elevated)] rounded-lg" />
      </div>

      {/* Filters */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-[var(--surface-elevated)] rounded-lg" />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center border-b border-[var(--border)] px-4 py-3 gap-4">
          <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded flex-[2]" />
          <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
          <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
          <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded flex-1" />
          <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded flex-1" />
          <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
          <div className="h-4 w-12 bg-[var(--surface-elevated)] rounded flex-1" />
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center border-b border-[var(--border)] last:border-0 px-4 py-3 gap-4">
            <div className="h-4 w-36 bg-[var(--surface-elevated)] rounded flex-[2]" />
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
            <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded flex-1" />
            <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full flex-1" />
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded flex-1" />
            <div className="h-4 w-6 bg-[var(--surface-elevated)] rounded flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
