-- ============================================================================
-- ATTENDANCE TRACKING SYSTEM
-- Migration: Add attendance table, indexes, RLS policies, and helper functions
-- ============================================================================

-- ─── ATTENDANCE TABLE ────────────────────────────────────────────────────
create table public.attendance (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.students(id) on delete cascade,
  subject_id      uuid not null references public.subjects(id) on delete cascade,
  date            date not null,
  status          text not null check (status in ('present', 'absent', 'late', 'excused')),
  marked_by       uuid references public.profiles(id),
  remarks         text,
  college_id      text not null default 'MAIN',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- One record per student per subject per day
  unique(student_id, subject_id, date)
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────
create index idx_attendance_student on public.attendance(student_id);
create index idx_attendance_subject on public.attendance(subject_id);
create index idx_attendance_date on public.attendance(date);
create index idx_attendance_status on public.attendance(status);
create index idx_attendance_subject_date on public.attendance(subject_id, date);
create index idx_attendance_student_subject on public.attendance(student_id, subject_id);

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────────────────
create trigger on_attendance_updated before update on public.attendance
  for each row execute function public.handle_updated_at();

-- ─── ENABLE RLS ──────────────────────────────────────────────────────────
alter table public.attendance enable row level security;

-- ─── RLS POLICIES ────────────────────────────────────────────────────────

-- Students can view own attendance
CREATE POLICY "Students can view own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE profile_id = auth.uid()
    )
    OR public.is_teacher()
    OR public.is_hod()
    OR public.is_principal()
  );

-- Principal can manage all attendance
CREATE POLICY "Principal can manage all attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (public.is_principal());

-- HOD can manage attendance for their department students
CREATE POLICY "HOD can manage department attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (
    public.is_hod() AND
    student_id IN (
      SELECT id FROM public.students
      WHERE department_id = public.get_my_department()
    )
  );

-- Teachers can manage attendance for subjects in their department
CREATE POLICY "Teachers can manage attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (
    public.is_teacher() AND
    subject_id IN (
      SELECT id FROM public.subjects
      WHERE department_id = public.get_my_department()
    )
  );

-- ─── HELPER FUNCTIONS ───────────────────────────────────────────────────

-- Calculate attendance percentage for a student in a subject
CREATE OR REPLACE FUNCTION public.get_attendance_percentage(
  p_student_id uuid,
  p_subject_id uuid
) RETURNS numeric AS $$
  SELECT CASE
    WHEN count(*) = 0 THEN 0
    ELSE round(
      (count(*) FILTER (WHERE status IN ('present', 'late'))::numeric / count(*)::numeric) * 100,
      2
    )
  END
  FROM public.attendance
  WHERE student_id = p_student_id
    AND subject_id = p_subject_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get students below attendance threshold for a subject
CREATE OR REPLACE FUNCTION public.get_low_attendance_students(
  p_subject_id uuid,
  p_threshold numeric DEFAULT 75
) RETURNS TABLE(
  student_id uuid,
  total_classes bigint,
  attended bigint,
  percentage numeric
) AS $$
  SELECT
    a.student_id,
    count(*) as total_classes,
    count(*) FILTER (WHERE a.status IN ('present', 'late')) as attended,
    round(
      (count(*) FILTER (WHERE a.status IN ('present', 'late'))::numeric / count(*)::numeric) * 100,
      2
    ) as percentage
  FROM public.attendance a
  WHERE a.subject_id = p_subject_id
  GROUP BY a.student_id
  HAVING round(
    (count(*) FILTER (WHERE a.status IN ('present', 'late'))::numeric / count(*)::numeric) * 100,
    2
  ) < p_threshold;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON TABLE public.attendance IS 'Tracks student attendance per subject per day';
COMMENT ON FUNCTION public.get_attendance_percentage(uuid, uuid) IS 'Returns attendance percentage for a student in a subject';
COMMENT ON FUNCTION public.get_low_attendance_students(uuid, numeric) IS 'Returns students below attendance threshold';
