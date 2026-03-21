export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl animate-pulse">
      {/* Header */}
      <div className="h-8 w-36 bg-[var(--surface-elevated)] rounded" />

      {/* Form skeleton */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 space-y-5">
        {/* Test Case select */}
        <div>
          <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded mb-2" />
          <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
        </div>

        {/* Component select */}
        <div>
          <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded mb-2" />
          <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
        </div>

        {/* Environment + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
          </div>
          <div>
            <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded mb-2" />
          <div className="h-10 w-full bg-[var(--surface-elevated)] rounded-lg" />
        </div>

        {/* Notes */}
        <div>
          <div className="h-4 w-12 bg-[var(--surface-elevated)] rounded mb-2" />
          <div className="h-24 w-full bg-[var(--surface-elevated)] rounded-lg" />
        </div>

        {/* Submit */}
        <div className="h-10 w-32 bg-[var(--surface-elevated)] rounded-lg" />
      </div>
    </div>
  );
}
