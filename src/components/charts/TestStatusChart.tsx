"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ---------------------------------------------------------------------------
// Status colors from design system
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  PASSED: "#22c55e",
  FAILED: "#ef4444",
  IN_PROGRESS: "#3b82f6",
  BLOCKED: "#f97316",
  CONCLUDED: "#8b5cf6",
  PLANNED: "#6b7280",
  DRAFT: "#374151",
};

const fallbackColor = "#555570";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TestStatusChartProps {
  data: Array<{ status: string; count: number }>;
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { status: string } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm shadow-lg">
      <span className="text-[#e8e8f0] font-medium">{entry.payload.status}</span>
      <span className="text-[#8888a8] ml-2">{entry.value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TestStatusChart({ data }: TestStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#555570] text-sm">
        No status data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.status] ?? fallbackColor}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[entry.status] ?? fallbackColor }}
            />
            <span className="text-[#8888a8]">
              {entry.status.replace(/_/g, " ")}
            </span>
            <span className="text-[#555570]">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
