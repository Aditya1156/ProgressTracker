import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/exams – list all exams
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";
    const subject = searchParams.get("subject") || "";

    const where: any = {};
    if (type) where.type = type;
    if (subject) where.subject = { contains: subject };

    const exams = await prisma.exam.findMany({
      where,
      include: { _count: { select: { marks: true } } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}

// POST /api/exams – create a new exam
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, subject, maxMarks, date } = body;

    if (!name || !type || !subject || !maxMarks || !date) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        name,
        type,
        subject,
        maxMarks: parseInt(maxMarks),
        date: new Date(date),
      },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
