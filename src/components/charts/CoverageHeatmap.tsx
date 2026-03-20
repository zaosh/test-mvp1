"use client";

// ---------------------------------------------------------------------------
// Test type colors from design system
// ---------------------------------------------------------------------------

const TEST_TYPE_COLORS: Record<string, string> = {
  FLIGHT: "#38bdf8",
  COMPLIANCE: "#f59e0b",
  FUNCTIONAL: "#a78bfa",
  REGRESSION: "#a78bfa",
  HARDWARE: "#94a3b8",
  MAINTENANCE: "#34d399",
  EXPERIMENTAL: "#fb923c",
};

const fallbackTypeColor = "#8888a8";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CoverageHeatmapProps {
  data: Array<{
    component: string;
    testType: string;
    count: number;
    passed: number;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPassRateColor(count: number, passed: number): string {
  if (count === 0) return "bg-[#1a1a24]";
  const rate = passed / count;
  if (rate >= 0.9) return "bg-green-500/30";
  if (rate >= 0.7) return "bg-green-500/20";
  if (rate >= 0.5) return "bg-yellow-500/20";
  if (rate >= 0.3) return "bg-orange-500/20";
  return "bg-red-500/20";
}

function getPassRateTextColor(count: number, passed: number): string {
  if (count === 0) return "text-[#555570]";
  const rate = passed / count;
  if (rate >= 0.7) return "text-green-400";
  if (rate >= 0.5) return "text-yellow-400";
  return "text-red-400";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CoverageHeatmap({ data }: CoverageHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#555570] text-sm">
        No coverage data available
      </div>
    );
  }

  // Extract unique components and test types
  const components = Array.from(new Set(data.map((d) => d.component))).sort();
  const testTypes = Array.from(new Set(data.map((d) => d.testType))).sort();

  // Build lookup map: "component|testType" -> { count, passed }
  const lookup = new Map<string, { count: number; passed: number }>();
  for (const d of data) {
    lookup.set(`${d.component}|${d.testType}`, {
      count: d.count,
      passed: d.passed,
    });
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-[#8888a8] font-medium px-3 py-2 border-b border-[#2a2a38]">
              Component
            </th>
            {testTypes.map((tt) => (
              <th
                key={tt}
                className="text-center font-medium px-3 py-2 border-b border-[#2a2a38]"
                style={{ color: TEST_TYPE_COLORS[tt] ?? fallbackTypeColor }}
              >
                {tt}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {components.map((comp) => (
            <tr key={comp} className="border-b border-[#2a2a38]/50">
              <td className="text-[#e8e8f0] font-medium px-3 py-2 whitespace-nowrap">
                {comp}
              </td>
              {testTypes.map((tt) => {
                const cell = lookup.get(`${comp}|${tt}`);
                const count = cell?.count ?? 0;
                const passed = cell?.passed ?? 0;

                return (
                  <td key={tt} className="px-3 py-2 text-center">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-8 rounded ${getPassRateColor(
                        count,
                        passed
                      )}`}
                      title={
                        count > 0
                          ? `${passed}/${count} passed (${Math.round(
                              (passed / count) * 100
                            )}%)`
                          : "No tests"
                      }
                    >
                      <span
                        className={`text-xs font-medium ${getPassRateTextColor(
                          count,
                          passed
                        )}`}
                      >
                        {count > 0 ? count : "\u2014"}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-[#8888a8]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-green-500/30" />
          &gt;90% pass
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-green-500/20" />
          70-90%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-yellow-500/20" />
          50-70%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-orange-500/20" />
          30-50%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-red-500/20" />
          &lt;30%
        </span>
      </div>
    </div>
  );
}
