import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { classifyLearner, detectTrend, predictRisk } from "@/lib/utils";

// GET /api/analytics – full analytics
export async function GET(req: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true } },
        marks: {
          include: { exam: true },
          orderBy: { exam: { date: "asc" } },
        },
      },
    });

    // Build analytics per student
    const analytics = students.map((s) => {
      const totalMarks = s.marks.reduce((sum, m) => sum + m.marksObtained, 0);
      const totalMaxMarks = s.marks.reduce((sum, m) => sum + m.exam.maxMarks, 0);
      const avgPercent = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

      const recentScores = s.marks.slice(-5).map(
        (m) => (m.marksObtained / m.exam.maxMarks) * 100
      );
      const trend = detectTrend(recentScores);
      const classification = classifyLearner(avgPercent);
      const risk = predictRisk(avgPercent, trend.label);

      return {
        studentId: s.id,
        rollNo: s.rollNo,
        name: s.user.name,
        department: s.department,
        batch: s.batch,
        totalMarks,
        totalMaxMarks,
        avgPercent: Math.round(avgPercent * 100) / 100,
        classification,
        trend,
        risk,
        examCount: s.marks.length,
        recentScores,
      };
    });

    // Sort by avgPercent descending for ranking
    analytics.sort((a, b) => b.avgPercent - a.avgPercent);
    analytics.forEach((s, i) => {
      (s as any).rank = i + 1;
    });

    // Summary counts
    const summary = {
      totalStudents: analytics.length,
      fastLearners: analytics.filter((a) => a.classification.label === "Fast Learner").length,
      averageLearners: analytics.filter((a) => a.classification.label === "Average Learner").length,
      slowLearners: analytics.filter((a) => a.classification.label === "Slow Learner").length,
      improving: analytics.filter((a) => a.trend.label === "Improving").length,
      declining: analytics.filter((a) => a.trend.label === "Declining").length,
      atRisk: analytics.filter((a) => a.risk.level === "High Risk" || a.risk.level === "At Risk").length,
    };

    return NextResponse.json({ analytics, summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
