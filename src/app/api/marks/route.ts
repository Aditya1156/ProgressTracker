import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/marks – enter marks (batch or single)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, marks } = body;
    // marks = [{ studentId, marksObtained }, ...]

    if (!examId || !marks || !Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json({ error: "examId and marks array are required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Validate marks don't exceed max
    for (const m of marks) {
      if (m.marksObtained > exam.maxMarks || m.marksObtained < 0) {
        return NextResponse.json(
          { error: `Marks must be between 0 and ${exam.maxMarks}` },
          { status: 400 }
        );
      }
    }

    // Upsert marks (create or update)
    const results = await Promise.all(
      marks.map((m: { studentId: string; marksObtained: number }) =>
        prisma.mark.upsert({
          where: {
            studentId_examId: { studentId: m.studentId, examId },
          },
          create: {
            studentId: m.studentId,
            examId,
            marksObtained: m.marksObtained,
          },
          update: {
            marksObtained: m.marksObtained,
          },
        })
      )
    );

    return NextResponse.json({ marks: results }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save marks" }, { status: 500 });
  }
}
