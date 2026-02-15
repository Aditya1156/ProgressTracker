-- ============================================================================
-- Seed Teacher Subject Assignments
-- Run this AFTER teachers and subjects exist in the database.
-- This script auto-discovers teachers in CSE dept and assigns them subjects.
-- ============================================================================

-- CSE department ID
DO $$
DECLARE
  cse_dept_id uuid := 'd1000000-0000-0000-0000-000000000001';
  t_rec RECORD;
  s_rec RECORD;
  teacher_count int := 0;
  assignment_count int := 0;
BEGIN

  -- Loop through all CSE teachers (non-HOD)
  FOR t_rec IN
    SELECT t.id AS teacher_id, p.full_name, p.email
    FROM public.teachers t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE t.department_id = cse_dept_id
    ORDER BY p.full_name
  LOOP
    teacher_count := teacher_count + 1;

    -- Assign based on teacher number:
    -- Teacher 1 (first alphabetically): Sem 1 subjects (MA101, PH101, CS101), Sections A & B
    -- Teacher 2: Sem 3 subject (CS201 Data Structures), Sections A & B
    -- Teacher 3: Sem 5 subject (CS301 Database Systems), Sections A & B
    -- Additional teachers: rotate through subjects

    IF teacher_count = 1 THEN
      -- Assign Sem 1 subjects: MA101, PH101, CS101
      FOR s_rec IN
        SELECT id, code, semester FROM public.subjects
        WHERE department_id = cse_dept_id AND semester = 1
      LOOP
        INSERT INTO public.teacher_subject_assignments
          (teacher_id, subject_id, section, semester, academic_year, department_id)
        VALUES
          (t_rec.teacher_id, s_rec.id, 'A', s_rec.semester, '2024-2025', cse_dept_id),
          (t_rec.teacher_id, s_rec.id, 'B', s_rec.semester, '2024-2025', cse_dept_id)
        ON CONFLICT DO NOTHING;
        assignment_count := assignment_count + 2;
      END LOOP;
      RAISE NOTICE 'Teacher 1: % (%) → Sem 1 subjects (A, B)', t_rec.full_name, t_rec.email;

    ELSIF teacher_count = 2 THEN
      -- Assign Sem 3 subject: CS201
      FOR s_rec IN
        SELECT id, code, semester FROM public.subjects
        WHERE department_id = cse_dept_id AND semester = 3
      LOOP
        INSERT INTO public.teacher_subject_assignments
          (teacher_id, subject_id, section, semester, academic_year, department_id)
        VALUES
          (t_rec.teacher_id, s_rec.id, 'A', s_rec.semester, '2024-2025', cse_dept_id),
          (t_rec.teacher_id, s_rec.id, 'B', s_rec.semester, '2024-2025', cse_dept_id)
        ON CONFLICT DO NOTHING;
        assignment_count := assignment_count + 2;
      END LOOP;
      RAISE NOTICE 'Teacher 2: % (%) → Sem 3 subjects (A, B)', t_rec.full_name, t_rec.email;

    ELSIF teacher_count = 3 THEN
      -- Assign Sem 5 subject: CS301
      FOR s_rec IN
        SELECT id, code, semester FROM public.subjects
        WHERE department_id = cse_dept_id AND semester = 5
      LOOP
        INSERT INTO public.teacher_subject_assignments
          (teacher_id, subject_id, section, semester, academic_year, department_id)
        VALUES
          (t_rec.teacher_id, s_rec.id, 'A', s_rec.semester, '2024-2025', cse_dept_id),
          (t_rec.teacher_id, s_rec.id, 'B', s_rec.semester, '2024-2025', cse_dept_id)
        ON CONFLICT DO NOTHING;
        assignment_count := assignment_count + 2;
      END LOOP;
      RAISE NOTICE 'Teacher 3: % (%) → Sem 5 subjects (A, B)', t_rec.full_name, t_rec.email;

    ELSE
      -- Additional teachers: assign Sem 1 Section A only
      FOR s_rec IN
        SELECT id, code, semester FROM public.subjects
        WHERE department_id = cse_dept_id AND semester = 1
        LIMIT 1
      LOOP
        INSERT INTO public.teacher_subject_assignments
          (teacher_id, subject_id, section, semester, academic_year, department_id)
        VALUES
          (t_rec.teacher_id, s_rec.id, 'A', s_rec.semester, '2024-2025', cse_dept_id)
        ON CONFLICT DO NOTHING;
        assignment_count := assignment_count + 1;
      END LOOP;
      RAISE NOTICE 'Teacher %: % (%) → Sem 1 Section A', teacher_count, t_rec.full_name, t_rec.email;
    END IF;

  END LOOP;

  RAISE NOTICE '──────────────────────────────────';
  RAISE NOTICE 'Done! % teachers found, % assignments created.', teacher_count, assignment_count;
  RAISE NOTICE 'Teachers can now see ONLY their assigned subjects and students.';
  RAISE NOTICE 'Use /admin/manage to adjust assignments.';

END $$;
