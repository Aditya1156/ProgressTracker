/**
 * Export utility functions for CSV and data downloads
 */

export function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Convert data to CSV format
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value).replace(/"/g, '""');
          return escaped.includes(",") ? `"${escaped}"` : escaped;
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function formatStudentDataForExport(students: any[]) {
  return students.map((s) => ({
    "Roll No": s.roll_no,
    "Name": s.profiles?.full_name ?? "—",
    "Email": s.profiles?.email ?? "—",
    "Department": s.departments?.name ?? "—",
    "Semester": s.semester,
    "Batch": s.batch,
    "Exams Taken": s.examCount ?? 0,
    "Average (%)": s.avg >= 0 ? s.avg.toFixed(2) : "N/A",
    "Status": s.avg >= 75 ? "Excellent" : s.avg >= 60 ? "Good" : s.avg >= 40 ? "Average" : s.avg >= 0 ? "Needs Improvement" : "No Data",
  }));
}

export function formatTeacherDataForExport(teachers: any[]) {
  return teachers.map((t) => ({
    "Name": t.profiles?.full_name ?? "—",
    "Email": t.profiles?.email ?? "—",
    "Department": t.departments?.full_name ?? "—",
    "Designation": t.designation,
    "Exams Created": t.examsCount ?? 0,
    "Feedback Sent": t.feedbackCount ?? 0,
  }));
}

export function formatExamDataForExport(exams: any[]) {
  return exams.map((e) => ({
    "Exam Name": e.name,
    "Subject": e.subjects?.name ?? "—",
    "Subject Code": e.subjects?.code ?? "—",
    "Department": e.subjects?.departments?.name ?? "—",
    "Type": e.type.replace("_", " "),
    "Max Marks": e.max_marks,
    "Semester": e.subjects?.semester ?? "—",
    "Date": e.exam_date,
    "Marks Entries": e.marksCount ?? 0,
  }));
}

export function formatMarksDataForExport(marks: any[]) {
  return marks.map((m) => ({
    "Roll No": m.students?.roll_no ?? "—",
    "Student Name": m.students?.profiles?.full_name ?? "—",
    "Department": m.students?.departments?.name ?? "—",
    "Semester": m.students?.semester ?? "—",
    "Subject": m.exams?.subjects?.name ?? "—",
    "Subject Code": m.exams?.subjects?.code ?? "—",
    "Exam": m.exams?.name ?? "—",
    "Exam Type": m.exams?.type ?? "—",
    "Marks Obtained": m.marks_obtained,
    "Max Marks": m.exams?.max_marks ?? "—",
    "Percentage": m.exams?.max_marks ? ((m.marks_obtained / m.exams.max_marks) * 100).toFixed(2) : "—",
    "Date": m.exams?.exam_date ?? "—",
  }));
}
