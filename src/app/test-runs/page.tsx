"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { StatusPill } from "@/components/shared/StatusPill";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState, EMPTY_ICONS } from "@/components/shared/EmptyState";

interface TestCase {
  id: string;
  title: string;
  testType: string;
}

interface Component {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

interface TestRun {
  id: string;
  runDate: string;
  environment: string;
  status: string;
  notes: string | null;
  measuredValues: Record<string, unknown> | null;
  flightData: Record<string, unknown> | null;
  weatherData: Record<string, unknown> | null;
  location: string | null;
  testCaseId: string;
  componentId: string | null;
  loggedById: string;
  testCase: { id: string; title: string; testType: string };
  component: { id: string; name: string } | null;
  loggedBy: { id: string; name: string };
  _count: { issues: number };
}

export default function TestRunsPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();

  const [runs, setRuns] = useState<TestRun[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Filters
  const [filterTestCase, setFilterTestCase] = useState("");
  const [filterComponent, setFilterComponent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEnvironment, setFilterEnvironment] = useState("");
  const [filterLoggedBy, setFilterLoggedBy] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Fetch lookup data
  useEffect(() => {
    if (authStatus === "loading") return;
    {
      Promise.all([
        fetch("/api/test-cases").then((r) => r.json()),
        fetch("/api/components").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()),
      ])
        .then(([casesData, compsData, usersData]) => {
          setTestCases(casesData);
          setComponents(compsData);
          setUsers(usersData);
        })
        .catch(console.error);
    }
  }, [authStatus, router]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterTestCase, filterComponent, filterStatus, filterEnvironment, filterLoggedBy, filterDateFrom, filterDateTo]);

  // Fetch runs with server-side pagination
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const params = new URLSearchParams();
    if (filterTestCase) params.set("testCaseId", filterTestCase);
    if (filterComponent) params.set("componentId", filterComponent);
    if (filterStatus) params.set("status", filterStatus);
    if (filterEnvironment) params.set("environment", filterEnvironment);
    if (filterLoggedBy) params.set("loggedById", filterLoggedBy);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterDateTo) params.set("dateTo", filterDateTo);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    setLoading(true);
    fetch(`/api/test-runs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !Array.isArray(data) && Array.isArray(data.data)) {
          setRuns(data.data);
          setTotal(data.total);
        } else {
          setRuns(Array.isArray(data) ? data : []);
          setTotal(Array.isArray(data) ? data.length : 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authStatus, filterTestCase, filterComponent, filterStatus, filterEnvironment, filterLoggedBy, filterDateFrom, filterDateTo, page]);

  const filteredRuns = runs;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8888a8] text-sm">Loading test runs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#e8e8f0] tracking-tight">Test Runs</h1>
          <p className="text-sm text-[#8888a8] mt-1">
            {filteredRuns.length} run{filteredRuns.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={() => router.push("/test-runs/new")}
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Log New Run
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={filterTestCase}
            onChange={(e) => setFilterTestCase(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="">All Test Cases</option>
            {testCases.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.title}
              </option>
            ))}
          </select>

          <select
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="">All Components</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="">All Statuses</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          <select
            value={filterEnvironment}
            onChange={(e) => setFilterEnvironment(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="">All Environments</option>
            <option value="LAB">Lab</option>
            <option value="FIELD">Field</option>
            <option value="SIMULATION">Simulation</option>
            <option value="BENCH">Bench</option>
          </select>

          <select
            value={filterLoggedBy}
            onChange={(e) => setFilterLoggedBy(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            placeholder="From date"
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
          />

          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            placeholder="To date"
            className="bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
          />

          <button
            onClick={() => {
              setFilterTestCase("");
              setFilterComponent("");
              setFilterStatus("");
              setFilterEnvironment("");
              setFilterLoggedBy("");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
            className="bg-transparent border border-[#2a2a38] text-[#8888a8] hover:text-[#e8e8f0] hover:border-[#555570] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a38]">
                <th className="text-left text-[#8888a8] font-medium px-4 py-3">
                  Test Case
                </th>
                <th className="text-left text-[#8888a8] font-medium px-4 py-3">
                  Component
                </th>
                <th className="text-left text-[#8888a8] font-medium px-4 py-3">
                  Environment
                </th>
                <th className="text-left text-[#8888a8] font-medium px-4 py-3">
                  Status
                </th>
                <th className="text-left text-[#8888a8] font-medium px-4 py-3">
                  Date
                </th>
                <th className="text-left text-[#8888a8] font-medium px-4 py-3">
                  Logged By
                </th>
                <th className="text-right text-[#8888a8] font-medium px-4 py-3">
                  Issues
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={EMPTY_ICONS.testRun}
                      title="No test runs found"
                      description="Log your first test run to start capturing results."
                      actionLabel="Log New Run"
                      actionHref="/test-runs/new"
                    />
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => router.push(`/test-runs/${run.id}`)}
                    className="border-b border-[#2a2a38] last:border-b-0 hover:bg-[#1a1a24] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-[#e8e8f0]">
                      {run.testCase.title}
                    </td>
                    <td className="px-4 py-3 text-[#8888a8]">
                      {run.component?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[#8888a8] text-xs uppercase tracking-wider">
                        {run.environment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={run.status} />
                    </td>
                    <td className="px-4 py-3 text-[#8888a8]">
                      {formatDate(run.runDate)}
                    </td>
                    <td className="px-4 py-3 text-[#8888a8]">
                      {run.loggedBy.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {run._count.issues > 0 ? (
                        <span className="text-[#ef4444] font-mono-value text-xs">
                          {run._count.issues}
                        </span>
                      ) : (
                        <span className="text-[#555570]">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
