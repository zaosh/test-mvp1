"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { StatusPill, TypePill } from "@/components/shared/StatusPill";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

interface Issue {
  id: string;
  title: string;
  severity: string;
  status: string;
  assignee: { id: string; name: string } | null;
}

interface TestRunDetail {
  id: string;
  runDate: string;
  environment: string;
  status: string;
  notes: string | null;
  measuredValues: Record<string, unknown> | null;
  flightData: Record<string, unknown> | null;
  weatherData: Record<string, unknown> | null;
  location: string | null;
  testCase: {
    id: string;
    title: string;
    testType: string;
    description: string | null;
  };
  component: { id: string; name: string; type: string } | null;
  loggedBy: { id: string; name: string };
  issues: Issue[];
}

function formatKey(key: string): string {
  // Convert camelCase to readable, with known unit suffixes
  const unitMap: Record<string, string> = {
    celsius: "(°C)",
    fahrenheit: "(°F)",
    meters: "(m)",
    kilometers: "(km)",
    seconds: "(s)",
    minutes: "(min)",
    hours: "(h)",
    percent: "(%)",
    mph: "(mph)",
    kmh: "(km/h)",
    mps: "(m/s)",
    degrees: "(°)",
    volts: "(V)",
    amps: "(A)",
    watts: "(W)",
    rpm: "(RPM)",
    psi: "(PSI)",
    bar: "(bar)",
    hz: "(Hz)",
    db: "(dB)",
    kg: "(kg)",
    grams: "(g)",
    mm: "(mm)",
    cm: "(cm)",
  };

  let unit = "";
  let processedKey = key;

  for (const [suffix, symbol] of Object.entries(unitMap)) {
    if (key.toLowerCase().endsWith(suffix)) {
      unit = ` ${symbol}`;
      processedKey = key.slice(0, -suffix.length);
      break;
    }
  }

  const readable = processedKey
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim();

  return readable.charAt(0).toUpperCase() + readable.slice(1) + unit;
}

export default function TestRunDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session, status: authStatus } = useSession();

  const [run, setRun] = useState<TestRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (id) {
      fetch(`/api/test-runs/${id}`)
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load test run");
          return r.json();
        })
        .then(setRun)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [authStatus, id, router]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const sessionUser = session?.user as { role?: string } | undefined;
  const canDelete =
    sessionUser?.role === "ADMIN" || sessionUser?.role === "QA";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/test-runs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete test run");
      router.push("/test-runs");
    } catch {
      setDeleting(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8888a8] text-sm">Loading test run...</div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-[#ef4444] text-sm">{error ?? "Test run not found"}</div>
        <button
          onClick={() => router.push("/test-runs")}
          className="bg-transparent border border-[#2a2a38] text-[#8888a8] hover:text-[#e8e8f0] hover:border-[#555570] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Back to Test Runs
        </button>
      </div>
    );
  }

  const flightData = run.flightData as Record<string, unknown> | null;
  const weatherData = run.weatherData as Record<string, unknown> | null;
  const measuredValues = run.measuredValues as Record<string, unknown> | null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => router.push("/test-runs")}
        className="text-[#8888a8] hover:text-[#e8e8f0] text-sm transition-colors flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Test Runs
      </button>

      {/* Header */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl text-[#e8e8f0] tracking-tight">
              {run.testCase.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusPill status={run.status} size="md" />
              <TypePill type={run.testCase.testType} size="md" />
              <span className="text-xs text-[#8888a8] uppercase tracking-wider bg-[#1a1a24] px-2 py-1 rounded">
                {run.environment}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right space-y-1">
              <div className="text-sm text-[#8888a8]">{formatDate(run.runDate)}</div>
              <div className="text-sm text-[#555570]">
                by {run.loggedBy.name}
              </div>
            </div>
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {run.component && (
          <div className="mt-4 pt-4 border-t border-[#2a2a38]">
            <span className="text-xs text-[#555570] uppercase tracking-wider">
              Component
            </span>
            <button
              onClick={() => router.push(`/components/${run.component!.id}`)}
              className="block text-sm text-[#3b82f6] hover:text-[#60a5fa] mt-0.5 transition-colors"
            >
              {run.component.name}
            </button>
          </div>
        )}
      </div>

      {/* Failed run: Create Issue CTA */}
      {run.status === "FAILED" && (
        <div className="bg-[#1a1014] border border-[#3a1a1a] rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-[#ef4444]">This test run failed</div>
            <div className="text-xs text-[#8888a8] mt-0.5">
              Create an issue to track and resolve the failure.
            </div>
          </div>
          <button
            onClick={() =>
              router.push(`/issues/new?testRunId=${run.id}`)
            }
            className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            Create Issue
          </button>
        </div>
      )}

      {/* Notes */}
      {run.notes && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
          <h2 className="text-sm text-[#8888a8] uppercase tracking-wider mb-3">
            Notes
          </h2>
          <p className="text-sm text-[#e8e8f0] whitespace-pre-wrap leading-relaxed">
            {run.notes}
          </p>
        </div>
      )}

      {/* Location */}
      {run.location && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
          <h2 className="text-sm text-[#8888a8] uppercase tracking-wider mb-3">
            Location
          </h2>
          <p className="text-sm text-[#e8e8f0]">{run.location}</p>
        </div>
      )}

      {/* Measured Values */}
      {measuredValues && Object.keys(measuredValues).length > 0 && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
          <h2 className="text-sm text-[#8888a8] uppercase tracking-wider mb-4">
            Measured Values
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a38]">
                  <th className="text-left text-[#555570] font-medium px-3 py-2">
                    Parameter
                  </th>
                  <th className="text-right text-[#555570] font-medium px-3 py-2">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(measuredValues).map(([key, value]) => (
                  <tr
                    key={key}
                    className="border-b border-[#2a2a38] last:border-b-0"
                  >
                    <td className="px-3 py-2 text-[#e8e8f0]">
                      {formatKey(key)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono-value text-[#e8e8f0]">
                      {String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flight Data */}
      {flightData && Object.keys(flightData).length > 0 && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
          <h2 className="text-sm text-[#8888a8] uppercase tracking-wider mb-4">
            Flight Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flightData.altitude != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Altitude
                </div>
                <div className="font-mono-value text-[#e8e8f0]">
                  {String(flightData.altitude)} m
                </div>
              </div>
            )}
            {flightData.speed != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Speed
                </div>
                <div className="font-mono-value text-[#e8e8f0]">
                  {String(flightData.speed)} m/s
                </div>
              </div>
            )}
            {flightData.wind != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Wind
                </div>
                <div className="font-mono-value text-[#e8e8f0]">
                  {String(flightData.wind)} m/s
                </div>
              </div>
            )}
            {flightData.duration != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Duration
                </div>
                <div className="font-mono-value text-[#e8e8f0]">
                  {String(flightData.duration)} min
                </div>
              </div>
            )}
            {flightData.coordinates != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Coordinates
                </div>
                <div className="font-mono-value text-[#e8e8f0] text-sm">
                  {String(flightData.coordinates)}
                </div>
              </div>
            )}
            {flightData.headingsCompleted != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Headings
                </div>
                <div className="text-[#e8e8f0] text-sm">
                  <span className="text-[#22c55e] font-mono-value">
                    {String(flightData.headingsCompleted)}
                  </span>
                  <span className="text-[#555570]"> completed</span>
                  {flightData.headingsPending != null && (
                    <>
                      <span className="text-[#555570]"> / </span>
                      <span className="text-[#f59e0b] font-mono-value">
                        {String(flightData.headingsPending)}
                      </span>
                      <span className="text-[#555570]"> pending</span>
                    </>
                  )}
                </div>
              </div>
            )}
            {/* Render any other flight data fields not explicitly handled */}
            {Object.entries(flightData)
              .filter(
                ([k]) =>
                  ![
                    "altitude",
                    "speed",
                    "wind",
                    "duration",
                    "coordinates",
                    "headingsCompleted",
                    "headingsPending",
                  ].includes(k)
              )
              .map(([key, value]) => (
                <div
                  key={key}
                  className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4"
                >
                  <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                    {formatKey(key)}
                  </div>
                  <div className="font-mono-value text-[#e8e8f0]">
                    {String(value)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Weather Data */}
      {weatherData && Object.keys(weatherData).length > 0 && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
          <h2 className="text-sm text-[#8888a8] uppercase tracking-wider mb-4">
            Weather Conditions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weatherData.temperature != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Temperature
                </div>
                <div className="font-mono-value text-[#e8e8f0]">
                  {String(weatherData.temperature)}°C
                </div>
              </div>
            )}
            {weatherData.humidity != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Humidity
                </div>
                <div className="font-mono-value text-[#e8e8f0]">
                  {String(weatherData.humidity)}%
                </div>
              </div>
            )}
            {weatherData.windSpeed != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Wind Speed
                </div>
                <div className="font-mono-value text-[#e8e8f0]">
                  {String(weatherData.windSpeed)} m/s
                </div>
              </div>
            )}
            {weatherData.windDirection != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Wind Direction
                </div>
                <div className="font-mono-value text-[#e8e8f0]">
                  {String(weatherData.windDirection)}°
                </div>
              </div>
            )}
            {weatherData.visibility != null && (
              <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4">
                <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                  Visibility
                </div>
                <div className="font-mono-value text-[#e8e8f0]">
                  {String(weatherData.visibility)} km
                </div>
              </div>
            )}
            {/* Render any other weather data fields */}
            {Object.entries(weatherData)
              .filter(
                ([k]) =>
                  ![
                    "temperature",
                    "humidity",
                    "windSpeed",
                    "windDirection",
                    "visibility",
                  ].includes(k)
              )
              .map(([key, value]) => (
                <div
                  key={key}
                  className="bg-[#1a1a24] border border-[#2a2a38] rounded-lg p-4"
                >
                  <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">
                    {formatKey(key)}
                  </div>
                  <div className="font-mono-value text-[#e8e8f0]">
                    {String(value)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Linked Issues */}
      {run.issues && run.issues.length > 0 && (
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
          <h2 className="text-sm text-[#8888a8] uppercase tracking-wider mb-4">
            Linked Issues ({run.issues.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a38]">
                  <th className="text-left text-[#555570] font-medium px-3 py-2">
                    Title
                  </th>
                  <th className="text-left text-[#555570] font-medium px-3 py-2">
                    Severity
                  </th>
                  <th className="text-left text-[#555570] font-medium px-3 py-2">
                    Status
                  </th>
                  <th className="text-left text-[#555570] font-medium px-3 py-2">
                    Assignee
                  </th>
                </tr>
              </thead>
              <tbody>
                {run.issues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => router.push(`/issues/${issue.id}`)}
                    className="border-b border-[#2a2a38] last:border-b-0 hover:bg-[#1a1a24] cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2 text-[#e8e8f0]">{issue.title}</td>
                    <td className="px-3 py-2">
                      <StatusPill status={issue.severity} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={issue.status} />
                    </td>
                    <td className="px-3 py-2 text-[#8888a8]">
                      {issue.assignee?.name ?? "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Test Run"
        description="This test run will be soft-deleted and hidden from lists."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleting}
      />
    </div>
  );
}
