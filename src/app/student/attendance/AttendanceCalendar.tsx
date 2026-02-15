"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getStatusConfig } from "@/lib/attendance";
import type { AttendanceStatus } from "@/lib/attendance";

interface AttendanceRecord {
  date: string;
  status: string;
  subjectCode: string;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  subjects: Array<{ code: string; name: string }>;
}

export function AttendanceCalendar({
  records,
  subjects,
}: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterSubject, setFilterSubject] = useState("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const filteredRecords = useMemo(() => {
    if (filterSubject === "all") return records;
    return records.filter((r) => r.subjectCode === filterSubject);
  }, [records, filterSubject]);

  // Group records by date
  const dateMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const r of filteredRecords) {
      const arr = map.get(r.date) ?? [];
      arr.push(r);
      map.set(r.date, arr);
    }
    return map;
  }, [filteredRecords]);

  // Calendar grid calculation
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    const now = new Date();
    const next = new Date(year, month + 1, 1);
    if (next <= new Date(now.getFullYear(), now.getMonth() + 1, 1)) {
      setCurrentDate(next);
    }
  }

  function getDateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Attendance Calendar</CardTitle>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {monthNames[month]} {year}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d) => (
            <div
              key={d}
              className="text-center text-xs text-gray-400 font-medium py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="h-10" />;
            }

            const dateStr = getDateStr(day);
            const dayRecords = dateMap.get(dateStr) ?? [];
            const isToday =
              dateStr === new Date().toISOString().split("T")[0];

            return (
              <div
                key={dateStr}
                className={`
                  h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs transition-colors
                  ${isToday ? "ring-1 ring-[#0f1b4c]/30 bg-[#0f1b4c]/5" : ""}
                  ${dayRecords.length > 0 ? "bg-gray-50" : ""}
                `}
              >
                <span
                  className={`text-xs ${isToday ? "font-semibold text-[#0f1b4c]" : "text-gray-400"}`}
                >
                  {day}
                </span>
                {dayRecords.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayRecords.slice(0, 4).map((r, j) => {
                      const config = getStatusConfig(
                        r.status as AttendanceStatus
                      );
                      return (
                        <span
                          key={j}
                          className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}
                          title={`${r.subjectCode}: ${config.label}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-200/80">
          {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map(
            (status) => {
              const config = getStatusConfig(status);
              return (
                <div key={status} className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${config.dotColor}`}
                  />
                  <span className="text-xs text-gray-400">
                    {config.label}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </CardContent>
    </Card>
  );
}
