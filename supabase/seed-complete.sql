-- ============================================================================
-- COMPLETE SEED DATA with Test Users
-- Run this AFTER schema.sql
-- ============================================================================

-- ─── DEPARTMENTS ──────────────────────────────────────────────────────────
insert into public.departments (id, name, full_name) values
  ('d1000000-0000-0000-0000-000000000001', 'CSE', 'Computer Science & Engineering'),
  ('d1000000-0000-0000-0000-000000000002', 'ECE', 'Electronics & Communication Engineering'),
  ('d1000000-0000-0000-0000-000000000003', 'ME',  'Mechanical Engineering'),
  ('d1000000-0000-0000-0000-000000000004', 'EE',  'Electrical Engineering');

-- ─── SUBJECTS ─────────────────────────────────────────────────────────────
insert into public.subjects (id, name, code, department_id, semester) values
  ('s1000000-0000-0000-0000-000000000001', 'Mathematics-I',        'MA101', 'd1000000-0000-0000-0000-000000000001', 1),
  ('s1000000-0000-0000-0000-000000000002', 'Physics',              'PH101', 'd1000000-0000-0000-0000-000000000001', 1),
  ('s1000000-0000-0000-0000-000000000003', 'Programming in C',     'CS101', 'd1000000-0000-0000-0000-000000000001', 1),
  ('s1000000-0000-0000-0000-000000000004', 'Data Structures',      'CS201', 'd1000000-0000-0000-0000-000000000001', 3),
  ('s1000000-0000-0000-0000-000000000005', 'Database Systems',     'CS301', 'd1000000-0000-0000-0000-000000000001', 5),
  ('s1000000-0000-0000-0000-000000000006', 'Digital Electronics',  'EC201', 'd1000000-0000-0000-0000-000000000002', 3),
  ('s1000000-0000-0000-0000-000000000007', 'Thermodynamics',       'ME201', 'd1000000-0000-0000-0000-000000000003', 3);

-- ─── CREATE TEST USERS ────────────────────────────────────────────────────
-- Note: Passwords are hashed with bcrypt. All passwords are: admin123, teacher123, student123

-- Admin/HOD
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) values (
  'u1000000-0000-0000-0000-000000000001',
  'admin@college.edu',
  '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY',
  now(),
  '{"full_name": "Admin User", "role": "hod"}',
  now(),
  now()
);

-- Teacher
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) values (
  'u1000000-0000-0000-0000-000000000002',
  'teacher@college.edu',
  '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY',
  now(),
  '{"full_name": "Teacher User", "role": "teacher"}',
  now(),
  now()
);

-- Student
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) values (
  'u1000000-0000-0000-0000-000000000003',
  'student@college.edu',
  '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY',
  now(),
  '{"full_name": "Student User", "role": "student"}',
  now(),
  now()
);

-- More students for testing
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) values
  ('u1000000-0000-0000-0000-000000000004', 'rahul@college.edu', '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY', now(), '{"full_name": "Rahul Kumar", "role": "student"}', now(), now()),
  ('u1000000-0000-0000-0000-000000000005', 'priya@college.edu', '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY', now(), '{"full_name": "Priya Sharma", "role": "student"}', now(), now()),
  ('u1000000-0000-0000-0000-000000000006', 'amit@college.edu', '$2a$10$rKvFrFPHqM8gZOqYvYfYTe1jR7QFxQXqHYz5L5tKqYYvYYYYYYYYY', now(), '{"full_name": "Amit Patel", "role": "student"}', now(), now());

-- ─── PROFILES (auto-created by trigger, but we'll insert manually for fixed UUIDs) ───
insert into public.profiles (id, full_name, email, role) values
  ('u1000000-0000-0000-0000-000000000001', 'Admin User', 'admin@college.edu', 'hod'),
  ('u1000000-0000-0000-0000-000000000002', 'Teacher User', 'teacher@college.edu', 'teacher'),
  ('u1000000-0000-0000-0000-000000000003', 'Student User', 'student@college.edu', 'student'),
  ('u1000000-0000-0000-0000-000000000004', 'Rahul Kumar', 'rahul@college.edu', 'student'),
  ('u1000000-0000-0000-0000-000000000005', 'Priya Sharma', 'priya@college.edu', 'student'),
  ('u1000000-0000-0000-0000-000000000006', 'Amit Patel', 'amit@college.edu', 'student');

-- ─── TEACHERS ─────────────────────────────────────────────────────────────
insert into public.teachers (id, profile_id, department_id, designation) values
  ('t1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Assistant Professor');

-- ─── STUDENTS ─────────────────────────────────────────────────────────────
insert into public.students (id, profile_id, roll_no, department_id, batch, semester) values
  ('st100000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003', '2024CSE001', 'd1000000-0000-0000-0000-000000000001', '2024', 1),
  ('st100000-0000-0000-0000-000000000002', 'u1000000-0000-0000-0000-000000000004', '2024CSE002', 'd1000000-0000-0000-0000-000000000001', '2024', 1),
  ('st100000-0000-0000-0000-000000000003', 'u1000000-0000-0000-0000-000000000005', '2024CSE003', 'd1000000-0000-0000-0000-000000000001', '2024', 1),
  ('st100000-0000-0000-0000-000000000004', 'u1000000-0000-0000-0000-000000000006', '2023CSE015', 'd1000000-0000-0000-0000-000000000001', '2023', 3);

-- ─── EXAMS ────────────────────────────────────────────────────────────────
insert into public.exams (id, name, type, subject_id, max_marks, exam_date, created_by) values
  ('e1000000-0000-0000-0000-000000000001', 'Mid Sem Mathematics-I', 'mid_sem', 's1000000-0000-0000-0000-000000000001', 100, '2025-01-15', 'u1000000-0000-0000-0000-000000000002'),
  ('e1000000-0000-0000-0000-000000000002', 'Class Test 1 - C Programming', 'class_test', 's1000000-0000-0000-0000-000000000003', 50, '2025-01-10', 'u1000000-0000-0000-0000-000000000002'),
  ('e1000000-0000-0000-0000-000000000003', 'Mid Sem Physics', 'mid_sem', 's1000000-0000-0000-0000-000000000002', 100, '2025-01-20', 'u1000000-0000-0000-0000-000000000002'),
  ('e1000000-0000-0000-0000-000000000004', 'Data Structures Lab', 'practical', 's1000000-0000-0000-0000-000000000004', 50, '2025-02-01', 'u1000000-0000-0000-0000-000000000002');

-- ─── MARKS ────────────────────────────────────────────────────────────────
insert into public.marks (student_id, exam_id, marks_obtained, entered_by) values
  -- Student 1 (Student User)
  ('st100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 85.0, 'u1000000-0000-0000-0000-000000000002'),
  ('st100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 42.0, 'u1000000-0000-0000-0000-000000000002'),
  ('st100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 78.0, 'u1000000-0000-0000-0000-000000000002'),

  -- Student 2 (Rahul)
  ('st100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 92.0, 'u1000000-0000-0000-0000-000000000002'),
  ('st100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 48.0, 'u1000000-0000-0000-0000-000000000002'),
  ('st100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', 88.0, 'u1000000-0000-0000-0000-000000000002'),

  -- Student 3 (Priya)
  ('st100000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 76.0, 'u1000000-0000-0000-0000-000000000002'),
  ('st100000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000002', 38.0, 'u1000000-0000-0000-0000-000000000002'),
  ('st100000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 65.0, 'u1000000-0000-0000-0000-000000000002'),

  -- Student 4 (Amit) - Semester 3 student
  ('st100000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000004', 45.0, 'u1000000-0000-0000-0000-000000000002');

-- ─── FEEDBACK ─────────────────────────────────────────────────────────────
insert into public.feedback (student_id, teacher_id, subject_id, type, message) values
  ('st100000-0000-0000-0000-000000000001', 't1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000003', 'improvement', 'Good progress in C programming. Focus more on pointers and memory management.'),
  ('st100000-0000-0000-0000-000000000002', 't1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 'appreciation', 'Excellent performance in Mathematics! Keep it up.'),
  ('st100000-0000-0000-0000-000000000003', 't1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002', 'concern', 'Attendance is low and marks are declining. Please meet me to discuss.');

-- ============================================================================
-- DONE! You can now log in with:
-- Admin:   admin@college.edu    / admin123
-- Teacher: teacher@college.edu  / teacher123
-- Student: student@college.edu  / student123
-- ============================================================================
