-- ============================================================================
-- SEED DATA for College Exam & Academic Intelligence System
-- Run this AFTER schema.sql and AFTER creating auth users via Supabase dashboard
-- ============================================================================

-- ─── DEPARTMENTS ──────────────────────────────────────────────────────────
insert into public.departments (id, name, full_name) values
  ('d1000000-0000-0000-0000-000000000001', 'CSE', 'Computer Science & Engineering'),
  ('d1000000-0000-0000-0000-000000000002', 'ECE', 'Electronics & Communication Engineering'),
  ('d1000000-0000-0000-0000-000000000003', 'ME',  'Mechanical Engineering'),
  ('d1000000-0000-0000-0000-000000000004', 'EE',  'Electrical Engineering');

-- ─── SUBJECTS ─────────────────────────────────────────────────────────────
insert into public.subjects (id, name, code, department_id, semester) values
  ('s1000000-0000-0000-0000-000000000001', 'Mathematics-I',          'MA101', 'd1000000-0000-0000-0000-000000000001', 1),
  ('s1000000-0000-0000-0000-000000000002', 'Physics',                'PH101', 'd1000000-0000-0000-0000-000000000001', 1),
  ('s1000000-0000-0000-0000-000000000003', 'Programming in C',       'CS101', 'd1000000-0000-0000-0000-000000000001', 1),
  ('s1000000-0000-0000-0000-000000000004', 'Data Structures',        'CS201', 'd1000000-0000-0000-0000-000000000001', 3),
  ('s1000000-0000-0000-0000-000000000005', 'Digital Electronics',    'EC201', 'd1000000-0000-0000-0000-000000000002', 3),
  ('s1000000-0000-0000-0000-000000000006', 'Thermodynamics',         'ME201', 'd1000000-0000-0000-0000-000000000003', 3);

-- ============================================================================
-- NOTE: Profiles, students, and teachers are auto-created when users sign up.
-- Use the Supabase dashboard to create users with these emails:
--
-- PRINCIPAL:   principal@college.edu   (role: principal)
-- HOD:         hod.cse@college.edu     (role: hod)
-- TEACHERS:    prof.sharma@college.edu (role: teacher)
--              prof.verma@college.edu  (role: teacher)
-- STUDENTS:    rahul@college.edu       (role: student)
--              priya@college.edu       (role: student)
--              amit@college.edu        (role: student)
--              sneha@college.edu       (role: student)
--              vikram@college.edu      (role: student)
--              anjali@college.edu      (role: student)
--
-- After creating users, run the sections below to link them to
-- students/teachers and add exam/marks data.
-- ============================================================================
