import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateTestRunSchema = z.object({
  environment: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  measuredValues: z.any().optional(),
  attachments: z.any().optional(),
  flightData: z.any().optional(),
  weatherData: z.any().optional(),
  location: z.string().optional().nullable(),
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

    const testRun = await prisma.testRun.findUnique({
      where: { id: params.id },
      include: {
        testCase: true,
        component: true,
        loggedBy: { select: { id: true, name: true, email: true } },
        issues: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!testRun) {
      return NextResponse.json(
        { error: "Test run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(testRun);
  } catch (error) {
    console.error("Error fetching test run:", error);
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
      const existing = await prisma.testRun.findUnique({
        where: { id: params.id },
        select: { loggedById: true },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Test run not found" },
          { status: 404 }
        );
      }
      if (existing.loggedById !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (!isQAOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateTestRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const testRun = await prisma.testRun.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        testCase: { select: { id: true, title: true, testType: true } },
        component: { select: { id: true, name: true } },
        loggedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(testRun);
  } catch (error) {
    console.error("Error updating test run:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
