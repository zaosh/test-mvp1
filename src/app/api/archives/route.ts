import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createArchiveSchema = z.object({
  testPlanId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  outcome: z.string().min(1, "Outcome is required"),
  summary: z.string().min(1, "Summary is required"),
  findings: z.array(z.any()),
  tags: z.array(z.string()).default([]),
  githubRef: z.string().optional(),
  releaseTag: z.string().optional(),
  attachments: z.any().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const outcome = searchParams.get("outcome");
    const tag = searchParams.get("tag");

    const where: any = {};
    if (search) {
      where.searchIndex = { contains: search, mode: "insensitive" };
    }
    if (category) where.category = category;
    if (outcome) where.outcome = outcome;
    if (tag) {
      where.tags = { has: tag };
    }

    const archives = await prisma.archive.findMany({
      where,
      include: {
        archivedBy: { select: { id: true, name: true } },
        testPlan: { select: { id: true, title: true } },
        _count: { select: { testCases: true } },
      },
      orderBy: { archivedAt: "desc" },
    });

    return NextResponse.json(archives);
  } catch (error) {
    console.error("Error fetching archives:", error);
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
    const parsed = createArchiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { testPlanId, title, category, outcome, summary, findings, tags, githubRef, releaseTag, attachments } = parsed.data;

    // Build searchIndex
    const findingDescriptions = findings
      .map((f: any) => f.description || "")
      .join(" ");
    const searchIndex = [title, summary, findingDescriptions]
      .filter(Boolean)
      .join(" ");

    const archiveData: any = {
      title,
      category,
      outcome,
      summary,
      findings,
      tags,
      githubRef,
      releaseTag,
      attachments,
      searchIndex,
      archivedById: session.user.id,
      archivedAt: new Date(),
    };

    if (testPlanId) {
      archiveData.testPlanId = testPlanId;

      // Collect all test cases in the plan (including forks)
      const planTestCases = await prisma.testCase.findMany({
        where: { testPlanId },
        select: { id: true },
      });

      const archive = await prisma.archive.create({
        data: {
          ...archiveData,
          testCases: {
            create: planTestCases.map((tc: { id: string }) => ({
              testCaseId: tc.id,
            })),
          },
        },
        include: {
          archivedBy: { select: { id: true, name: true } },
          testPlan: { select: { id: true, title: true } },
          _count: { select: { testCases: true } },
        },
      });

      // Set plan status to CONCLUDED
      await prisma.testPlan.update({
        where: { id: testPlanId },
        data: { status: "CONCLUDED" },
      });

      return NextResponse.json(archive, { status: 201 });
    }

    const archive = await prisma.archive.create({
      data: archiveData,
      include: {
        archivedBy: { select: { id: true, name: true } },
        testPlan: { select: { id: true, title: true } },
        _count: { select: { testCases: true } },
      },
    });

    return NextResponse.json(archive, { status: 201 });
  } catch (error) {
    console.error("Error creating archive:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
