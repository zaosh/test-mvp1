import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const archive = await prisma.archive.findUnique({
      where: { id: params.id },
      include: {
        testPlan: true,
        archivedBy: { select: { id: true, name: true, email: true } },
        testCases: {
          include: {
            testCase: {
              include: {
                owner: { select: { id: true, name: true } },
                component: { select: { id: true, name: true } },
                _count: { select: { testRuns: true } },
              },
            },
          },
        },
      },
    });

    if (!archive) {
      return NextResponse.json(
        { error: "Archive not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(archive);
  } catch (error) {
    console.error("Error fetching archive:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
