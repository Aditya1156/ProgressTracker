// @ts-check
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Prisma resolves file:./dev.db relative to project root, not prisma/
  const dbPath = path.resolve(__dirname, "..", "dev.db");
  console.log(`📂 Database: ${dbPath}`);
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  console.log("🌱 Seeding database...\n");

  // Clear existing data (order matters for FK)
  db.exec("DELETE FROM Mark");
  db.exec("DELETE FROM Exam");
  db.exec("DELETE FROM Student");
  db.exec("DELETE FROM User");

  const passwordHash = await bcrypt.hash("admin123", 10);
  const studentPasswordHash = await bcrypt.hash("student123", 10);

  // ─── ADMIN USER ──────────────────────────────────────
  const now = new Date().toISOString();
  const insertUser = db.prepare(
    "INSERT INTO User (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const adminId = randomUUID();
  insertUser.run(adminId, "Prof. Sharma", "admin@college.edu", passwordHash, "ADMIN", now, now);
  console.log("✅ Admin created: admin@college.edu / admin123");

  // ─── STUDENTS ────────────────────────────────────────
  const insertStudent = db.prepare(
    "INSERT INTO Student (id, rollNo, department, batch, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const studentsData = [
    { name: "Rahul Kumar", email: "rahul@college.edu", rollNo: "CSE-001", department: "CSE", batch: "2024" },
    { name: "Priya Singh", email: "priya@college.edu", rollNo: "CSE-002", department: "CSE", batch: "2024" },
    { name: "Amit Patel", email: "amit@college.edu", rollNo: "CSE-003", department: "CSE", batch: "2024" },
    { name: "Sneha Gupta", email: "sneha@college.edu", rollNo: "CSE-004", department: "CSE", batch: "2024" },
    { name: "Vikram Reddy", email: "vikram@college.edu", rollNo: "CSE-005", department: "CSE", batch: "2024" },
    { name: "Anjali Verma", email: "anjali@college.edu", rollNo: "ECE-001", department: "ECE", batch: "2024" },
    { name: "Rohan Mehta", email: "rohan@college.edu", rollNo: "ECE-002", department: "ECE", batch: "2024" },
    { name: "Kavita Sharma", email: "kavita@college.edu", rollNo: "ECE-003", department: "ECE", batch: "2024" },
    { name: "Arjun Nair", email: "arjun@college.edu", rollNo: "ME-001", department: "ME", batch: "2025" },
    { name: "Deepika Joshi", email: "deepika@college.edu", rollNo: "ME-002", department: "ME", batch: "2025" },
    { name: "Suresh Yadav", email: "suresh@college.edu", rollNo: "ME-003", department: "ME", batch: "2025" },
    { name: "Neha Agarwal", email: "neha@college.edu", rollNo: "EE-001", department: "EE", batch: "2025" },
    { name: "Kiran Das", email: "kiran@college.edu", rollNo: "EE-002", department: "EE", batch: "2025" },
    { name: "Ravi Prasad", email: "ravi@college.edu", rollNo: "CSE-006", department: "CSE", batch: "2025" },
    { name: "Meera Iyer", email: "meera@college.edu", rollNo: "CSE-007", department: "CSE", batch: "2025" },
  ];

  const studentIds = [];
  const insertStudentTx = db.transaction(() => {
    for (const s of studentsData) {
      const userId = randomUUID();
      const studentId = randomUUID();
      insertUser.run(userId, s.name, s.email, studentPasswordHash, "STUDENT", now, now);
      insertStudent.run(studentId, s.rollNo, s.department, s.batch, userId, now);
      studentIds.push(studentId);
    }
  });
  insertStudentTx();
  console.log(`✅ ${studentsData.length} students created (password: student123)\n`);

  // ─── EXAMS ───────────────────────────────────────────
  const insertExam = db.prepare(
    "INSERT INTO Exam (id, name, type, subject, maxMarks, date) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const examsData = [
    { name: "CT-1 Mathematics", type: "CLASS_TEST", subject: "Mathematics", maxMarks: 50, date: "2025-08-15T00:00:00.000Z" },
    { name: "CT-1 Physics", type: "CLASS_TEST", subject: "Physics", maxMarks: 50, date: "2025-08-20T00:00:00.000Z" },
    { name: "CT-1 Programming", type: "CLASS_TEST", subject: "Programming", maxMarks: 50, date: "2025-08-25T00:00:00.000Z" },
    { name: "Mid Sem Mathematics", type: "MID", subject: "Mathematics", maxMarks: 100, date: "2025-10-10T00:00:00.000Z" },
    { name: "Mid Sem Physics", type: "MID", subject: "Physics", maxMarks: 100, date: "2025-10-15T00:00:00.000Z" },
    { name: "Mid Sem Programming", type: "MID", subject: "Programming", maxMarks: 100, date: "2025-10-20T00:00:00.000Z" },
    { name: "CT-2 Mathematics", type: "CLASS_TEST", subject: "Mathematics", maxMarks: 50, date: "2025-12-01T00:00:00.000Z" },
    { name: "CT-2 Physics", type: "CLASS_TEST", subject: "Physics", maxMarks: 50, date: "2025-12-05T00:00:00.000Z" },
    { name: "End Sem Mathematics", type: "END", subject: "Mathematics", maxMarks: 100, date: "2026-01-15T00:00:00.000Z" },
    { name: "End Sem Physics", type: "END", subject: "Physics", maxMarks: 100, date: "2026-01-20T00:00:00.000Z" },
  ];

  const examIds = [];
  const examMaxMarks = [];
  const insertExamTx = db.transaction(() => {
    for (const e of examsData) {
      const examId = randomUUID();
      insertExam.run(examId, e.name, e.type, e.subject, e.maxMarks, e.date);
      examIds.push(examId);
      examMaxMarks.push(e.maxMarks);
    }
  });
  insertExamTx();
  console.log(`✅ ${examsData.length} exams created\n`);

  // ─── MARKS ───────────────────────────────────────────
  const insertMark = db.prepare(
    "INSERT INTO Mark (id, marksObtained, studentId, examId) VALUES (?, ?, ?, ?)"
  );

  const skillLevels = [0.88, 0.92, 0.65, 0.78, 0.42, 0.70, 0.55, 0.85, 0.38, 0.73, 0.60, 0.45, 0.80, 0.50, 0.90];
  const trendFactors = [0.01, 0.02, -0.02, 0.015, -0.03, 0.01, 0, 0.005, -0.01, 0.02, 0, 0.03, -0.01, -0.02, 0.01];

  let marksCount = 0;
  const insertMarksTx = db.transaction(() => {
    for (let si = 0; si < studentIds.length; si++) {
      const baseSkill = skillLevels[si];
      const trendFactor = trendFactors[si];

      for (let ei = 0; ei < examIds.length; ei++) {
        const adjustedSkill = baseSkill + trendFactor * ei;
        const randomFactor = 0.9 + Math.random() * 0.2;
        let rawScore = Math.round(examMaxMarks[ei] * adjustedSkill * randomFactor);
        rawScore = Math.max(0, Math.min(examMaxMarks[ei], rawScore));

        insertMark.run(randomUUID(), rawScore, studentIds[si], examIds[ei]);
        marksCount++;
      }
    }
  });
  insertMarksTx();

  console.log(`✅ ${marksCount} marks entries created\n`);
  console.log("🎉 Seed complete! You can now login:\n");
  console.log("   Admin:   admin@college.edu   / admin123");
  console.log("   Student: rahul@college.edu   / student123");
  console.log("            (all students use password: student123)\n");

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
