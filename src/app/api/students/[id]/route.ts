import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/students/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        marks: {
          include: { exam: true },
          orderBy: { exam: { date: "asc" } },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Calculate analytics
    const totalMarks = student.marks.reduce((s, m) => s + m.marksObtained, 0);
    const totalMaxMarks = student.marks.reduce((s, m) => s + m.exam.maxMarks, 0);
    const avgPercent = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

    const recentScores = student.marks.slice(-5).map(
      (m) => (m.marksObtained / m.exam.maxMarks) * 100
    );

    return NextResponse.json({ student, analytics: { avgPercent, recentScores, totalMarks, totalMaxMarks } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

// PUT /api/students/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, rollNo, department, batch } = body;

    const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    await prisma.user.update({
      where: { id: student.userId },
      data: { name, email },
    });

    const updated = await prisma.student.update({
      where: { id },
      data: { rollNo, department, batch },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ student: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

// DELETE /api/students/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Deleting user cascades to student and marks
    await prisma.user.delete({ where: { id: student.userId } });

    return NextResponse.json({ message: "Student deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
