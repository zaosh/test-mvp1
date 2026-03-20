import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createTestRunSchema = z.object({
  testCaseId: z.string().min(1, "Test case ID is required"),
  componentId: z.string().optional(),
  environment: z.string().min(1, "Environment is required"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
  measuredValues: z.any().optional(),
  attachments: z.any().optional(),
  flightData: z.any().optional(),
  weatherData: z.any().optional(),
  location: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const testCaseId = searchParams.get("testCaseId");
    const componentId = searchParams.get("componentId");
    const status = searchParams.get("status");
    const loggedById = searchParams.get("loggedById");
    const environment = searchParams.get("environment");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};
    if (testCaseId) where.testCaseId = testCaseId;
    if (componentId) where.componentId = componentId;
    if (status) where.status = status;
    if (loggedById) where.loggedById = loggedById;
    if (environment) where.environment = environment;
    if (dateFrom || dateTo) {
      where.runDate = {};
      if (dateFrom) where.runDate.gte = new Date(dateFrom);
      if (dateTo) where.runDate.lte = new Date(dateTo);
    }

    const testRuns = await prisma.testRun.findMany({
      where,
      include: {
        testCase: { select: { id: true, title: true, testType: true } },
        component: { select: { id: true, name: true } },
        loggedBy: { select: { id: true, name: true } },
        _count: { select: { issues: true } },
      },
      orderBy: { runDate: "desc" },
    });

    return NextResponse.json(testRuns);
  } catch (error) {
    console.error("Error fetching test runs:", error);
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
    const parsed = createTestRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const testRun = await prisma.testRun.create({
      data: {
        ...parsed.data,
        loggedById: session.user.id,
        runDate: new Date(),
      },
      include: {
        testCase: { select: { id: true, title: true, testType: true } },
        component: { select: { id: true, name: true } },
        loggedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(testRun, { status: 201 });
  } catch (error) {
    console.error("Error creating test run:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
