import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const forkSchema = z.object({
  forkReason: z.string().min(1, "Fork reason is required"),
  overrideParameters: z.record(z.string(), z.any()).optional(),
  overrideTitle: z.string().optional(),
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
    const parsed = forkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { forkReason, overrideParameters, overrideTitle } = parsed.data;

    const parent = await prisma.testCase.findUnique({
      where: { id: params.id },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent test case not found" },
        { status: 404 }
      );
    }

    const mergedParameters = overrideParameters
      ? { ...(parent.parameters as Record<string, any>), ...overrideParameters }
      : parent.parameters;

    const title =
      overrideTitle || `${parent.title} (Fork: ${forkReason})`;

    const fork = await prisma.testCase.create({
      data: {
        title,
        objective: parent.objective,
        testType: parent.testType,
        parameters: mergedParameters,
        passCriteria: parent.passCriteria,
        steps: parent.steps,
        componentId: parent.componentId,
        testPlanId: parent.testPlanId,
        frequency: parent.frequency,
        parentId: parent.id,
        forkDepth: parent.forkDepth + 1,
        forkReason,
        status: "DRAFT",
        ownerId: session.user.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, title: true } },
        component: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(fork, { status: 201 });
  } catch (error) {
    console.error("Error forking test case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
