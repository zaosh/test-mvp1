export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Header */}
        <div className="h-8 w-32 bg-[var(--surface-elevated)] rounded mb-8" />

        {/* Form */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 space-y-5">
          {/* Title */}
          <div>
            <div className="h-4 w-12 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
          </div>

          {/* Description */}
          <div>
            <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-32 w-full bg-[var(--surface-elevated)] rounded-lg" />
          </div>

          {/* Severity */}
          <div>
            <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
          </div>

          {/* Component + Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded mb-2" />
              <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
            </div>
            <div>
              <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded mb-2" />
              <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
            </div>
          </div>

          {/* Test Run */}
          <div>
            <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
          </div>

          {/* Submit */}
          <div className="h-10 w-32 bg-[var(--surface-elevated)] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
