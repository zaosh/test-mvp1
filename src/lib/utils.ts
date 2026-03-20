import { format, formatDistanceToNow } from "date-fns";

/**
 * Joins class names, filtering out falsy values.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Format a date as "Mar 20, 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

/**
 * Format a date as "Mar 20, 2026 at 2:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format a relative time string, e.g. "2 days ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Truncate a string to the given length, appending "..." if truncated.
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Get initials from a name (first letter of each word).
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/**
 * Returns a hex color for the given TestStatus.
 */
export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    PASSED: "#22c55e",
    FAILED: "#ef4444",
    IN_PROGRESS: "#3b82f6",
    BLOCKED: "#f97316",
    CONCLUDED: "#8b5cf6",
    PLANNED: "#6b7280",
    DRAFT: "#374151",
    WAIVED: "#6b7280",
  };
  return colors[status] ?? "#6b7280";
}

/**
 * Returns a hex color for the given IssueSeverity.
 */
export function severityColor(severity: string): string {
  const colors: Record<string, string> = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#f59e0b",
    LOW: "#6b7280",
  };
  return colors[severity] ?? "#6b7280";
}

/**
 * Returns an accent hex color for the given test type.
 */
export function testTypeColor(testType: string): string {
  const colors: Record<string, string> = {
    FLIGHT: "#38bdf8",
    COMPLIANCE: "#f59e0b",
    FUNCTIONAL: "#a78bfa",
    REGRESSION: "#a78bfa",
    HARDWARE: "#94a3b8",
    MAINTENANCE: "#34d399",
    EXPERIMENTAL: "#fb923c",
  };
  return colors[testType] ?? "#6b7280";
}
