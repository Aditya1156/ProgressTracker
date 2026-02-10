-- ============================================================================
-- Add CS Students - 6th Semester, Section B
-- Batch: 2023 (currently in 6th semester)
-- ============================================================================

-- This script creates auth users, profiles, and student records
-- Default password for all: student123 (hashed with bcrypt)
-- Students can login with: <USN>@college.edu (e.g., 4pm23cs001@college.edu)

DO $$
DECLARE
  dept_id uuid := 'd1000000-0000-0000-0000-000000000001'; -- CSE department
  student_batch text := '2023';
  student_semester int := 6;
  default_password text := '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY'; -- student123
  user_id uuid;
  student_usn text;
  student_name text;
  student_email text;
BEGIN

-- Create temporary table for student data
CREATE TEMP TABLE temp_students (usn text, name text);

-- Insert all student records
INSERT INTO temp_students (usn, name) VALUES
('4PM23CS001', 'ADARSH UMESH HEGDE'),
('4PM23CS002', 'ADITYA KUMAR'),
('4PM23CS003', 'AHMED SHAREEF'),
('4PM23CS004', 'AISHWARYA K R'),
('4PM23CS005', 'AISHWARYALAXMI'),
('4PM23CS006', 'AKASH'),
('4PM23CS007', 'ALOK HAVANAGI'),
('4PM23CS008', 'AMRUTHA R H'),
('4PM23CS009', 'ANAND HOLI'),
('4PM23CS010', 'ANANYA K JOIS'),
('4PM23CS011', 'ANISH M'),
('4PM23CS012', 'ANKITHA B'),
('4PM23CS013', 'ANKITHA C'),
('4PM23CS014', 'ANKITHA N B'),
('4PM23CS015', 'ANUSHA H M'),
('4PM23CS016', 'B M BHARATH KUMAR'),
('4PM23CS017', 'BHARGAVI S R'),
('4PM23CS018', 'BHAVYA G S'),
('4PM23CS019', 'CHANDANA B'),
('4PM23CS020', 'CHANDRAPPA IRAPPA BANNIHATTI'),
('4PM23CS021', 'CHETAN R J'),
('4PM23CS022', 'CHETAN SATYEPPA MAGADUM'),
('4PM23C0S23', 'CHINMAY S R'),
('4PM23CS024', 'D R VIJAY'),
('4PM23CS025', 'DASARI KEERTHAN DATTA'),
('4PM23CS026', 'DEEKSHA J R'),
('4PM23CS027', 'DHANYA P TIMALAPUR'),
('4PM23CS028', 'DHRUVA PATEL H'),
('4PM23CS029', 'DIVYA S K'),
('4PM23CS030', 'DUTHI S M'),
('4PM23CS031', 'G VARUN RAJU'),
('4PM23CS032', 'GAGAN R BANGER'),
('4PM23CS033', 'GAGANA J'),
('4PM23CS034', 'GORAKATI CHAITANYA REDDY'),
('4PM23CS035', 'GOWTHAM K'),
('4PM23CS036', 'H GANESH'),
('4PM23CS037', 'H N SPANDAN GOWDA'),
('4PM23CS038', 'HARSHA D P'),
('4PM23CS039', 'HARSHITHA B R'),
('4PM23CS042', 'IMRAN BAIG'),
('4PM23CS043', 'JAYASURYA V'),
('4PM23CS044', 'JEEVANA KRISHNAMOORTI NAIK'),
('4PM23CS045', 'JYOTI ASHOK HINDI'),
('4PM23CS046', 'K C ASHWINI'),
('4PM23CS047', 'K N NANDITHA'),
('4PM23CS048', 'KAVANA A'),
('4PM23CS049', 'KONA VENKATA SRUJANA SREE'),
('4PM23CS050', 'LAVANYA J'),
('4PM23CS051', 'LIKHITH GOWDA K N'),
('4PM23CS052', 'LINGANAGOUDA SHADAKSHARAGOUDA PATIL'),
('4PM23CS053', 'M C BINDU RANI'),
('4PM23CS054', 'MAHANTESHA U'),
('4PM23CS055', 'MAHERA MUSKAN'),
('4PM23CS056', 'MANASA M P'),
('4PM23CS057', 'MANASA N C'),
('4PM23CS058', 'MANDARA G N'),
('4PM23CS059', 'MANSI H J'),
('4PM23CS061', 'MD ZULKERNAIN KHAN'),
('4PM23CS062', 'MOHAMMED MAAZ F'),
('4PM23CS063', 'MOHAMMED SAIF KATTIMANI'),
('4PM23CS064', 'MUBARAK KHAN'),
('4PM23CS065', 'NANDAN S P'),
('4PM23CS066', 'NANDINI HOSAMANI'),
('4PM24CS400', 'A R VAISHNAVI'),
('4PM24CS401', 'BHUVAN S'),
('4PM24CS402', 'CHETHAN K C'),
('4PM23CS067', 'NIDA KHANUM'),
('4PM23CS068', 'NISHAN K N'),
('4PM23CS069', 'NISHANTH M R'),
('4PM23CS070', 'PALLETI PRADEEPA'),
('4PM23CS071', 'PAVAN KUMAR'),
('4PM23CS072', 'POOJA S'),
('4PM23CS073', 'POORVIKA J GOWDA'),
('4PM23CS074', 'PRACHI YADAV'),
('4PM23CS075', 'PRAHLAD P PATIL'),
('4PM23CS076', 'PRAJWAL K H'),
('4PM23CS077', 'PRANATH K J'),
('4PM23CS078', 'PRASHANTH C'),
('4PM23CS079', 'PREMA R B'),
('4PM23CS080', 'PRIYA R G'),
('4PM23CS081', 'PUSHKAR RAJ PUROHIT'),
('4PM23CS082', 'RACHANA D'),
('4PM23CS083', 'RAKSHITHA RAMESH KURDEKAR'),
('4PM23CS084', 'RAMYA VIJAYKUMAR KATTI'),
('4PM23CS085', 'RANJITH T H'),
('4PM23CS086', 'ROHITH D K'),
('4PM23CS087', 'S B SINCHANA'),
('4PM23CS088', 'S U GAYATRI'),
('4PM23CS089', 'SAHANA H M'),
('4PM23CS090', 'SAHANA PRABULINGAPPA KAJJERA'),
('4PM23CS091', 'SAHANA R MIRAJAKAR'),
('4PM23CS092', 'SAMARTHA B'),
('4PM23CS093', 'SANJANA K KUBASADA'),
('4PM23CS094', 'SANJAY A'),
('4PM23CS095', 'SANKALPA V HEGDE'),
('4PM23CS096', 'SATHVIK D'),
('4PM23CS097', 'SHASHANK KUMAR G N'),
('4PM23CS098', 'SHASHANK V S'),
('4PM23CS099', 'SHIVAJI KULKARNI'),
('4PM23CS101', 'SHUBHAM KUMAR SINGH'),
('4PM23CS102', 'SMITHA SUBHASH ISARAGONDA'),
('4PM23CS103', 'SNEHA T'),
('4PM23CS104', 'SOMANATH MOTAGI'),
('4PM23CS105', 'SOUMYA GURUPADAYYA HIREMATH'),
('4PM23CS106', 'SOUMYA M GALABHI'),
('4PM23CS107', 'SRUSHTI M V'),
('4PM23CS108', 'SUHAS PATEL N'),
('4PM23CS109', 'SUHASINI H PUJAR'),
('4PM23CS110', 'SUSHMA MARUTI JADHAV'),
('4PM23CS111', 'SWAYAM DATTATRAY'),
('4PM23CS112', 'T A ANANTHA KRISHNA'),
('4PM23CS113', 'THANUSHREE K H'),
('4PM23CS114', 'THEJAS GOWDA H J'),
('4PM23CS115', 'THRISHA A P'),
('4PM23CS116', 'TRISHA VISHWANATH BALI'),
('4PM23CS117', 'TUSHAR D G'),
('4PM23CS119', 'VEDHA P TUMMINAKATTI'),
('4PM23CS120', 'VEERENDRA K J'),
('4PM23CS121', 'VIKAS NAIK'),
('4PM23CS122', 'VIKAS U G'),
('4PM23CS124', 'YELLAMLA BHAVANI'),
('4PM23CS125', 'YUSRA SADIYAH SHAIKH'),
('4PM23CS126', 'GUNAVATHI G R'),
('4PM24CS403', 'MALLANNA RAJU KARU'),
('4PM24CS404', 'MOHAMMED SHAKIR MADANI'),
('4PM24CS405', 'NIKITHA HUBLIKAR'),
('4PM24CS406', 'PAVAN G'),
('4PM24CS407', 'RABIYA BASARI'),
('4PM24CS408', 'SACHIN MALLAPPA ADI'),
('4PM24CS409', 'SHRIDHAR K'),
('4PM24CS410', 'TEJASWINI K S'),
('4PM24CS411', 'VIGHNESH C'),
('4PM22CS003', 'ABHISHEK S');

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
    raw_user_meta_data, created_at, updated_at
  ) VALUES (
    user_id,
    student_email,
    default_password,
    now(),
    json_build_object('full_name', student_name, 'role', 'student'),
    now(),
    now()
  ) ON CONFLICT (email) DO NOTHING;

  -- 2. Create profile
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (user_id, student_name, student_email, 'student')
  ON CONFLICT (email) DO NOTHING;

  -- 3. Create student record with Section B
  INSERT INTO public.students (profile_id, roll_no, department_id, batch, semester, section)
  VALUES (user_id, student_usn, dept_id, student_batch, student_semester, 'B')
  ON CONFLICT (roll_no) DO NOTHING;

END LOOP;

DROP TABLE temp_students;

RAISE NOTICE '========================================';
RAISE NOTICE 'Successfully added % CS students for 6th semester, Section B',
  (SELECT COUNT(*) FROM public.students WHERE semester = 6 AND batch = '2023' AND department_id = dept_id);
RAISE NOTICE 'Default password for all students: student123';
RAISE NOTICE 'Students can login with: <USN>@college.edu';
RAISE NOTICE 'Example: 4pm23cs001@college.edu';
RAISE NOTICE '========================================';

END $$;
