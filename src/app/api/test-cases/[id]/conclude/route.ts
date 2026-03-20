import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const concludeSchema = z.object({
  concludedNotes: z.string().min(1, "Concluded notes are required"),
  isCanonical: z.boolean().optional(),
});

export async function POST(
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
    const parsed = concludeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { concludedNotes, isCanonical } = parsed.data;

    const testCase = await prisma.testCase.findUnique({
      where: { id: params.id },
      select: { id: true, parentId: true, testPlanId: true },
    });

    if (!testCase) {
      return NextResponse.json(
        { error: "Test case not found" },
        { status: 404 }
      );
    }

    // Update the test case to CONCLUDED
    const updateData: any = {
      status: "CONCLUDED",
      concludedAt: new Date(),
      concludedById: session.user.id,
      concludedNotes,
    };

    if (isCanonical) {
      updateData.isCanonical = true;
    }

    const updated = await prisma.testCase.update({
      where: { id: params.id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    // If isCanonical, set all sibling forks' isCanonical to false
    if (isCanonical && testCase.parentId) {
      await prisma.testCase.updateMany({
        where: {
          parentId: testCase.parentId,
          id: { not: params.id },
        },
        data: { isCanonical: false },
      });
    }

    // Check if all test cases in the test plan are concluded
    if (testCase.testPlanId) {
      const nonConcludedCount = await prisma.testCase.count({
        where: {
          testPlanId: testCase.testPlanId,
          status: { not: "CONCLUDED" },
        },
      });

      if (nonConcludedCount === 0) {
        await prisma.testPlan.update({
          where: { id: testCase.testPlanId },
          data: {
            status: "CONCLUDED",
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error concluding test case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
