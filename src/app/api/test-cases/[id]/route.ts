import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateTestCaseSchema = z.object({
  title: z.string().min(1).optional(),
  objective: z.string().min(1).optional(),
  testType: z.string().min(1).optional(),
  parameters: z.any().optional(),
  passCriteria: z.string().min(1).optional(),
  steps: z.any().optional(),
  status: z.string().optional(),
  componentId: z.string().optional().nullable(),
  testPlanId: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  nextDueDate: z.string().datetime().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const testCase = await prisma.testCase.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        component: true,
        testPlan: true,
        parent: { select: { id: true, title: true } },
        forks: {
          select: {
            id: true,
            title: true,
            status: true,
            forkDepth: true,
            forkReason: true,
            isCanonical: true,
            parameters: true,
            owner: { select: { id: true, name: true } },
          },
        },
        githubRef: true,
        testRuns: {
          take: 5,
          orderBy: { runDate: "desc" },
          include: {
            loggedBy: { select: { id: true, name: true } },
          },
        },
        archiveEntries: true,
      },
    });

    if (!testCase) {
      return NextResponse.json(
        { error: "Test case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(testCase);
  } catch (error) {
    console.error("Error fetching test case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isQAOrAdmin = ["QA", "ADMIN"].includes(session.user.role);

    if (!isQAOrAdmin && session.user.role === "ENGINEER") {
      const existing = await prisma.testCase.findUnique({
        where: { id: params.id },
        select: { ownerId: true },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Test case not found" },
          { status: 404 }
        );
      }
      if (existing.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (!isQAOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateTestCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nextDueDate, ...rest } = parsed.data;

    const testCase = await prisma.testCase.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(nextDueDate !== undefined && {
          nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        component: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(testCase);
  } catch (error) {
    console.error("Error updating test case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.testCase.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Test case deleted" });
  } catch (error) {
    console.error("Error deleting test case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
