-- ============================================================================
-- Create HODs for All Departments
-- Creates HOD accounts for CSE, ECE, ME, and EE departments
-- ============================================================================

DO $$
DECLARE
  default_password text := '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY'; -- admin123

  -- Department IDs from seed data
  cse_dept_id uuid := 'd1000000-0000-0000-0000-000000000001';
  ece_dept_id uuid := 'd1000000-0000-0000-0000-000000000002';
  me_dept_id  uuid := 'd1000000-0000-0000-0000-000000000003';
  ee_dept_id  uuid := 'd1000000-0000-0000-0000-000000000004';

  -- HOD user IDs
  cse_hod_id uuid := uuid_generate_v4();
  ece_hod_id uuid := uuid_generate_v4();
  me_hod_id  uuid := uuid_generate_v4();
  ee_hod_id  uuid := uuid_generate_v4();
BEGIN

-- ─── CSE HOD ───────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  cse_hod_id,
  'hod.cse@pesitm.edu.in',
  default_password,
  now(),
  json_build_object('full_name', 'Dr. Ramesh Kumar (CSE HOD)', 'role', 'hod'),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  cse_hod_id,
  'Dr. Ramesh Kumar (CSE HOD)',
  'hod.cse@pesitm.edu.in',
  'hod'
) ON CONFLICT (email) DO UPDATE SET role = 'hod';

INSERT INTO public.teachers (profile_id, department_id, designation, is_hod)
VALUES (cse_hod_id, cse_dept_id, 'Professor & HOD', true)
ON CONFLICT (profile_id) DO UPDATE SET is_hod = true;

-- ─── ECE HOD ───────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  ece_hod_id,
  'hod.ece@pesitm.edu.in',
  default_password,
  now(),
  json_build_object('full_name', 'Dr. Priya Sharma (ECE HOD)', 'role', 'hod'),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  ece_hod_id,
  'Dr. Priya Sharma (ECE HOD)',
  'hod.ece@pesitm.edu.in',
  'hod'
) ON CONFLICT (email) DO UPDATE SET role = 'hod';

INSERT INTO public.teachers (profile_id, department_id, designation, is_hod)
VALUES (ece_hod_id, ece_dept_id, 'Professor & HOD', true)
ON CONFLICT (profile_id) DO UPDATE SET is_hod = true;

-- ─── ME HOD ────────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  me_hod_id,
  'hod.me@pesitm.edu.in',
  default_password,
  now(),
  json_build_object('full_name', 'Dr. Suresh Patil (ME HOD)', 'role', 'hod'),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  me_hod_id,
  'Dr. Suresh Patil (ME HOD)',
  'hod.me@pesitm.edu.in',
  'hod'
) ON CONFLICT (email) DO UPDATE SET role = 'hod';

INSERT INTO public.teachers (profile_id, department_id, designation, is_hod)
VALUES (me_hod_id, me_dept_id, 'Professor & HOD', true)
ON CONFLICT (profile_id) DO UPDATE SET is_hod = true;

-- ─── EE HOD ────────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  ee_hod_id,
  'hod.ee@pesitm.edu.in',
  default_password,
  now(),
  json_build_object('full_name', 'Dr. Vijay Desai (EE HOD)', 'role', 'hod'),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  ee_hod_id,
  'Dr. Vijay Desai (EE HOD)',
  'hod.ee@pesitm.edu.in',
  'hod'
) ON CONFLICT (email) DO UPDATE SET role = 'hod';

INSERT INTO public.teachers (profile_id, department_id, designation, is_hod)
VALUES (ee_hod_id, ee_dept_id, 'Professor & HOD', true)
ON CONFLICT (profile_id) DO UPDATE SET is_hod = true;

-- ─── Summary ───────────────────────────────────────────────────────────────
RAISE NOTICE '========================================';
RAISE NOTICE 'HOD Accounts Created Successfully!';
RAISE NOTICE '========================================';
RAISE NOTICE 'CSE HOD: hod.cse@pesitm.edu.in / admin123';
RAISE NOTICE 'ECE HOD: hod.ece@pesitm.edu.in / admin123';
RAISE NOTICE 'ME HOD:  hod.me@pesitm.edu.in / admin123';
RAISE NOTICE 'EE HOD:  hod.ee@pesitm.edu.in / admin123';
RAISE NOTICE '========================================';
RAISE NOTICE 'All HODs have full access to their departments';
RAISE NOTICE 'Remember to change passwords after first login!';

END $$;
