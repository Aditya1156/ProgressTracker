"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface Mark {
  id: string;
  marksObtained: number;
  exam: {
    id: string;
    name: string;
    subject: string;
    maxMarks: number;
    date: string;
    type: string;
  };
}

export default function StudentResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const studentId = (session?.user as any)?.studentId;
        if (!studentId) return;
        const res = await fetch(`/api/students/${studentId}`);
        const data = await res.json();
        setMarks(data.student?.marks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") fetchData();
  }, [status, session]);

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    CLASS_TEST: "bg-blue-100 text-blue-700",
    MID: "bg-purple-100 text-purple-700",
    END: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Results</h1>
        <p className="text-slate-500 mt-1">View all your exam results</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {marks.map((m) => {
                const pct = Math.round((m.marksObtained / m.exam.maxMarks) * 100);
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{m.exam.name}</td>
                    <td className="px-6 py-4 text-slate-600">{m.exam.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[m.exam.type] || "bg-gray-100"}`}>
                        {m.exam.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(m.exam.date)}</td>
                    <td className="px-6 py-4 font-semibold">{m.marksObtained}/{m.exam.maxMarks}</td>
                    <td className="px-6 py-4 font-semibold">{pct}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        pct >= 75 ? "bg-green-100 text-green-700" :
                        pct >= 50 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {pct >= 75 ? "Excellent" : pct >= 50 ? "Average" : "Needs Work"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {marks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No exam results yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
