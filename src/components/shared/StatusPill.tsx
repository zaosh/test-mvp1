"use client";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PASSED: { color: "#22c55e", label: "Passed" },
  FAILED: { color: "#ef4444", label: "Failed" },
  IN_PROGRESS: { color: "#3b82f6", label: "In Progress" },
  BLOCKED: { color: "#f97316", label: "Blocked" },
  CONCLUDED: { color: "#8b5cf6", label: "Concluded" },
  PLANNED: { color: "#6b7280", label: "Planned" },
  DRAFT: { color: "#374151", label: "Draft" },
  WAIVED: { color: "#6b7280", label: "Waived" },
  OPEN: { color: "#ef4444", label: "Open" },
  RESOLVED: { color: "#22c55e", label: "Resolved" },
  WONT_FIX: { color: "#6b7280", label: "Won't Fix" },
  DEFERRED: { color: "#f59e0b", label: "Deferred" },
  CRITICAL: { color: "#ef4444", label: "Critical" },
  HIGH: { color: "#f97316", label: "High" },
  MEDIUM: { color: "#f59e0b", label: "Medium" },
  LOW: { color: "#6b7280", label: "Low" },
};

interface StatusPillProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusPill({ status, size = "sm" }: StatusPillProps) {
  const config = STATUS_CONFIG[status] || { color: "#6b7280", label: status };

  return (
    <span
      className="pill"
      style={{
        backgroundColor: `${config.color}14`,
        color: config.color,
        fontSize: size === "sm" ? "0.75rem" : "0.8125rem",
      }}
    >
      <span className="pill-dot" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  FLIGHT: { color: "#38bdf8", label: "Flight" },
  COMPLIANCE: { color: "#f59e0b", label: "Compliance" },
  FUNCTIONAL: { color: "#a78bfa", label: "Functional" },
  REGRESSION: { color: "#a78bfa", label: "Regression" },
  MAINTENANCE: { color: "#34d399", label: "Maintenance" },
  EXPERIMENTAL: { color: "#fb923c", label: "Experimental" },
  SOFTWARE: { color: "#a78bfa", label: "Software" },
  FIRMWARE: { color: "#a78bfa", label: "Firmware" },
  HARDWARE: { color: "#94a3b8", label: "Hardware" },
  DRONE_UNIT: { color: "#38bdf8", label: "Test Unit" },
  SYSTEM: { color: "#6b7280", label: "System" },
};

interface TypePillProps {
  type: string;
  size?: "sm" | "md";
}

export function TypePill({ type, size = "sm" }: TypePillProps) {
  const config = TYPE_CONFIG[type] || { color: "#6b7280", label: type };

  return (
    <span
      className="pill"
      style={{
        backgroundColor: `${config.color}14`,
        color: config.color,
        fontSize: size === "sm" ? "0.75rem" : "0.8125rem",
      }}
    >
      <span className="pill-dot" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}
