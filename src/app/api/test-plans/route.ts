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

const createTestPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  milestone: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  targetDate: z.string().datetime().optional(),
  githubRef: githubRefSchema.optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const testPlans = await prisma.testPlan.findMany({
      where,
      include: {
        _count: {
          select: { testCases: true },
        },
        githubRef: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(testPlans);
  } catch (error) {
    console.error("Error fetching test plans:", error);
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
    const parsed = createTestPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { githubRef, startDate, targetDate, ...planData } = parsed.data;

    const testPlan = await prisma.testPlan.create({
      data: {
        ...planData,
        startDate: startDate ? new Date(startDate) : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        ...(githubRef && {
          githubRef: {
            create: githubRef,
          },
        }),
      },
      include: {
        githubRef: true,
      },
    });

    return NextResponse.json(testPlan, { status: 201 });
  } catch (error) {
    console.error("Error creating test plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
