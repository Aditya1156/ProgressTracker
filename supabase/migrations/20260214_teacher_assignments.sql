-- ============================================================================
-- TEACHER SUBJECT ASSIGNMENTS
-- Maps teachers to specific subjects + sections
-- ============================================================================

CREATE TABLE public.teacher_subject_assignments (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id      uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id      uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  section         text NOT NULL CHECK (section ~ '^[A-Z]$'),
  semester        int NOT NULL,
  academic_year   text NOT NULL DEFAULT '2024-2025',
  department_id   uuid NOT NULL REFERENCES public.departments(id),
  college_id      text NOT NULL DEFAULT 'MAIN',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_id, section, semester, academic_year)
);

-- Indexes
CREATE INDEX idx_tsa_teacher ON public.teacher_subject_assignments(teacher_id);
CREATE INDEX idx_tsa_subject ON public.teacher_subject_assignments(subject_id);
CREATE INDEX idx_tsa_dept    ON public.teacher_subject_assignments(department_id);

-- Updated_at trigger (reuses existing function)
CREATE TRIGGER on_tsa_updated BEFORE UPDATE ON public.teacher_subject_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments viewable by authenticated"
  ON public.teacher_subject_assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage assignments"
  ON public.teacher_subject_assignments FOR ALL TO authenticated USING (public.is_admin());
