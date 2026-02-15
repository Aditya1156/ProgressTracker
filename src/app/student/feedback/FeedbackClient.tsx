"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { MessageSquare, CheckCheck } from "lucide-react";

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  subjects: { name: string; code: string } | null;
  teachers: { profiles: { full_name: string } | null } | null;
}

interface FeedbackClientProps {
  feedback: FeedbackItem[];
}

const typeColors: Record<string, string> = {
  appreciation: "bg-emerald-50 text-emerald-700",
  improvement: "bg-blue-50 text-blue-700",
  concern: "bg-red-50 text-red-700",
  general: "bg-gray-50 text-gray-700",
};

export default function FeedbackClient({ feedback }: FeedbackClientProps) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    feedback.forEach((fb) => {
      if (fb.subjects?.code) set.add(fb.subjects.code);
    });
    return Array.from(set).sort();
  }, [feedback]);

  const filtered = useMemo(() => {
    return feedback.filter((fb) => {
      if (typeFilter !== "all" && fb.type !== typeFilter) return false;
      if (subjectFilter !== "all" && fb.subjects?.code !== subjectFilter) return false;
      return true;
    });
  }, [feedback, typeFilter, subjectFilter]);

  const unreadCount = useMemo(() => {
    return feedback.filter((fb) => !fb.is_read && !readIds.has(fb.id)).length;
  }, [feedback, readIds]);

  async function markAsRead(ids: string[]) {
    try {
      await fetch("/api/feedback/unread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackIds: ids }),
      });
      setReadIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    } catch {
      // silently fail
    }
  }

  async function handleMarkAllRead() {
    const unreadIds = feedback
      .filter((fb) => !fb.is_read && !readIds.has(fb.id))
      .map((fb) => fb.id);
    if (unreadIds.length === 0) return;
    setMarkingAll(true);
    await markAsRead(unreadIds);
    setMarkingAll(false);
  }

  function isUnread(fb: FeedbackItem) {
    return !fb.is_read && !readIds.has(fb.id);
  }

  if (feedback.length === 0) {
    return (
      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="py-12 text-center text-gray-400">
          <MessageSquare className="h-8 w-8 mx-auto mb-3 text-gray-400/50" />
          <p>No feedback yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters + Mark all */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="appreciation">Appreciation</SelectItem>
            <SelectItem value="improvement">Improvement</SelectItem>
            <SelectItem value="concern">Concern</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="ml-auto text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
            Mark all read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Feedback Cards */}
      {filtered.length === 0 ? (
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-8 text-center text-gray-400 text-sm">
            No feedback matches the selected filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb) => {
            const teacher = fb.teachers as any;
            const subject = fb.subjects as any;
            const unread = isUnread(fb);
            return (
              <Card
                key={fb.id}
                className={`border-gray-200/80 shadow-sm transition-colors ${
                  unread ? "border-l-[3px] border-l-[#0f1b4c]" : ""
                }`}
                onClick={() => {
                  if (unread) markAsRead([fb.id]);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {unread && (
                        <div className="h-2 w-2 rounded-full bg-[#0f1b4c] shrink-0" />
                      )}
                      <Badge
                        variant="secondary"
                        className={`text-xs border-0 ${
                          typeColors[fb.type] ?? typeColors.general
                        }`}
                      >
                        {fb.type.charAt(0).toUpperCase() + fb.type.slice(1)}
                      </Badge>
                      {subject && (
                        <span className="text-xs text-gray-400">
                          {subject.code}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(fb.created_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {fb.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    — {teacher?.profiles?.full_name ?? "Teacher"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
