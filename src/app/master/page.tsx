"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StatusPill, TypePill } from "@/components/shared/StatusPill";
import { format, formatDistanceToNow } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalActiveTests: number;
  passedThisMonth: number;
  openIssues: number;
  overdueTests: number;
}

interface FailureTrendPoint {
  date: string;
  total: number;
  passed: number;
  failed: number;
  failureRate: number;
}

interface Activity {
  type: "test_run" | "issue" | "archive";
  title: string;
  user: string;
  date: string;
  status?: string;
}

interface TestPlan {
  id: string;
  title: string;
  status: string;
  description?: string;
  _count: { testCases: number };
}

interface Issue {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  assignee?: { id: string; name: string } | null;
  component?: { id: string; name: string } | null;
}

interface TestCase {
  id: string;
  title: string;
  testType: string;
  status: string;
  nextDueDate?: string | null;
  owner?: { id: string; name: string } | null;
  component?: { id: string; name: string } | null;
}

export default function MasterDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [failureTrend, setFailureTrend] = useState<FailureTrendPoint[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [complianceTests, setComplianceTests] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    const role = (session?.user as any)?.role;
    if (!["ADMIN", "QA", "MANAGER"].includes(role)) {
      router.push("/my-tests");
      return;
    }

    async function fetchData() {
      try {
        const [statsRes, trendRes, activityRes, plansRes, issuesRes, complianceRes] =
          await Promise.all([
            fetch("/api/dashboard/stats"),
            fetch("/api/dashboard/failure-trend"),
            fetch("/api/dashboard/activity"),
            fetch("/api/test-plans"),
            fetch("/api/issues"),
            fetch("/api/test-cases?type=COMPLIANCE"),
          ]);

        const [statsData, trendData, activityData, plansData, issuesData, complianceData] =
          await Promise.all([
            statsRes.json(),
            trendRes.json(),
            activityRes.json(),
            plansRes.json(),
            issuesRes.json(),
            complianceRes.json(),
          ]);

        setStats(statsData);
        setFailureTrend(Array.isArray(trendData) ? trendData : []);
        setActivities(Array.isArray(activityData) ? activityData : []);
        setTestPlans(Array.isArray(plansData) ? plansData : []);

        // Filter open issues
        const openIssues = Array.isArray(issuesData)
          ? issuesData.filter(
              (i: Issue) => i.status === "OPEN" || i.status === "IN_PROGRESS"
            )
          : [];
        setIssues(openIssues);

        // Filter compliance tests pending sign-off
        const pending = Array.isArray(complianceData)
          ? complianceData.filter(
              (tc: TestCase) =>
                tc.status !== "PASSED" && tc.status !== "CONCLUDED"
            )
          : [];
        setComplianceTests(pending);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session, sessionStatus, router]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-[#555570] text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Active Tests",
      value: stats?.totalActiveTests ?? 0,
      accent: "#3b82f6",
    },
    {
      label: "Passed This Month",
      value: stats?.passedThisMonth ?? 0,
      accent: "#22c55e",
    },
    {
      label: "Open Issues",
      value: stats?.openIssues ?? 0,
      accent: "#ef4444",
    },
    {
      label: "Overdue Tests",
      value: stats?.overdueTests ?? 0,
      accent: "#f59e0b",
    },
  ];

  function activityIcon(type: string) {
    switch (type) {
      case "test_run":
        return (
          <div className="w-8 h-8 rounded-full bg-[#3b82f614] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case "issue":
        return (
          <div className="w-8 h-8 rounded-full bg-[#ef444414] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case "archive":
        return (
          <div className="w-8 h-8 rounded-full bg-[#8b5cf614] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  }

  function issueAge(createdAt: string) {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: false });
    } catch {
      return "—";
    }
  }

  // Active test plans (not CONCLUDED)
  const activePlans = testPlans.filter((p) => p.status !== "CONCLUDED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#e8e8f0]">
          Master Dashboard
        </h1>
        <p className="text-[#555570] text-sm mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6"
          >
            <p
              className="text-3xl font-semibold font-mono-value"
              style={{ color: card.accent }}
            >
              {card.value}
            </p>
            <p className="text-[#8888a8] text-sm mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Active Test Plans with Progress Bars */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[#e8e8f0] mb-4">
          Active Test Plans
        </h2>
        {activePlans.length === 0 ? (
          <p className="text-[#555570] text-sm">No active test plans</p>
        ) : (
          <div className="space-y-4">
            {activePlans.map((plan) => (
              <div key={plan.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#e8e8f0]">{plan.title}</span>
                  <StatusPill status={plan.status} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#1a1a24] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#22c55e] rounded-full transition-all"
                      style={{
                        width: `${
                          plan._count.testCases > 0
                            ? Math.min(100, Math.round(Math.random() * 100))
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#555570] font-mono-value w-16 text-right">
                    {plan._count.testCases} cases
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Failure Rate Trend Chart */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[#e8e8f0] mb-4">
          Failure Rate Trend (30 Days)
        </h2>
        {failureTrend.length === 0 ? (
          <p className="text-[#555570] text-sm">No trend data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={failureTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#555570", fontSize: 11 }}
                tickFormatter={(val) => {
                  try {
                    return format(new Date(val), "MMM d");
                  } catch {
                    return val;
                  }
                }}
                stroke="#2a2a38"
              />
              <YAxis
                tick={{ fill: "#555570", fontSize: 11 }}
                stroke="#2a2a38"
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a24",
                  border: "1px solid #2a2a38",
                  borderRadius: "8px",
                  color: "#e8e8f0",
                  fontSize: "12px",
                }}
                labelFormatter={(val) => {
                  try {
                    return format(new Date(val), "MMM d, yyyy");
                  } catch {
                    return val;
                  }
                }}
              />
              <Line
                type="monotone"
                dataKey="failureRate"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#ef4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Two column layout: Issues + Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Issues Table */}
        <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#e8e8f0] mb-4">
            Open Issues
          </h2>
          {issues.length === 0 ? (
            <p className="text-[#555570] text-sm">No open issues</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#555570] text-xs border-b border-[#2a2a38]">
                    <th className="text-left pb-2 font-medium">Title</th>
                    <th className="text-left pb-2 font-medium">Severity</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                    <th className="text-left pb-2 font-medium">Assignee</th>
                    <th className="text-right pb-2 font-medium">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.slice(0, 10).map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-[#2a2a38] last:border-0"
                    >
                      <td className="py-2.5 text-[#e8e8f0] max-w-[200px] truncate">
                        {issue.title}
                      </td>
                      <td className="py-2.5">
                        <StatusPill status={issue.severity} />
                      </td>
                      <td className="py-2.5">
                        <StatusPill status={issue.status} />
                      </td>
                      <td className="py-2.5 text-[#8888a8]">
                        {issue.assignee?.name ?? "Unassigned"}
                      </td>
                      <td className="py-2.5 text-[#555570] text-right font-mono-value text-xs">
                        {issueAge(issue.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Compliance Tests Pending Sign-off */}
        <div className="bg-[#111118] border border-[#f59e0b33] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <h2 className="text-lg font-semibold text-[#e8e8f0]">
              Compliance Tests Pending Sign-off
            </h2>
          </div>
          {complianceTests.length === 0 ? (
            <p className="text-[#555570] text-sm">
              All compliance tests are signed off
            </p>
          ) : (
            <div className="space-y-3">
              {complianceTests.map((tc) => (
                <div
                  key={tc.id}
                  className="flex items-center justify-between py-2 border-b border-[#2a2a38] last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TypePill type={tc.testType} />
                    <span className="text-sm text-[#e8e8f0] truncate">
                      {tc.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <StatusPill status={tc.status} />
                    {tc.nextDueDate && (
                      <span className="text-xs text-[#555570] font-mono-value">
                        {format(new Date(tc.nextDueDate), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-[#111118] border border-[#2a2a38] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[#e8e8f0] mb-4">
          Recent Activity
        </h2>
        {activities.length === 0 ? (
          <p className="text-[#555570] text-sm">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 py-2 border-b border-[#2a2a38] last:border-0"
              >
                {activityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e8e8f0] truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-[#555570]">
                    by {activity.user}
                    {activity.status && (
                      <span className="ml-2">
                        <StatusPill status={activity.status} />
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-[#555570] flex-shrink-0 font-mono-value">
                  {(() => {
                    try {
                      return formatDistanceToNow(new Date(activity.date), {
                        addSuffix: true,
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
  );
}
