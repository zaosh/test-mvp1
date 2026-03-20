import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  severity: z.string().min(1, "Severity is required"),
  testRunId: z.string().optional(),
  componentId: z.string().optional(),
  assigneeId: z.string().optional(),
});

const severityOrder: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const componentId = searchParams.get("componentId");
    const testRunId = searchParams.get("testRunId");

    const where: Record<string, any> = {};
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (componentId) where.componentId = componentId;
    if (testRunId) where.testRunId = testRunId;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        testRun: {
          select: {
            id: true,
            testCase: { select: { title: true } },
          },
        },
        component: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    // Sort by severity priority (CRITICAL first), then by createdAt desc
    issues.sort((a: any, b: any) => {
      const sevA = severityOrder[a.severity] ?? 99;
      const sevB = severityOrder[b.severity] ?? 99;
      if (sevA !== sevB) return sevA - sevB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["QA", "ADMIN", "ENGINEER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.create({
      data: {
        ...parsed.data,
        createdById: session.user.id,
      },
      include: {
        testRun: {
          select: {
            id: true,
            testCase: { select: { title: true } },
          },
        },
        component: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
