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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalActiveTests, passedThisMonth, openIssues, overdueTests] =
      await Promise.all([
        // Active test cases (not CONCLUDED, WAIVED, or DRAFT)
        prisma.testCase.count({
          where: {
            status: {
              notIn: ["CONCLUDED", "WAIVED", "DRAFT"],
            },
          },
        }),

        // Test runs passed this month
        prisma.testRun.count({
          where: {
            status: "PASSED",
            runDate: {
              gte: startOfMonth,
            },
          },
        }),

        // Open issues (OPEN or IN_PROGRESS)
        prisma.issue.count({
          where: {
            status: {
              in: ["OPEN", "IN_PROGRESS"],
            },
          },
        }),

        // Overdue test cases
        prisma.testCase.count({
          where: {
            nextDueDate: {
              lt: now,
            },
            status: {
              not: "CONCLUDED",
            },
          },
        }),
      ]);

    return NextResponse.json({
      totalActiveTests,
      passedThisMonth,
      openIssues,
      overdueTests,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
