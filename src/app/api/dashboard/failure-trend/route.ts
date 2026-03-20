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

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const testRuns = await prisma.testRun.findMany({
      where: {
        runDate: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        runDate: true,
        status: true,
      },
      orderBy: { runDate: "asc" },
    });

    // Group by date
    const dailyMap = new Map<
      string,
      { total: number; passed: number; failed: number }
    >();

    // Initialize all 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(now.getDate() - 29 + i);
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, { total: 0, passed: 0, failed: 0 });
    }

    for (const run of testRuns) {
      const key = run.runDate.toISOString().split("T")[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.total++;
        if (run.status === "PASSED") entry.passed++;
        if (run.status === "FAILED") entry.failed++;
      }
    }

    const trend = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      total: data.total,
      passed: data.passed,
      failed: data.failed,
      failureRate:
        data.total > 0
          ? Math.round((data.failed / data.total) * 100 * 100) / 100
          : 0,
    }));

    return NextResponse.json(trend);
  } catch (error) {
    console.error("Error fetching failure trend:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
