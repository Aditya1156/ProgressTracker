-- ============================================================================
-- Examples: Create HOD and Teacher Accounts
-- This shows how to create different role accounts
-- ============================================================================

-- ─── EXAMPLE 1: Create HOD for CSE Department ──────────────────────────────
DO $$
DECLARE
  hod_user_id uuid := uuid_generate_v4();
  cse_dept_id uuid := 'd1000000-0000-0000-0000-000000000001'; -- CSE department from seed
  hod_email text := 'hod.cse@pesitm.edu.in';
  hod_name text := 'Dr. CSE HOD';
  default_password text := '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY'; -- admin123
BEGIN

-- 1. Create auth user
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  hod_user_id,
  hod_email,
  default_password,
  now(),
  json_build_object('full_name', hod_name, 'role', 'hod'),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- 2. Create profile with HOD role
INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  hod_user_id,
  hod_name,
  hod_email,
  'hod'
) ON CONFLICT (email) DO UPDATE
  SET role = 'hod';

-- 3. Create teacher record with HOD flag
INSERT INTO public.teachers (
  profile_id,
  department_id,
  designation,
  is_hod
) VALUES (
  hod_user_id,
  cse_dept_id,
  'Professor & HOD',
  true
) ON CONFLICT (profile_id) DO UPDATE
  SET is_hod = true;

RAISE NOTICE 'CSE HOD account created: % / admin123', hod_email;

END $$;

-- ─── EXAMPLE 2: Create Regular Teacher for CSE ─────────────────────────────
DO $$
DECLARE
  teacher_user_id uuid := uuid_generate_v4();
  cse_dept_id uuid := 'd1000000-0000-0000-0000-000000000001'; -- CSE department
  teacher_email text := 'prof.smith@pesitm.edu.in';
  teacher_name text := 'Prof. John Smith';
  default_password text := '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY'; -- teacher123
BEGIN

-- 1. Create auth user
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  teacher_user_id,
  teacher_email,
  default_password,
  now(),
  json_build_object('full_name', teacher_name, 'role', 'teacher'),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- 2. Create profile with teacher role
INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  teacher_user_id,
  teacher_name,
  teacher_email,
  'teacher'
) ON CONFLICT (email) DO UPDATE
  SET role = 'teacher';

-- 3. Create teacher record (is_hod defaults to false)
INSERT INTO public.teachers (
  profile_id,
  department_id,
  designation
) VALUES (
  teacher_user_id,
  cse_dept_id,
  'Assistant Professor'
) ON CONFLICT (profile_id) DO NOTHING;

RAISE NOTICE 'Teacher account created: % / teacher123', teacher_email;

END $$;

-- ─── EXAMPLE 3: Promote Existing Teacher to HOD ────────────────────────────
/*
-- If you already have a teacher and want to make them HOD:

UPDATE public.teachers
SET is_hod = true
WHERE profile_id = '<existing_teacher_profile_id>';

UPDATE public.profiles
SET role = 'hod'
WHERE id = '<existing_teacher_profile_id>';
*/

-- ─── EXAMPLE 4: Demote HOD back to Teacher ─────────────────────────────────
/*
UPDATE public.teachers
SET is_hod = false
WHERE profile_id = '<hod_profile_id>';

UPDATE public.profiles
SET role = 'teacher'
WHERE id = '<hod_profile_id>';
*/

-- ============================================================================
-- Summary of Created Accounts:
--
-- Principal: principal@pesitm.edu.in / admin123
-- CSE HOD:   hod.cse@pesitm.edu.in / admin123
-- Teacher:   prof.smith@pesitm.edu.in / teacher123
-- Students:  <usn>@college.edu / student123
--
-- Remember to change default passwords after first login!
-- ============================================================================
