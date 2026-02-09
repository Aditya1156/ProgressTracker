"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Exam {
  id: string;
  name: string;
  type: string;
  subject: string;
  maxMarks: number;
  date: string;
  _count: { marks: number };
}

export default function ExamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "CLASS_TEST",
    subject: "",
    maxMarks: "100",
    date: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      setExams(data.exams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchExams();
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "Failed to create exam");
      return;
    }

    setForm({ name: "", type: "CLASS_TEST", subject: "", maxMarks: "100", date: "" });
    setShowForm(false);
    fetchExams();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam and all associated marks?")) return;
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
    fetchExams();
  };

  const typeColors: Record<string, string> = {
    CLASS_TEST: "bg-blue-100 text-blue-700",
    MID: "bg-purple-100 text-purple-700",
    END: "bg-orange-100 text-orange-700",
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Exams</h1>
          <p className="text-slate-500 mt-1">Manage exams and class tests</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Create Exam
        </button>
      </div>

      {/* Create Exam Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold">Create New Exam</h3>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              placeholder="Exam Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CLASS_TEST">Class Test</option>
              <option value="MID">Mid Semester</option>
              <option value="END">End Semester</option>
            </select>
            <input
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Max Marks"
              value={form.maxMarks}
              onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
              className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
              min={1}
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Exam
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Exams Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{exam.name}</h3>
                <p className="text-slate-500 mt-0.5">{exam.subject}</p>
              </div>
              <button
                onClick={() => handleDelete(exam.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Type</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[exam.type] || "bg-gray-100 text-gray-700"}`}>
                  {exam.type.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Max Marks</span>
                <span className="font-medium">{exam.maxMarks}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Calendar size={14} />
                  {formatDate(exam.date)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Marks Entered</span>
                <span className="font-medium text-blue-600">{exam._count.marks} students</span>
              </div>
            </div>
          </div>
        ))}
        {exams.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            No exams yet. Click &quot;Create Exam&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
}
