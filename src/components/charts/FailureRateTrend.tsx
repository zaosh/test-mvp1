"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FailureRateTrendProps {
  data: Array<{
    date: string;
    total: number;
    passed: number;
    failed: number;
    failureRate: number;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-[#8888a8] mb-1 text-xs">
        {label ? formatDateLabel(label) : ""}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#e8e8f0]">
            {entry.name === "failureRate"
              ? `Failure Rate: ${entry.value.toFixed(1)}%`
              : `Total Runs: ${entry.value}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FailureRateTrend({ data }: FailureRateTrendProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#555570] text-sm">
        No trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid stroke="#2a2a38" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          tick={{ fill: "#555570", fontSize: 12 }}
          axisLine={{ stroke: "#2a2a38" }}
          tickLine={{ stroke: "#2a2a38" }}
        />
        <YAxis
          yAxisId="rate"
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fill: "#555570", fontSize: 12 }}
          axisLine={{ stroke: "#2a2a38" }}
          tickLine={{ stroke: "#2a2a38" }}
          width={45}
        />
        <YAxis
          yAxisId="count"
          orientation="right"
          tick={{ fill: "#555570", fontSize: 12 }}
          axisLine={{ stroke: "#2a2a38" }}
          tickLine={{ stroke: "#2a2a38" }}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="failureRate"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#ef4444" }}
          name="failureRate"
        />
        <Line
          yAxisId="count"
          type="monotone"
          dataKey="total"
          stroke="#555570"
          strokeWidth={1}
          strokeDasharray="4 4"
          dot={false}
          name="total"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
