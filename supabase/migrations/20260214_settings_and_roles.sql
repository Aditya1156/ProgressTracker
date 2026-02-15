-- ============================================================
-- Migration: Settings System & Extended Roles
-- Date: 2026-02-14
-- Description: Adds system_settings, user_preferences,
--   role_permissions, parent_student_links tables,
--   expands role constraint with 3 new roles,
--   and creates avatar storage bucket.
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 0. Ensure required helper functions exist
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_principal()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'principal'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'hod'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('hod', 'principal')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. Expand the role constraint on profiles
-- ============================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'student', 'teacher', 'hod', 'principal',
    'class_coordinator', 'lab_assistant', 'parent'
  ));

-- ============================================================
-- 2. system_settings — institution-wide key-value config
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id  text NOT NULL DEFAULT 'MAIN',
  key         text NOT NULL,
  value       jsonb NOT NULL DEFAULT '{}',
  updated_by  uuid REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(college_id, key)
);

CREATE TRIGGER on_system_settings_updated
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view system settings"
  ON public.system_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Principal can manage system settings"
  ON public.system_settings FOR ALL
  TO authenticated USING (public.is_principal());

CREATE POLICY "HOD can manage system settings"
  ON public.system_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_hod());

CREATE POLICY "HOD can update system settings"
  ON public.system_settings FOR UPDATE
  TO authenticated USING (public.is_hod());

-- Seed default system settings
INSERT INTO public.system_settings (college_id, key, value) VALUES
  ('MAIN', 'institution', '{
    "name": "PESITM",
    "code": "PESITM",
    "address": "",
    "phone": "",
    "email": "",
    "website": ""
  }'::jsonb),
  ('MAIN', 'academic_year', '{
    "current": "2025-2026",
    "start_date": "2025-08-01",
    "end_date": "2026-05-31"
  }'::jsonb),
  ('MAIN', 'grading', '{
    "thresholds": {"A+": 90, "A": 80, "B+": 70, "B": 60, "C": 50, "F": 0},
    "pass_mark": 40
  }'::jsonb),
  ('MAIN', 'attendance', '{
    "minimum_percentage": 75,
    "late_counts_as_present": true
  }'::jsonb)
ON CONFLICT (college_id, key) DO NOTHING;

-- ============================================================
-- 3. user_preferences — per-user settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications    boolean NOT NULL DEFAULT true,
  in_app_notifications   boolean NOT NULL DEFAULT true,
  notification_settings  jsonb NOT NULL DEFAULT '{
    "marks_published": true,
    "feedback_received": true,
    "attendance_alert": true,
    "system_announcements": true
  }'::jsonb,
  ui_preferences         jsonb NOT NULL DEFAULT '{"theme": "system", "compact_mode": false}'::jsonb,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER on_user_preferences_updated
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Principal can view all preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated USING (public.is_principal());

-- ============================================================
-- 4. role_permissions — granular permission grants per role
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role        text NOT NULL,
  permission  text NOT NULL,
  granted     boolean NOT NULL DEFAULT false,
  college_id  text NOT NULL DEFAULT 'MAIN',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, permission, college_id),
  CONSTRAINT role_permissions_role_check CHECK (role IN (
    'student', 'teacher', 'hod', 'principal',
    'class_coordinator', 'lab_assistant', 'parent'
  ))
);

CREATE TRIGGER on_role_permissions_updated
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Principal can insert permissions"
  ON public.role_permissions FOR INSERT
  TO authenticated WITH CHECK (public.is_principal());

CREATE POLICY "Principal can update permissions"
  ON public.role_permissions FOR UPDATE
  TO authenticated USING (public.is_principal());

CREATE POLICY "Principal can delete permissions"
  ON public.role_permissions FOR DELETE
  TO authenticated USING (public.is_principal());

-- Seed default permissions
INSERT INTO public.role_permissions (role, permission, granted) VALUES
  -- Principal: full access
  ('principal', 'can_export', true),
  ('principal', 'can_delete', true),
  ('principal', 'can_manage_subjects', true),
  ('principal', 'can_manage_exams', true),
  ('principal', 'can_enter_marks', true),
  ('principal', 'can_view_analytics', true),
  ('principal', 'can_manage_attendance', true),
  ('principal', 'can_give_feedback', true),
  ('principal', 'can_manage_users', true),
  -- HOD: department-level
  ('hod', 'can_export', true),
  ('hod', 'can_delete', true),
  ('hod', 'can_manage_subjects', true),
  ('hod', 'can_manage_exams', true),
  ('hod', 'can_enter_marks', true),
  ('hod', 'can_view_analytics', true),
  ('hod', 'can_manage_attendance', true),
  ('hod', 'can_give_feedback', true),
  ('hod', 'can_manage_users', false),
  -- Teacher
  ('teacher', 'can_export', true),
  ('teacher', 'can_delete', false),
  ('teacher', 'can_manage_subjects', false),
  ('teacher', 'can_manage_exams', true),
  ('teacher', 'can_enter_marks', true),
  ('teacher', 'can_view_analytics', false),
  ('teacher', 'can_manage_attendance', true),
  ('teacher', 'can_give_feedback', true),
  ('teacher', 'can_manage_users', false),
  -- Class Coordinator (teacher + analytics)
  ('class_coordinator', 'can_export', true),
  ('class_coordinator', 'can_delete', false),
  ('class_coordinator', 'can_manage_subjects', false),
  ('class_coordinator', 'can_manage_exams', true),
  ('class_coordinator', 'can_enter_marks', true),
  ('class_coordinator', 'can_view_analytics', true),
  ('class_coordinator', 'can_manage_attendance', true),
  ('class_coordinator', 'can_give_feedback', true),
  ('class_coordinator', 'can_manage_users', false),
  -- Lab Assistant (limited)
  ('lab_assistant', 'can_export', false),
  ('lab_assistant', 'can_delete', false),
  ('lab_assistant', 'can_manage_subjects', false),
  ('lab_assistant', 'can_manage_exams', false),
  ('lab_assistant', 'can_enter_marks', true),
  ('lab_assistant', 'can_view_analytics', false),
  ('lab_assistant', 'can_manage_attendance', true),
  ('lab_assistant', 'can_give_feedback', false),
  ('lab_assistant', 'can_manage_users', false),
  -- Student
  ('student', 'can_export', true),
  ('student', 'can_delete', false),
  ('student', 'can_manage_subjects', false),
  ('student', 'can_manage_exams', false),
  ('student', 'can_enter_marks', false),
  ('student', 'can_view_analytics', false),
  ('student', 'can_manage_attendance', false),
  ('student', 'can_give_feedback', false),
  ('student', 'can_manage_users', false),
  -- Parent (read-only)
  ('parent', 'can_export', true),
  ('parent', 'can_delete', false),
  ('parent', 'can_manage_subjects', false),
  ('parent', 'can_manage_exams', false),
  ('parent', 'can_enter_marks', false),
  ('parent', 'can_view_analytics', false),
  ('parent', 'can_manage_attendance', false),
  ('parent', 'can_give_feedback', false),
  ('parent', 'can_manage_users', false)
ON CONFLICT (role, permission, college_id) DO NOTHING;

-- ============================================================
-- 5. parent_student_links — parent ↔ student relationship
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id   uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'parent' CHECK (relationship IN ('parent', 'guardian')),
  verified     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own links"
  ON public.parent_student_links FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage parent links"
  ON public.parent_student_links FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 6. Update helper functions for new roles
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('teacher', 'hod', 'principal', 'class_coordinator', 'lab_assistant')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.profiles p ON p.role = rp.role
    WHERE p.id = auth.uid()
      AND rp.permission = p_permission
      AND rp.granted = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 7. Supabase Storage bucket for avatars
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
