import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/exams/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        marks: {
          include: {
            student: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { marksObtained: "desc" },
        },
      },
    });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    return NextResponse.json({ exam });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch exam" }, { status: 500 });
  }
}

// DELETE /api/exams/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ message: "Exam deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
