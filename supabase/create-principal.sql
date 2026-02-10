-- ============================================================================
-- Create Principal Account
-- This creates a principal user with full system access
-- ============================================================================

DO $$
DECLARE
  principal_user_id uuid := uuid_generate_v4();
  principal_email text := 'principal@pesitm.edu.in';
  principal_name text := 'Dr. Principal PESITM';
  default_password text := '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY'; -- admin123
BEGIN

-- Create auth user
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) VALUES (
  principal_user_id,
  principal_email,
  default_password,
  now(),
  json_build_object('full_name', principal_name, 'role', 'principal'),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create profile with principal role
INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  principal_user_id,
  principal_name,
  principal_email,
  'principal'
) ON CONFLICT (email) DO UPDATE
  SET role = 'principal',
      full_name = EXCLUDED.full_name;

RAISE NOTICE '========================================';
RAISE NOTICE 'Principal account created successfully!';
RAISE NOTICE 'Email: %', principal_email;
RAISE NOTICE 'Password: admin123';
RAISE NOTICE 'Role: principal';
RAISE NOTICE '========================================';
RAISE NOTICE 'IMPORTANT: Change password after first login!';

END $$;
