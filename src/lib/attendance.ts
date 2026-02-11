/**
 * Attendance utility functions
 */

export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type AttendanceCategory = "Good" | "Warning" | "Critical";

export const ATTENDANCE_THRESHOLD = 75;

export const VALID_ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
] as const;

/**
 * Classify attendance percentage into categories
 */
export function classifyAttendance(percentage: number): {
  label: AttendanceCategory;
  color: string;
  bgColor: string;
} {
  if (percentage >= 85)
    return { label: "Good", color: "text-emerald-700", bgColor: "bg-emerald-50" };
  if (percentage >= 75)
    return { label: "Warning", color: "text-amber-700", bgColor: "bg-amber-50" };
  return { label: "Critical", color: "text-red-700", bgColor: "bg-red-50" };
}

/**
 * Get attendance status display config
 */
export function getStatusConfig(status: AttendanceStatus): {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  dotColor: string;
} {
  switch (status) {
    case "present":
      return {
        label: "Present",
        shortLabel: "P",
        color: "text-emerald-700",
        bgColor: "bg-emerald-500/10",
        dotColor: "bg-emerald-500",
      };
    case "absent":
      return {
        label: "Absent",
        shortLabel: "A",
        color: "text-red-700",
        bgColor: "bg-red-500/10",
        dotColor: "bg-red-500",
      };
    case "late":
      return {
        label: "Late",
        shortLabel: "L",
        color: "text-amber-700",
        bgColor: "bg-amber-500/10",
        dotColor: "bg-amber-500",
      };
    case "excused":
      return {
        label: "Excused",
        shortLabel: "E",
        color: "text-blue-700",
        bgColor: "bg-blue-500/10",
        dotColor: "bg-blue-500",
      };
  }
}

/**
 * Calculate attendance percentage from records
 * late counts as attended
 */
export function calculateAttendancePercentage(
  records: Array<{ status: string }>
): number {
  if (records.length === 0) return 0;
  const attended = records.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  return (attended / records.length) * 100;
}

/**
 * Get count by status from attendance records
 */
export function getStatusCounts(
  records: Array<{ status: string }>
): Record<AttendanceStatus, number> {
  return {
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    late: records.filter((r) => r.status === "late").length,
    excused: records.filter((r) => r.status === "excused").length,
  };
}

/**
 * Check if attendance status is valid
 */
export function isValidAttendanceStatus(
  value: string | null | undefined
): value is AttendanceStatus {
  if (!value) return false;
  return VALID_ATTENDANCE_STATUSES.includes(value as AttendanceStatus);
}
