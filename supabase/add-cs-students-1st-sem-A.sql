-- ============================================================================
-- Add CS Students - 1st Semester, Section A
-- Batch: 2025 (2025-26 Odd Semester)
-- ============================================================================

-- This script creates auth users, profiles, and student records
-- Default password for all: student123 (hashed with bcrypt)
-- Students can login with: <USN>@college.edu (e.g., 4pm25cs001@college.edu)

DO $$
DECLARE
  dept_id uuid := 'd1000000-0000-0000-0000-000000000001'; -- CSE department
  student_batch text := '2025';
  student_semester int := 1;
  default_password text := '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY'; -- student123
  user_id uuid;
  student_usn text;
  student_name text;
  student_email text;
BEGIN

-- Create temporary table for student data
CREATE TEMP TABLE temp_students (usn text, name text);

-- Insert all student records (1st Year, A Section)
INSERT INTO temp_students (usn, name) VALUES
('4PM25CS001', 'ABHILASHA BASANAGOUDA PATIL'),
('4PM25CS002', 'ADARSHA T U'),
('4PM25CS003', 'ADITI S'),
('4PM25CS004', 'AISHWARYA'),
('4PM25CS005', 'AISHWARYA A'),
('4PM25CS006', 'AISHWARYA M'),
('4PM25CS007', 'AISHWARYA N'),
('4PM25CS008', 'AISHWARYA V BENNUR'),
('4PM25CS009', 'AKANKSHA SUDHAKAR NANDANI'),
('4PM25CS010', 'AMULYA H P'),
('4PM25CS011', 'ANAND GURUSIDDAPPA TAKKALAKI'),
('4PM25CS012', 'ANKITHA T S'),
('4PM25CS013', 'ARCHANA V'),
('4PM25CS014', 'ARJUN P'),
('4PM25CS015', 'ARYAN GIRISH'),
('4PM25CS016', 'ASHIKA G'),
('4PM25CS017', 'AYAZ KHAN'),
('4PM25CS018', 'B K BHAVANI'),
('4PM25CS019', 'B MEGHANA'),
('4PM25CS020', 'BHAGYALAKSHMI LOKAPPA MADIVALAR'),
('4PM25CS021', 'BHARATH P L'),
('4PM25CS022', 'BHAVANA H R'),
('4PM25CS023', 'BHUMIKA K J'),
('4PM25CS024', 'BHUVANA P'),
('4PM25CS025', 'BIBI HAJIRA'),
('4PM25CS026', 'BINDU H N'),
('4PM25CS028', 'CHAITRA MALLIKARJUN HUKKERI'),
('4PM25CS029', 'CHANDANA H S'),
('4PM25CS030', 'CHANDRASHEKHAR R K'),
('4PM25CS031', 'CHETAN SURESH HABAGONDE'),
('4PM25CS032', 'CHIDANANDA M'),
('4PM25CS033', 'CHINMAYEE H'),
('4PM25CS034', 'CHITHRA G'),
('4PM25CS035', 'D M RAJKUMAR'),
('4PM25CS036', 'DALVIN A'),
('4PM25CS037', 'DARSHAN'),
('4PM25CS038', 'DARSHAN M HULAGURA'),
('4PM25CS039', 'DEEKSHITH S GOWDA'),
('4PM25CS040', 'DEEPAK B R'),
('4PM25CS041', 'DEEPAK KUMAR CHANDRAKANTH BADIGER'),
('4PM25CS042', 'DEEPIKA P S'),
('4PM25CS043', 'DEVENDRA SANKHLA'),
('4PM25CS044', 'DHANUSH R'),
('4PM25CS045', 'DIVYA I R'),
('4PM25CS046', 'DIVYA REVANAKAR'),
('4PM25CS047', 'DIVYA S R'),
('4PM25CS048', 'DIVYASHREE G K'),
('4PM25CS049', 'DRUSHYA R'),
('4PM25CS050', 'FATHIMA ZAHRA'),
('4PM25CS051', 'GAGAN C M'),
('4PM25CS052', 'GAGANASHREE G A'),
('4PM25CS053', 'GANAVI PATEL H G'),
('4PM25CS054', 'GANESH R MANE'),
('4PM25CS055', 'GEETA LAMANI'),
('4PM25CS056', 'GHANA SHYAM V'),
('4PM25CS057', 'GOUTHAMI BHANDARI'),
('4PM25CS058', 'GURURAJ'),
('4PM25CS059', 'HEMALATHA M'),
('4PM25CS060', 'HEMANTH GOWDA S B'),
('4PM25CS061', 'INDRAJEETH K C'),
('4PM25CS062', 'INDUSHREE R');

-- Loop through each student and create complete records
FOR student_usn, student_name IN
  SELECT usn, name FROM temp_students
LOOP
  -- Generate UUID for this student
  user_id := uuid_generate_v4();
  student_email := lower(student_usn) || '@college.edu';

  -- 1. Create auth.users entry
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    instance_id, aud, role
  ) VALUES (
    user_id,
    student_email,
    default_password,
    now(),
    json_build_object('full_name', student_name, 'role', 'student'),
    now(),
    now(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  -- 2. Create profile
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (user_id, student_name, student_email, 'student')
  ON CONFLICT (email) DO NOTHING;

  -- 3. Create student record with Section A
  INSERT INTO public.students (profile_id, roll_no, department_id, batch, semester, section)
  VALUES (user_id, student_usn, dept_id, student_batch, student_semester, 'A')
  ON CONFLICT (roll_no) DO NOTHING;

END LOOP;

DROP TABLE temp_students;

RAISE NOTICE '========================================';
RAISE NOTICE 'Successfully added CS students for 1st semester, Section A';
RAISE NOTICE 'Total 1st sem A-section students: %',
  (SELECT COUNT(*) FROM public.students WHERE semester = 1 AND batch = '2025' AND section = 'A' AND department_id = dept_id);
RAISE NOTICE 'Default password for all students: student123';
RAISE NOTICE 'Students can login with: <USN>@college.edu';
RAISE NOTICE 'Example: 4pm25cs001@college.edu';
RAISE NOTICE '========================================';

END $$;
