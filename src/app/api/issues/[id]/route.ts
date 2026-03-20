import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  resolutionNotes: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  deferredTo: z.string().optional().nullable(),
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

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        testRun: {
          include: {
            testCase: true,
          },
        },
        component: true,
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching issue:", error);
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
      const existing = await prisma.issue.findUnique({
        where: { id: params.id },
        select: { assigneeId: true },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Issue not found" },
          { status: 404 }
        );
      }
      if (existing.assigneeId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (!isQAOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, ...rest } = parsed.data;

    const updateData: any = { ...rest };
    if (status) {
      updateData.status = status;
      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date();
      }
    }

    const issue = await prisma.issue.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
