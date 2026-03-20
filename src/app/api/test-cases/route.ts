import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const githubRefSchema = z.object({
  repoUrl: z.string().url(),
  commitSha: z.string().optional(),
  prNumber: z.number().int().optional(),
  releaseTag: z.string().optional(),
  branchName: z.string().optional(),
});

const createTestCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  objective: z.string().min(1, "Objective is required"),
  testType: z.string().min(1, "Test type is required"),
  parameters: z.any(),
  passCriteria: z.string().min(1, "Pass criteria is required"),
  steps: z.any(),
  componentId: z.string().optional(),
  testPlanId: z.string().optional(),
  frequency: z.string().optional(),
  nextDueDate: z.string().datetime().optional(),
  githubRef: githubRefSchema.optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const componentId = searchParams.get("componentId");
    const ownerId = searchParams.get("ownerId");
    const testPlanId = searchParams.get("testPlanId");
    const hasForksOnly = searchParams.get("hasForksOnly");

    const where: any = {};
    if (type) where.testType = type;
    if (status) where.status = status;
    if (componentId) where.componentId = componentId;
    if (ownerId) where.ownerId = ownerId;
    if (testPlanId) where.testPlanId = testPlanId;
    if (hasForksOnly === "true") {
      where.forks = { some: {} };
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        component: { select: { id: true, name: true } },
        _count: { select: { testRuns: true, forks: true } },
        parent: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(testCases);
  } catch (error) {
    console.error("Error fetching test cases:", error);
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

    if (!["QA", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createTestCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { githubRef, nextDueDate, ...caseData } = parsed.data;

    const testCase = await prisma.testCase.create({
      data: {
        ...caseData,
        ownerId: session.user.id,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
        ...(githubRef && {
          githubRef: {
            create: githubRef,
          },
        }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        component: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    console.error("Error creating test case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
