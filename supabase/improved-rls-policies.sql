-- ============================================================================
-- IMPROVED ROW LEVEL SECURITY POLICIES
-- Implements proper role hierarchy: Principal > HOD > Teacher > Student
-- ============================================================================

-- ─── STEP 1: Add is_hod flag to teachers table ────────────────────────────
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS is_hod boolean DEFAULT false;

-- Only one HOD per department
CREATE UNIQUE INDEX IF NOT EXISTS unique_hod_per_dept
ON public.teachers (department_id)
WHERE is_hod = true;

-- ─── STEP 2: Create enhanced helper functions ──────────────────────────────

-- Check if current user is principal
CREATE OR REPLACE FUNCTION public.is_principal()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'principal'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is HOD
CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'hod'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's department (if they're a teacher or HOD)
CREATE OR REPLACE FUNCTION public.get_my_department()
RETURNS uuid AS $$
  SELECT department_id FROM public.teachers
  WHERE profile_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is HOD of a specific department
CREATE OR REPLACE FUNCTION public.is_hod_of_department(dept_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.profiles p ON t.profile_id = p.id
    WHERE p.id = auth.uid()
      AND t.department_id = dept_id
      AND t.is_hod = true
      AND p.role = 'hod'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── STEP 3: Drop existing policies ─────────────────────────────────────────

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Departments
DROP POLICY IF EXISTS "Departments are viewable by all" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;

-- Students
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;

-- Teachers
DROP POLICY IF EXISTS "Teachers viewable by authenticated" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;

-- Subjects
DROP POLICY IF EXISTS "Subjects are viewable by all" ON public.subjects;
DROP POLICY IF EXISTS "Teachers and admins can manage subjects" ON public.subjects;

-- Exams
DROP POLICY IF EXISTS "Exams are viewable by all" ON public.exams;
DROP POLICY IF EXISTS "Teachers can manage exams" ON public.exams;

-- Marks
DROP POLICY IF EXISTS "Students can view own marks" ON public.marks;
DROP POLICY IF EXISTS "Teachers can manage marks" ON public.marks;

-- Feedback
DROP POLICY IF EXISTS "Students can view own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Teachers can create feedback" ON public.feedback;
DROP POLICY IF EXISTS "Teachers can update own feedback" ON public.feedback;

-- ─── STEP 4: Create improved RLS policies ───────────────────────────────────

-- ========== PROFILES ==========
CREATE POLICY "Anyone can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Principal can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_principal());

-- ========== DEPARTMENTS ==========
CREATE POLICY "Anyone can view departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Principal can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.is_principal());

-- ========== TEACHERS ==========
CREATE POLICY "Anyone can view teachers"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (true);

-- Principal can manage all teachers
CREATE POLICY "Principal can manage all teachers"
  ON public.teachers FOR ALL
  TO authenticated
  USING (public.is_principal());

-- HOD can manage teachers in their department
CREATE POLICY "HOD can manage teachers in their department"
  ON public.teachers FOR ALL
  TO authenticated
  USING (
    public.is_hod() AND department_id = public.get_my_department()
  );

-- ========== STUDENTS ==========
-- Students can view their own record
CREATE POLICY "Students can view own record"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid() OR
    public.is_teacher() OR
    public.is_hod() OR
    public.is_principal()
  );

-- Principal can manage all students
CREATE POLICY "Principal can manage all students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_principal());

-- HOD can manage students in their department
CREATE POLICY "HOD can manage students in their department"
  ON public.students FOR ALL
  TO authenticated
  USING (
    public.is_hod() AND department_id = public.get_my_department()
  );

-- ========== SUBJECTS ==========
CREATE POLICY "Anyone can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

-- Principal can manage all subjects
CREATE POLICY "Principal can manage all subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.is_principal());

-- HOD can manage subjects in their department
CREATE POLICY "HOD can manage subjects in their department"
  ON public.subjects FOR ALL
  TO authenticated
  USING (
    public.is_hod() AND department_id = public.get_my_department()
  );

-- Teachers can create subjects in their department
CREATE POLICY "Teachers can create subjects in their department"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_teacher() AND department_id = public.get_my_department()
  );

-- ========== EXAMS ==========
CREATE POLICY "Anyone can view exams"
  ON public.exams FOR SELECT
  TO authenticated
  USING (true);

-- Principal can manage all exams
CREATE POLICY "Principal can manage all exams"
  ON public.exams FOR ALL
  TO authenticated
  USING (public.is_principal());

-- HOD can manage exams for their department subjects
CREATE POLICY "HOD can manage department exams"
  ON public.exams FOR ALL
  TO authenticated
  USING (
    public.is_hod() AND
    subject_id IN (
      SELECT id FROM public.subjects
      WHERE department_id = public.get_my_department()
    )
  );

-- Teachers can manage exams they created
CREATE POLICY "Teachers can manage own exams"
  ON public.exams FOR ALL
  TO authenticated
  USING (
    public.is_teacher() AND created_by = auth.uid()
  );

-- Teachers can create exams for their department subjects
CREATE POLICY "Teachers can create exams"
  ON public.exams FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.is_teacher() OR public.is_hod()) AND
    subject_id IN (
      SELECT id FROM public.subjects
      WHERE department_id = public.get_my_department()
    )
  );

-- ========== MARKS ==========
-- Students can view own marks
CREATE POLICY "Students can view own marks"
  ON public.marks FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE profile_id = auth.uid()
    ) OR
    public.is_teacher() OR
    public.is_hod() OR
    public.is_principal()
  );

-- Principal can manage all marks
CREATE POLICY "Principal can manage all marks"
  ON public.marks FOR ALL
  TO authenticated
  USING (public.is_principal());

-- HOD can manage marks for their department students
CREATE POLICY "HOD can manage department marks"
  ON public.marks FOR ALL
  TO authenticated
  USING (
    public.is_hod() AND
    student_id IN (
      SELECT id FROM public.students
      WHERE department_id = public.get_my_department()
    )
  );

-- Teachers can manage marks for exams they created
CREATE POLICY "Teachers can manage own exam marks"
  ON public.marks FOR ALL
  TO authenticated
  USING (
    public.is_teacher() AND
    exam_id IN (
      SELECT id FROM public.exams WHERE created_by = auth.uid()
    )
  );

-- ========== FEEDBACK ==========
-- Students can view their own feedback
CREATE POLICY "Students can view own feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE profile_id = auth.uid()
    ) OR
    teacher_id IN (
      SELECT id FROM public.teachers WHERE profile_id = auth.uid()
    ) OR
    public.is_hod() OR
    public.is_principal()
  );

-- Teachers can create feedback
CREATE POLICY "Teachers can create feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_teacher() OR public.is_hod() OR public.is_principal()
  );

-- Teachers can update their own feedback
CREATE POLICY "Teachers can update own feedback"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM public.teachers WHERE profile_id = auth.uid()
    ) OR
    public.is_principal()
  );

-- Teachers can delete their own feedback
CREATE POLICY "Teachers can delete own feedback"
  ON public.feedback FOR DELETE
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM public.teachers WHERE profile_id = auth.uid()
    ) OR
    public.is_principal()
  );

-- ─── STEP 5: Add helpful comments ──────────────────────────────────────────

COMMENT ON FUNCTION public.is_principal() IS 'Returns true if current user is principal';
COMMENT ON FUNCTION public.is_hod() IS 'Returns true if current user is HOD';
COMMENT ON FUNCTION public.is_teacher() IS 'Returns true if current user is teacher';
COMMENT ON FUNCTION public.get_my_department() IS 'Returns department_id for current teacher/HOD';
COMMENT ON FUNCTION public.is_hod_of_department(uuid) IS 'Returns true if current user is HOD of specified department';

-- ============================================================================
-- DONE! Role hierarchy implemented:
-- - Principal: Full access to everything
-- - HOD: Full access to their department (teachers, students, subjects, exams, marks)
-- - Teacher: Can create/manage their own exams and marks
-- - Student: View-only access to their own data
-- ============================================================================
