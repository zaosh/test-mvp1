"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StatusPill, TypePill } from "@/components/shared/StatusPill";
import { format, formatDistanceToNow, isThisWeek, isBefore } from "date-fns";

interface TestCase {
  id: string;
  title: string;
  testType: string;
  status: string;
  nextDueDate?: string | null;
  component?: { id: string; name: string } | null;
  owner?: { id: string; name: string; email: string } | null;
  _count?: { testRuns: number; forks: number };
}

interface TestRun {
  id: string;
  status: string;
  runDate: string;
  environment: string;
  notes?: string | null;
  testCase?: { id: string; title: string; testType: string } | null;
  loggedBy?: { id: string; name: string } | null;
}

interface Issue {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  assignee?: { id: string; name: string } | null;
}

type Tab = "due" | "overdue" | "all";

export default function MyTestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("due");
  const [loading, setLoading] = useState(true);

  // Quick log form state
  const [logTestCaseId, setLogTestCaseId] = useState("");
  const [logEnvironment, setLogEnvironment] = useState("LAB");
  const [logStatus, setLogStatus] = useState("PASSED");
  const [logNotes, setLogNotes] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logMessage, setLogMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const userId = (session?.user as any)?.id;
  const userName = session?.user?.name || "there";

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    async function fetchData() {
      try {
        const [casesRes, runsRes, issuesRes] = await Promise.all([
          fetch(`/api/test-cases?ownerId=${userId}`),
          fetch(`/api/test-runs?loggedById=${userId}`),
          fetch(`/api/issues?assigneeId=${userId}`),
        ]);

        const [casesData, runsData, issuesData] = await Promise.all([
          casesRes.json(),
          runsRes.json(),
          issuesRes.json(),
        ]);

        setTestCases(Array.isArray(casesData) ? casesData : []);
        setTestRuns(Array.isArray(runsData) ? runsData : []);

        // Filter open issues only
        const openIssues = Array.isArray(issuesData)
          ? issuesData.filter(
              (i: Issue) => i.status === "OPEN" || i.status === "IN_PROGRESS"
            )
          : [];
        setIssues(openIssues);
      } catch (err) {
        console.error("Error loading my tests:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchData();
  }, [session, sessionStatus, router, userId]);

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  // Tab filtering
  const now = new Date();

  const dueThisWeek = testCases.filter((tc) => {
    if (!tc.nextDueDate) return false;
    return isThisWeek(new Date(tc.nextDueDate), { weekStartsOn: 1 });
  });

  const overdue = testCases.filter((tc) => {
    if (!tc.nextDueDate) return false;
    return (
      isBefore(new Date(tc.nextDueDate), now) && tc.status !== "CONCLUDED"
    );
  });

  const filteredCases =
    activeTab === "due"
      ? dueThisWeek
      : activeTab === "overdue"
      ? overdue
      : testCases;

  // Recent completed runs (last 5 PASSED or FAILED)
  const recentCompleted = testRuns
    .filter((r) => r.status === "PASSED" || r.status === "FAILED")
    .slice(0, 5);

  async function handleQuickLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logTestCaseId) return;

    setLogSubmitting(true);
    setLogMessage(null);

    try {
      const res = await fetch("/api/test-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testCaseId: logTestCaseId,
          environment: logEnvironment,
          status: logStatus,
          notes: logNotes || undefined,
        }),
      });

      if (res.ok) {
        const newRun = await res.json();
        setTestRuns((prev) => [newRun, ...prev]);
        setLogMessage({ type: "success", text: "Test run logged successfully" });
        setLogTestCaseId("");
        setLogNotes("");
      } else {
        const err = await res.json();
        setLogMessage({
          type: "error",
          text: err.error || "Failed to log test run",
        });
      }
    } catch {
      setLogMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLogSubmitting(false);
    }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-[#555570] text-sm">Loading your tests...</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "due", label: "Due This Week", count: dueThisWeek.length },
    { key: "overdue", label: "Overdue", count: overdue.length },
    { key: "all", label: "All Mine", count: testCases.length },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-[#e8e8f0]">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-[#555570] text-sm mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Tabbed Test Cases Section */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <div className="flex items-center gap-1 mb-4 border-b border-[#2a2a38] pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-[#3b82f6] text-white"
                  : "text-[#8888a8] hover:text-[#e8e8f0] hover:bg-[#1a1a24]"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 font-mono-value text-xs ${
                  activeTab === tab.key ? "text-white/70" : "text-[#555570]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {filteredCases.length === 0 ? (
          <p className="text-[#555570] text-sm py-4">
            {activeTab === "due"
              ? "Nothing due this week"
              : activeTab === "overdue"
              ? "No overdue tests"
              : "No test cases assigned to you"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#555570] text-xs border-b border-[#2a2a38]">
                  <th className="text-left pb-2 font-medium">Title</th>
                  <th className="text-left pb-2 font-medium">Type</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Component</th>
                  <th className="text-right pb-2 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((tc) => (
                  <tr
                    key={tc.id}
                    className="border-b border-[#2a2a38] last:border-0"
                  >
                    <td className="py-2.5 text-[#e8e8f0] max-w-[250px] truncate">
                      {tc.title}
                    </td>
                    <td className="py-2.5">
                      <TypePill type={tc.testType} />
                    </td>
                    <td className="py-2.5">
                      <StatusPill status={tc.status} />
                    </td>
                    <td className="py-2.5 text-[#8888a8]">
                      {tc.component?.name ?? "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      {tc.nextDueDate ? (
                        <span
                          className={`text-xs font-mono-value ${
                            isBefore(new Date(tc.nextDueDate), now) &&
                            tc.status !== "CONCLUDED"
                              ? "text-[#ef4444]"
                              : "text-[#555570]"
                          }`}
                        >
                          {format(new Date(tc.nextDueDate), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-xs text-[#555570]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two column: Quick Log + Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Log Panel */}
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#e8e8f0] mb-4">
            Quick Log
          </h2>
          <form onSubmit={handleQuickLog} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8888a8] mb-1.5">
                Test Case
              </label>
              <select
                value={logTestCaseId}
                onChange={(e) => setLogTestCaseId(e.target.value)}
                required
                className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a test case</option>
                {testCases.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#8888a8] mb-1.5">
                  Environment
                </label>
                <select
                  value={logEnvironment}
                  onChange={(e) => setLogEnvironment(e.target.value)}
                  className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm"
                >
                  <option value="LAB">Lab</option>
                  <option value="FIELD">Field</option>
                  <option value="SIMULATION">Simulation</option>
                  <option value="BENCH">Bench</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#8888a8] mb-1.5">
                  Status
                </label>
                <select
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value)}
                  className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm"
                >
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#8888a8] mb-1.5">
                Notes
              </label>
              <textarea
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#1a1a24] border border-[#2a2a38] text-[#e8e8f0] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#3b82f6] transition-colors"
                placeholder="Optional notes..."
              />
            </div>

            {logMessage && (
              <div
                className={`text-sm rounded-lg px-3 py-2 ${
                  logMessage.type === "success"
                    ? "bg-[#22c55e1a] border border-[#22c55e33] text-[#22c55e]"
                    : "bg-[#ef44441a] border border-[#ef444433] text-[#ef4444]"
                }`}
              >
                {logMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={logSubmitting || !logTestCaseId}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {logSubmitting ? "Logging..." : "Log Test Run"}
            </button>
          </form>
        </div>

        {/* My Open Issues */}
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#e8e8f0] mb-4">
            My Open Issues
          </h2>
          {issues.length === 0 ? (
            <p className="text-[#555570] text-sm">No open issues assigned to you</p>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between py-2 border-b border-[#2a2a38] last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusPill status={issue.severity} />
                    <span className="text-sm text-[#e8e8f0] truncate">
                      {issue.title}
                    </span>
                  </div>
                  <span className="text-xs text-[#555570] font-mono-value flex-shrink-0 ml-3">
                    {(() => {
                      try {
                        return formatDistanceToNow(new Date(issue.createdAt), {
                          addSuffix: false,
                        });
                      } catch {
                        return "—";
                      }
                    })()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Completed Runs */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[#e8e8f0] mb-4">
          Recent Completed Runs
        </h2>
        {recentCompleted.length === 0 ? (
          <p className="text-[#555570] text-sm">No recent completed runs</p>
        ) : (
          <div className="space-y-3">
            {recentCompleted.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between py-2 border-b border-[#2a2a38] last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusPill status={run.status} />
                  <span className="text-sm text-[#e8e8f0] truncate">
                    {run.testCase?.title ?? `Run ${run.id}`}
                  </span>
                </div>
                <span className="text-xs text-[#555570] font-mono-value flex-shrink-0 ml-3">
                  {(() => {
                    try {
                      return format(new Date(run.runDate), "MMM d, yyyy");
                    } catch {
                      return "—";
                    }
                  })()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
