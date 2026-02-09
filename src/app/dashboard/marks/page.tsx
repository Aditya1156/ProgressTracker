"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle } from "lucide-react";

interface Student {
  id: string;
  rollNo: string;
  user: { name: string };
}

interface Exam {
  id: string;
  name: string;
  subject: string;
  maxMarks: number;
  type: string;
}

export default function MarksEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [examsRes, studentsRes] = await Promise.all([
          fetch("/api/exams"),
          fetch("/api/students?limit=500"),
        ]);
        const examsData = await examsRes.json();
        const studentsData = await studentsRes.json();
        setExams(examsData.exams || []);
        setStudents(studentsData.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") fetchData();
  }, [status]);

  // Load existing marks when exam is selected
  useEffect(() => {
    if (!selectedExam) return;
    async function loadExisting() {
      try {
        const res = await fetch(`/api/exams/${selectedExam}`);
        const data = await res.json();
        const existing: Record<string, string> = {};
        data.exam?.marks?.forEach((m: any) => {
          existing[m.student.id || m.studentId] = String(m.marksObtained);
        });
        setMarksMap(existing);
      } catch (err) {
        console.error(err);
      }
    }
    loadExisting();
  }, [selectedExam]);

  const handleSave = async () => {
    if (!selectedExam) return;
    setError("");
    setSaving(true);
    setSaved(false);

    const exam = exams.find((e) => e.id === selectedExam);
    const marks = Object.entries(marksMap)
      .filter(([, v]) => v !== "" && v !== undefined)
      .map(([studentId, marksObtained]) => ({
        studentId,
        marksObtained: parseInt(marksObtained),
      }));

    if (marks.length === 0) {
      setError("Please enter marks for at least one student");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: selectedExam, marks }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save marks");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const selectedExamData = exams.find((e) => e.id === selectedExam);

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Enter Marks</h1>
        <p className="text-slate-500 mt-1">Select an exam and enter marks for students</p>
      </div>

      {/* Exam selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Exam</label>
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose an exam...</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name} – {exam.subject} ({exam.type.replace("_", " ")}) | Max: {exam.maxMarks}
            </option>
          ))}
        </select>
      </div>

      {/* Marks entry table */}
      {selectedExam && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{selectedExamData?.name}</h3>
              <p className="text-sm text-slate-500">
                {selectedExamData?.subject} | Max Marks: {selectedExamData?.maxMarks}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                  <CheckCircle size={16} /> Saved!
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Marks"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Marks (out of {selectedExamData?.maxMarks})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-slate-900">{s.rollNo}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{s.user.name}</td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={marksMap[s.id] || ""}
                        onChange={(e) =>
                          setMarksMap({ ...marksMap, [s.id]: e.target.value })
                        }
                        className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        min={0}
                        max={selectedExamData?.maxMarks}
                        placeholder="—"
                      />
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                      No students found. Add students first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
