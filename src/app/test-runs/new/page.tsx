"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";

interface TestCase {
  id: string;
  title: string;
  testType: string;
}

interface Component {
  id: string;
  name: string;
  serialNumber: string | null;
}

interface MeasuredRow {
  key: string;
  value: string;
}

const testRunSchema = z.object({
  testCaseId: z.string().min(1, "Test case is required"),
  componentId: z.string().optional(),
  environment: z.enum(["LAB", "FIELD", "SIMULATION", "BENCH"], {
    message: "Environment is required",
  }),
  status: z.enum(["PASSED", "FAILED", "IN_PROGRESS", "BLOCKED"], {
    message: "Status is required",
  }),
  notes: z.string().optional(),
  location: z.string().optional(),
  measuredValues: z.record(z.string(), z.unknown()).optional(),
  flightData: z.record(z.string(), z.unknown()).optional(),
  weatherData: z.record(z.string(), z.unknown()).optional(),
});

export default function NewTestRunPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [testCaseId, setTestCaseId] = useState("");
  const [componentId, setComponentId] = useState("");
  const [environment, setEnvironment] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");

  // Dynamic fields
  const [measuredRows, setMeasuredRows] = useState<MeasuredRow[]>([]);

  // Flight-specific fields
  const [pilotName, setPilotName] = useState("");
  const [duration, setDuration] = useState("");
  const [weatherTemp, setWeatherTemp] = useState("");
  const [weatherWind, setWeatherWind] = useState("");
  const [weatherHumidity, setWeatherHumidity] = useState("");

  // Compliance-specific fields
  const [signedOff, setSignedOff] = useState(false);
  const [certifierName, setCertifierName] = useState("");

  // Hardware-specific fields
  const [benchConditions, setBenchConditions] = useState("");

  // Failed modal
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [newRunId, setNewRunId] = useState<string | null>(null);

  const selectedTestCase = testCases.find((tc) => tc.id === testCaseId);
  const selectedComponent = components.find((c) => c.id === componentId);
  const testType = selectedTestCase?.testType;

  useEffect(() => {
    if (authStatus === "loading") return;
    {
      Promise.all([
        fetch("/api/test-cases").then((r) => r.json()),
        fetch("/api/components").then((r) => r.json()),
      ])
        .then(([casesData, compsData]) => {
          setTestCases(casesData);
          setComponents(compsData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [authStatus, router]);

  const addMeasuredRow = () => {
    setMeasuredRows([...measuredRows, { key: "", value: "" }]);
  };

  const removeMeasuredRow = (index: number) => {
    setMeasuredRows(measuredRows.filter((_, i) => i !== index));
  };

  const updateMeasuredRow = (
    index: number,
    field: "key" | "value",
    val: string
  ) => {
    const updated = [...measuredRows];
    updated[index] = { ...updated[index], [field]: val };
    setMeasuredRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Build measured values
    const measuredValues: Record<string, string> = {};
    for (const row of measuredRows) {
      if (row.key.trim()) {
        measuredValues[row.key.trim()] = row.value.trim();
      }
    }

    // Build flight data
    let flightData: Record<string, unknown> | undefined;
    if (testType === "FLIGHT") {
      flightData = {};
      if (pilotName) flightData.pilotName = pilotName;
      if (duration) flightData.duration = parseFloat(duration);
    }

    // Build weather data
    let weatherData: Record<string, unknown> | undefined;
    if (testType === "FLIGHT") {
      weatherData = {};
      if (weatherTemp) weatherData.temperature = parseFloat(weatherTemp);
      if (weatherWind) weatherData.windSpeed = parseFloat(weatherWind);
      if (weatherHumidity) weatherData.humidity = parseFloat(weatherHumidity);
      if (Object.keys(weatherData).length === 0) weatherData = undefined;
    }

    // Build body
    const body: Record<string, unknown> = {
      testCaseId,
      environment,
      status,
    };
    if (componentId) body.componentId = componentId;
    if (notes.trim()) body.notes = notes.trim();
    if (location.trim()) body.location = location.trim();
    if (Object.keys(measuredValues).length > 0)
      body.measuredValues = measuredValues;
    if (flightData && Object.keys(flightData).length > 0)
      body.flightData = flightData;
    if (weatherData) body.weatherData = weatherData;

    // Compliance metadata in notes or measured values
    if (testType === "COMPLIANCE") {
      if (certifierName) {
        body.measuredValues = {
          ...(body.measuredValues as Record<string, string> | undefined),
          certifierName,
          signedOff: signedOff ? "Yes" : "No",
        };
      }
    }

    // Hardware metadata
    if (testType === "HARDWARE" && benchConditions) {
      body.measuredValues = {
        ...(body.measuredValues as Record<string, string> | undefined),
        benchConditions,
      };
    }

    // Validate
    const result = testRunSchema.safeParse(body);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/test-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrors({ submit: err.error || "Failed to create test run" });
        return;
      }

      const created = await res.json();
      setNewRunId(created.id);

      if (status === "FAILED") {
        setShowFailedModal(true);
      } else {
        router.push(`/test-runs/${created.id}`);
      }
    } catch {
      setErrors({ submit: "Failed to create test run" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8888a8] text-sm">Loading form...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
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

      <h1 className="text-2xl text-[#e8e8f0] tracking-tight">Log Test Run</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core fields */}
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 space-y-4">
          <h2 className="text-sm text-[#8888a8] uppercase tracking-wider">
            Core Details
          </h2>

          {/* Test Case */}
          <div>
            <label className="block text-sm text-[#e8e8f0] mb-1">
              Test Case <span className="text-[#ef4444]">*</span>
            </label>
            <select
              value={testCaseId}
              onChange={(e) => setTestCaseId(e.target.value)}
              className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">Select a test case...</option>
              {testCases.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.title} ({tc.testType})
                </option>
              ))}
            </select>
            {errors.testCaseId && (
              <p className="text-xs text-[#ef4444] mt-1">{errors.testCaseId}</p>
            )}
          </div>

          {/* Component */}
          <div>
            <label className="block text-sm text-[#e8e8f0] mb-1">
              Component
            </label>
            <select
              value={componentId}
              onChange={(e) => setComponentId(e.target.value)}
              className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">None (optional)</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Environment */}
          <div>
            <label className="block text-sm text-[#e8e8f0] mb-1">
              Environment <span className="text-[#ef4444]">*</span>
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">Select environment...</option>
              <option value="LAB">Lab</option>
              <option value="FIELD">Field</option>
              <option value="SIMULATION">Simulation</option>
              <option value="BENCH">Bench</option>
            </select>
            {errors.environment && (
              <p className="text-xs text-[#ef4444] mt-1">{errors.environment}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-[#e8e8f0] mb-1">
              Status <span className="text-[#ef4444]">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="">Select status...</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            {errors.status && (
              <p className="text-xs text-[#ef4444] mt-1">{errors.status}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-[#e8e8f0] mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6] resize-y"
              placeholder="Optional notes about this test run..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-[#e8e8f0] mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
              placeholder="e.g. Hangar B, Test Field Alpha"
            />
          </div>
        </div>

        {/* Dynamic fields by test type */}
        {testType === "FLIGHT" && (
          <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 space-y-4">
            <h2 className="text-sm text-[#8888a8] uppercase tracking-wider">
              Flight Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#e8e8f0] mb-1">
                  Pilot Name
                </label>
                <input
                  type="text"
                  value={pilotName}
                  onChange={(e) => setPilotName(e.target.value)}
                  className="w-full bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="Pilot name"
                />
              </div>
              <div>
                <label className="block text-sm text-[#e8e8f0] mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="0"
                  step="0.1"
                />
              </div>
            </div>

            <h3 className="text-xs text-[#555570] uppercase tracking-wider pt-2">
              Weather Conditions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#e8e8f0] mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  value={weatherTemp}
                  onChange={(e) => setWeatherTemp(e.target.value)}
                  className="w-full bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm text-[#e8e8f0] mb-1">
                  Wind Speed (m/s)
                </label>
                <input
                  type="number"
                  value={weatherWind}
                  onChange={(e) => setWeatherWind(e.target.value)}
                  className="w-full bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm text-[#e8e8f0] mb-1">
                  Humidity (%)
                </label>
                <input
                  type="number"
                  value={weatherHumidity}
                  onChange={(e) => setWeatherHumidity(e.target.value)}
                  className="w-full bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="0"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        )}

        {testType === "COMPLIANCE" && (
          <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 space-y-4">
            <h2 className="text-sm text-[#8888a8] uppercase tracking-wider">
              Compliance Details
            </h2>
            <div>
              <label className="block text-sm text-[#e8e8f0] mb-1">
                Certifier Name
              </label>
              <input
                type="text"
                value={certifierName}
                onChange={(e) => setCertifierName(e.target.value)}
                className="w-full bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
                placeholder="Name of certifier"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="signedOff"
                checked={signedOff}
                onChange={(e) => setSignedOff(e.target.checked)}
                className="w-4 h-4 rounded border-[#2a2a38] bg-[#1a1a24] text-[#3b82f6] focus:ring-[#3b82f6]"
              />
              <label htmlFor="signedOff" className="text-sm text-[#e8e8f0]">
                Signed off
              </label>
            </div>
          </div>
        )}

        {testType === "HARDWARE" && (
          <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 space-y-4">
            <h2 className="text-sm text-[#8888a8] uppercase tracking-wider">
              Hardware Details
            </h2>

            {selectedComponent?.serialNumber && (
              <div>
                <span className="text-xs text-[#555570] uppercase tracking-wider">
                  Serial Number
                </span>
                <div className="font-mono-value text-[#e8e8f0] text-sm mt-0.5">
                  {selectedComponent.serialNumber}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-[#e8e8f0] mb-1">
                Bench Conditions
              </label>
              <input
                type="text"
                value={benchConditions}
                onChange={(e) => setBenchConditions(e.target.value)}
                className="w-full bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
                placeholder="Describe bench conditions"
              />
            </div>
          </div>
        )}

        {/* Measured Values */}
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-[#8888a8] uppercase tracking-wider">
              Measured Values
            </h2>
            <button
              type="button"
              onClick={addMeasuredRow}
              className="bg-transparent border border-[#2a2a38] text-[#8888a8] hover:text-[#e8e8f0] hover:border-[#555570] px-3 py-1 rounded-lg text-xs font-medium transition-colors"
            >
              + Add Measurement
            </button>
          </div>

          {measuredRows.length === 0 && (
            <p className="text-xs text-[#555570]">
              No measurements added yet. Click &quot;Add Measurement&quot; to record
              key/value pairs.
            </p>
          )}

          {measuredRows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={row.key}
                onChange={(e) => updateMeasuredRow(index, "key", e.target.value)}
                className="flex-1 bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#3b82f6]"
                placeholder="Parameter name"
              />
              <input
                type="text"
                value={row.value}
                onChange={(e) =>
                  updateMeasuredRow(index, "value", e.target.value)
                }
                className="flex-1 bg-[#111118] border border-[#2a2a38] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] font-mono-value focus:outline-none focus:border-[#3b82f6]"
                placeholder="Value"
              />
              <button
                type="button"
                onClick={() => removeMeasuredRow(index)}
                className="text-[#555570] hover:text-[#ef4444] transition-colors p-2"
                title="Remove"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Submit error */}
        {errors.submit && (
          <div className="bg-[#1a1014] border border-[#3a1a1a] rounded-lg p-3">
            <p className="text-sm text-[#ef4444]">{errors.submit}</p>
          </div>
        )}

        {/* Submit button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Log Test Run"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/test-runs")}
            className="bg-transparent border border-[#2a2a38] text-[#8888a8] hover:text-[#e8e8f0] hover:border-[#555570] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Failed run modal */}
      {showFailedModal && newRunId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-lg text-[#e8e8f0]">Test Run Failed</h2>
            <p className="text-sm text-[#8888a8]">
              This test run was logged with a FAILED status. Would you like to
              create an issue to track and resolve this failure?
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => router.push(`/test-runs/${newRunId}`)}
                className="bg-transparent border border-[#2a2a38] text-[#8888a8] hover:text-[#e8e8f0] hover:border-[#555570] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                No, skip
              </button>
              <button
                onClick={() =>
                  router.push(`/issues/new?testRunId=${newRunId}`)
                }
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Yes, create issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
