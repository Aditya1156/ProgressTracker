-- ============================================================================
-- Add Section Field to Students Table
-- Adds section column to track Section A, B, C, etc.
-- ============================================================================

-- Add section column to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS section text DEFAULT 'A' CHECK (section ~ '^[A-Z]$');

-- Create index for faster queries by section
CREATE INDEX IF NOT EXISTS idx_students_section ON public.students(section);

-- Create composite index for common queries (semester + section)
CREATE INDEX IF NOT EXISTS idx_students_semester_section
ON public.students(semester, section);

-- Create composite index for department + semester + section
CREATE INDEX IF NOT EXISTS idx_students_dept_sem_section
ON public.students(department_id, semester, section);

-- Add comment
COMMENT ON COLUMN public.students.section IS 'Section identifier (A, B, C, etc.)';

-- ─── Update existing students to Section B (as requested) ──────────────────
-- Update the 6th semester CS students to Section B
UPDATE public.students
SET section = 'B'
WHERE semester = 6
  AND batch = '2023'
  AND department_id = 'd1000000-0000-0000-0000-000000000001'; -- CSE department

-- ─── Create helper function to get section distribution ────────────────────
CREATE OR REPLACE FUNCTION public.get_section_distribution(
  p_department_id uuid,
  p_semester int
)
RETURNS TABLE(section text, student_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT s.section, COUNT(*)::bigint as student_count
  FROM public.students s
  WHERE s.department_id = p_department_id
    AND s.semester = p_semester
  GROUP BY s.section
  ORDER BY s.section;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_section_distribution(uuid, int) IS
  'Returns student count per section for a given department and semester';

-- ─── Verification ──────────────────────────────────────────────────────────
DO $$
DECLARE
  section_count int;
BEGIN
  SELECT COUNT(DISTINCT section) INTO section_count
  FROM public.students;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Section field added successfully!';
  RAISE NOTICE 'Number of sections in use: %', section_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '6th semester CS students assigned to Section B';

  -- Show section distribution for 6th semester CSE
  RAISE NOTICE 'Section distribution for 6th sem CSE:';
  FOR section_count IN
    SELECT COUNT(*)::int
    FROM public.students
    WHERE semester = 6
      AND department_id = 'd1000000-0000-0000-0000-000000000001'
    GROUP BY section
  LOOP
    RAISE NOTICE '  Section B: % students', section_count;
  END LOOP;
END $$;

-- ============================================================================
-- Usage Examples:
--
-- 1. Get all students in Section A of CSE 6th semester:
--    SELECT * FROM students
--    WHERE department_id = '<cse_id>' AND semester = 6 AND section = 'A';
--
-- 2. Get section distribution:
--    SELECT * FROM get_section_distribution('<cse_id>', 6);
--
-- 3. Assign a student to Section C:
--    UPDATE students SET section = 'C' WHERE roll_no = 'USN123';
--
-- 4. Move all Section A students to Section B:
--    UPDATE students SET section = 'B'
--    WHERE department_id = '<dept_id>' AND semester = 6 AND section = 'A';
-- ============================================================================
