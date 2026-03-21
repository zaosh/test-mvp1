export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Greeting */}
      <div>
        <div className="h-8 w-64 bg-[var(--surface-elevated)] rounded" />
        <div className="h-4 w-44 bg-[var(--surface)] rounded mt-2" />
      </div>

      {/* Tabbed Test Cases */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-1 mb-4 border-b border-[var(--border)] pb-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-28 bg-[var(--surface-elevated)] rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <div className="h-4 w-48 bg-[var(--surface-elevated)] rounded" />
              <div className="flex items-center gap-4">
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two column: Quick Log + Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Log */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
          <div className="h-6 w-24 bg-[var(--surface-elevated)] rounded mb-4" />
          <div className="space-y-4">
            <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-[var(--surface-elevated)] rounded-lg" />
              <div className="h-10 bg-[var(--surface-elevated)] rounded-lg" />
            </div>
            <div className="h-20 w-full bg-[var(--surface-elevated)] rounded-lg" />
            <div className="h-10 w-28 bg-[var(--surface-elevated)] rounded-lg" />
          </div>
        </div>

        {/* My Open Issues */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
          <div className="h-6 w-32 bg-[var(--surface-elevated)] rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                  <div className="h-4 w-40 bg-[var(--surface-elevated)] rounded" />
                </div>
                <div className="h-3 w-12 bg-[var(--surface-elevated)] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Completed Runs */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="h-6 w-44 bg-[var(--surface-elevated)] rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-4 w-44 bg-[var(--surface-elevated)] rounded" />
              </div>
              <div className="h-3 w-20 bg-[var(--surface-elevated)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
