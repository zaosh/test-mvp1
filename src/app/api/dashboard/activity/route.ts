import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "QA", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch recent test runs, issues, and archives in parallel
    const [recentTestRuns, recentIssues, recentArchives] = await Promise.all([
      prisma.testRun.findMany({
        take: 10,
        orderBy: { runDate: "desc" },
        include: {
          testCase: { select: { title: true } },
          loggedBy: { select: { name: true } },
        },
      }),
      prisma.issue.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
        },
      }),
      prisma.archive.findMany({
        take: 10,
        orderBy: { archivedAt: "desc" },
        include: {
          archivedBy: { select: { name: true } },
        },
      }),
    ]);

    // Merge into a unified activity list
    const activities: Array<{
      type: "test_run" | "issue" | "archive";
      title: string;
      user: string;
      date: Date;
      status?: string;
    }> = [];

    for (const run of recentTestRuns) {
      activities.push({
        type: "test_run",
        title: run.testCase?.title || `Test Run ${run.id}`,
        user: run.loggedBy?.name || "Unknown",
        date: run.runDate,
        status: run.status,
      });
    }

    for (const issue of recentIssues) {
      activities.push({
        type: "issue",
        title: issue.title,
        user: issue.createdBy?.name || "Unknown",
        date: issue.createdAt,
        status: issue.status,
      });
    }

    for (const archive of recentArchives) {
      activities.push({
        type: "archive",
        title: archive.title,
        user: archive.archivedBy?.name || "Unknown",
        date: archive.archivedAt,
      });
    }

    // Sort by date descending and take top 10
    activities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(activities.slice(0, 10));
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
