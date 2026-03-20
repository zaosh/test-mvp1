import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateTestPlanSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  milestone: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
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

    const testPlan = await prisma.testPlan.findUnique({
      where: { id: params.id },
      include: {
        testCases: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            component: { select: { id: true, name: true } },
            _count: { select: { testRuns: true } },
          },
        },
        githubRef: true,
        archive: true,
      },
    });

    if (!testPlan) {
      return NextResponse.json(
        { error: "Test plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(testPlan);
  } catch (error) {
    console.error("Error fetching test plan:", error);
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

    if (!["QA", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateTestPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { startDate, targetDate, ...rest } = parsed.data;

    const testPlan = await prisma.testPlan.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(targetDate !== undefined && {
          targetDate: targetDate ? new Date(targetDate) : null,
        }),
      },
      include: {
        githubRef: true,
      },
    });

    return NextResponse.json(testPlan);
  } catch (error) {
    console.error("Error updating test plan:", error);
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

    await prisma.testPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Test plan deleted" });
  } catch (error) {
    console.error("Error deleting test plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
