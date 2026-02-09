import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/students – list all students
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const batch = searchParams.get("batch") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (search) {
      where.OR = [
        { rollNo: { contains: search } },
        { user: { name: { contains: search } } },
      ];
    }
    if (department) where.department = department;
    if (batch) where.batch = batch;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          marks: { include: { exam: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rollNo: "asc" },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({ students, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

// POST /api/students – create a new student
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, rollNo, department, batch } = body;

    if (!name || !email || !password || !rollNo || !department || !batch) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const existingRoll = await prisma.student.findUnique({ where: { rollNo } });
    if (existingRoll) {
      return NextResponse.json({ error: "Roll number already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "STUDENT",
        student: {
          create: { rollNo, department, batch },
        },
      },
      include: { student: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
