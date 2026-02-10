import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Helper to create or get a user
async function ensureUser(email, password, fullName, role) {
  // Try to create first
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role }
  });

  if (!error && data?.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id, full_name: fullName, email, role
    });
    console.log(`  Created: ${email} / ${password}`);
    return data.user.id;
  }

  // User already exists - look up by email via profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (profile) {
    // Update profile to ensure correct name/role
    await supabase.from('profiles').upsert({
      id: profile.id, full_name: fullName, email, role
    });
    console.log(`  Exists:  ${email} (${profile.id})`);
    return profile.id;
  }

  // Fallback: paginate through auth users
  let page = 1;
  while (true) {
    const { data: listData } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (!listData?.users?.length) break;
    const found = listData.users.find(u => u.email === email);
    if (found) {
      await supabase.from('profiles').upsert({
        id: found.id, full_name: fullName, email, role
      });
      console.log(`  Found:   ${email} (${found.id})`);
      return found.id;
    }
    if (listData.users.length < 100) break;
    page++;
  }

  console.error(`  FAILED:  ${email} - could not create or find`);
  return null;
}

async function seed() {
  console.log('Starting comprehensive database seed...\n');

  // ── Step 1: Departments ──
  console.log('[1/8] Departments');
  const { data: departments, error: deptErr } = await supabase
    .from('departments')
    .upsert([
      { name: 'CSE', full_name: 'Computer Science & Engineering' },
      { name: 'ECE', full_name: 'Electronics & Communication Engineering' },
      { name: 'ME', full_name: 'Mechanical Engineering' },
      { name: 'EE', full_name: 'Electrical Engineering' },
    ], { onConflict: 'name' })
    .select();

  if (deptErr) { console.error('Dept error:', deptErr.message); process.exit(1); }
  const cseDept = departments.find(d => d.name === 'CSE');
  const eceDept = departments.find(d => d.name === 'ECE');
  console.log(`  ${departments.length} departments ready\n`);

  // ── Step 2: Subjects ──
  console.log('[2/8] Subjects');
  const subjectsData = [
    { name: 'Mathematics-I', code: 'MA101', department_id: cseDept.id, semester: 1 },
    { name: 'Physics', code: 'PH101', department_id: cseDept.id, semester: 1 },
    { name: 'Programming in C', code: 'CS101', department_id: cseDept.id, semester: 1 },
    { name: 'Data Structures', code: 'CS201', department_id: cseDept.id, semester: 3 },
    { name: 'Database Systems', code: 'CS301', department_id: cseDept.id, semester: 5 },
    { name: 'Operating Systems', code: 'CS302', department_id: cseDept.id, semester: 5 },
    { name: 'Digital Electronics', code: 'EC101', department_id: eceDept.id, semester: 1 },
    { name: 'Signals & Systems', code: 'EC201', department_id: eceDept.id, semester: 3 },
  ];

  const { data: subjects, error: subErr } = await supabase
    .from('subjects')
    .upsert(subjectsData, { onConflict: 'code' })
    .select();

  if (subErr) { console.error('Subject error:', subErr.message); process.exit(1); }
  console.log(`  ${subjects.length} subjects ready\n`);

  // ── Step 3: Users ──
  console.log('[3/8] Users');
  const adminId = await ensureUser('admin@college.edu', 'admin123', 'Dr. Rajesh Kumar', 'hod');
  const principalId = await ensureUser('principal@college.edu', 'principal123', 'Dr. Suresh Sharma', 'principal');
  const teacherId = await ensureUser('teacher@college.edu', 'teacher123', 'Prof. Anita Desai', 'teacher');
  const teacher2Id = await ensureUser('teacher2@college.edu', 'teacher123', 'Prof. Vikram Singh', 'teacher');

  const studentEmails = [
    { email: 'student@college.edu', password: 'student123', name: 'Rahul Sharma', roll: '1PE22CS001', sem: 1 },
    { email: 'student2@college.edu', password: 'student123', name: 'Priya Patel', roll: '1PE22CS002', sem: 1 },
    { email: 'student3@college.edu', password: 'student123', name: 'Amit Kumar', roll: '1PE22CS003', sem: 1 },
    { email: 'student4@college.edu', password: 'student123', name: 'Sneha Reddy', roll: '1PE22CS004', sem: 1 },
    { email: 'student5@college.edu', password: 'student123', name: 'Vikash Yadav', roll: '1PE22CS005', sem: 1 },
    { email: 'student6@college.edu', password: 'student123', name: 'Meera Nair', roll: '1PE22CS006', sem: 1 },
    { email: 'student7@college.edu', password: 'student123', name: 'Karan Mehta', roll: '1PE22CS007', sem: 1 },
    { email: 'student8@college.edu', password: 'student123', name: 'Divya Joshi', roll: '1PE22CS008', sem: 1 },
  ];

  const studentUserIds = [];
  for (const s of studentEmails) {
    const uid = await ensureUser(s.email, s.password, s.name, 'student');
    studentUserIds.push({ uid, ...s });
  }
  console.log();

  // ── Step 4: Teacher records ──
  console.log('[4/8] Teacher records');

  if (adminId) {
    const { error } = await supabase.from('teachers').upsert({
      profile_id: adminId,
      department_id: cseDept.id,
      designation: 'Head of Department'
    }, { onConflict: 'profile_id' });
    if (error) console.error('  Admin teacher record error:', error.message);
  }

  let teacherRecordId = null;
  if (teacherId) {
    const { data: tRec, error } = await supabase.from('teachers').upsert({
      profile_id: teacherId,
      department_id: cseDept.id,
      designation: 'Assistant Professor'
    }, { onConflict: 'profile_id' }).select().single();
    if (error) console.error('  Teacher record error:', error.message);
    else teacherRecordId = tRec.id;
  }

  let teacher2RecordId = null;
  if (teacher2Id) {
    const { data: tRec, error } = await supabase.from('teachers').upsert({
      profile_id: teacher2Id,
      department_id: cseDept.id,
      designation: 'Associate Professor'
    }, { onConflict: 'profile_id' }).select().single();
    if (error) console.error('  Teacher2 record error:', error.message);
    else teacher2RecordId = tRec.id;
  }
  console.log('  Teacher records ready\n');

  // ── Step 5: Student records ──
  console.log('[5/8] Student records');
  const studentRecordIds = [];
  for (const s of studentUserIds) {
    if (!s.uid) { studentRecordIds.push(null); continue; }

    const { data: sRec, error } = await supabase.from('students').upsert({
      profile_id: s.uid,
      roll_no: s.roll,
      department_id: cseDept.id,
      batch: '2022',
      semester: s.sem,
      section: 'A'
    }, { onConflict: 'profile_id' }).select().single();

    if (error) {
      console.error(`  Student record error for ${s.email}:`, error.message);
      // Try with roll_no conflict
      const { data: sRec2, error: err2 } = await supabase.from('students').upsert({
        profile_id: s.uid,
        roll_no: s.roll,
        department_id: cseDept.id,
        batch: '2022',
        semester: s.sem,
        section: 'A'
      }, { onConflict: 'roll_no' }).select().single();
      if (err2) console.error(`  Retry error:`, err2.message);
      studentRecordIds.push(sRec2?.id ?? null);
    } else {
      studentRecordIds.push(sRec?.id ?? null);
    }
  }
  const validStudentIds = studentRecordIds.filter(Boolean);
  console.log(`  ${validStudentIds.length} student records ready\n`);

  // ── Step 6: Exams ──
  console.log('[6/8] Exams');

  // First delete existing exams to avoid conflicts (we'll recreate)
  // Actually, let's just insert new ones - use unique names
  const subjectMap = {};
  for (const s of subjects) {
    subjectMap[s.code] = s.id;
  }

  const createdBy = teacherId || adminId;
  const examDefinitions = [
    // Semester 1 CSE exams
    { name: 'Class Test 1 - Mathematics', type: 'class_test', subject_id: subjectMap['MA101'], max_marks: 50, exam_date: '2025-08-15', created_by: createdBy },
    { name: 'Mid Sem - Mathematics', type: 'mid_sem', subject_id: subjectMap['MA101'], max_marks: 100, exam_date: '2025-09-20', created_by: createdBy },
    { name: 'End Sem - Mathematics', type: 'end_sem', subject_id: subjectMap['MA101'], max_marks: 100, exam_date: '2025-11-25', created_by: createdBy },
    { name: 'Class Test 1 - Physics', type: 'class_test', subject_id: subjectMap['PH101'], max_marks: 50, exam_date: '2025-08-18', created_by: createdBy },
    { name: 'Mid Sem - Physics', type: 'mid_sem', subject_id: subjectMap['PH101'], max_marks: 100, exam_date: '2025-09-22', created_by: createdBy },
    { name: 'End Sem - Physics', type: 'end_sem', subject_id: subjectMap['PH101'], max_marks: 100, exam_date: '2025-11-28', created_by: createdBy },
    { name: 'Class Test 1 - C Programming', type: 'class_test', subject_id: subjectMap['CS101'], max_marks: 50, exam_date: '2025-08-20', created_by: createdBy },
    { name: 'Mid Sem - C Programming', type: 'mid_sem', subject_id: subjectMap['CS101'], max_marks: 100, exam_date: '2025-09-25', created_by: createdBy },
    { name: 'Lab Practical - C Programming', type: 'practical', subject_id: subjectMap['CS101'], max_marks: 50, exam_date: '2025-10-15', created_by: createdBy },
    { name: 'Assignment 1 - C Programming', type: 'assignment', subject_id: subjectMap['CS101'], max_marks: 25, exam_date: '2025-09-01', created_by: createdBy },
    { name: 'End Sem - C Programming', type: 'end_sem', subject_id: subjectMap['CS101'], max_marks: 100, exam_date: '2025-12-01', created_by: createdBy },
  ].filter(e => e.subject_id); // remove any with missing subject

  // Delete existing exams first to avoid duplicates
  console.log('  Clearing old exams/marks...');
  await supabase.from('marks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('exams').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data: exams, error: examErr } = await supabase
    .from('exams')
    .insert(examDefinitions)
    .select();

  if (examErr) { console.error('Exam error:', examErr.message); process.exit(1); }
  console.log(`  ${exams.length} exams created\n`);

  // ── Step 7: Marks ──
  console.log('[7/8] Marks');

  // Generate realistic marks for each student across each exam
  function randomMark(max, studentSkill) {
    // studentSkill is 0-1, higher = better student
    const base = max * (0.3 + studentSkill * 0.5); // 30% to 80% base
    const variance = max * 0.15 * (Math.random() - 0.5); // +/- 7.5%
    const mark = Math.round(Math.max(0, Math.min(max, base + variance)) * 10) / 10;
    return mark;
  }

  // Assign skill levels to students (some good, some at-risk)
  const skillLevels = [0.8, 0.9, 0.5, 0.7, 0.3, 0.85, 0.4, 0.65]; // varied performance

  const marksToInsert = [];
  for (let si = 0; si < validStudentIds.length; si++) {
    const studentId = validStudentIds[si];
    const skill = skillLevels[si] ?? 0.6;

    for (const exam of exams) {
      marksToInsert.push({
        student_id: studentId,
        exam_id: exam.id,
        marks_obtained: randomMark(exam.max_marks, skill),
        entered_by: createdBy
      });
    }
  }

  if (marksToInsert.length > 0) {
    const { error: marksErr } = await supabase
      .from('marks')
      .insert(marksToInsert);

    if (marksErr) {
      console.error('Marks error:', marksErr.message);
    } else {
      console.log(`  ${marksToInsert.length} marks entries created\n`);
    }
  }

  // ── Step 8: Feedback ──
  console.log('[8/8] Feedback');

  // Clear existing feedback
  await supabase.from('feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const feedbackTeacherId = teacherRecordId || teacher2RecordId;
  if (feedbackTeacherId && validStudentIds.length > 0) {
    const feedbackEntries = [
      {
        student_id: validStudentIds[0],
        teacher_id: feedbackTeacherId,
        subject_id: subjectMap['CS101'],
        type: 'appreciation',
        message: 'Excellent work on the C programming practical. Your code was clean and well-documented. Keep up the great work!',
        is_read: false
      },
      {
        student_id: validStudentIds[0],
        teacher_id: feedbackTeacherId,
        subject_id: subjectMap['MA101'],
        type: 'improvement',
        message: 'Your calculus foundations need strengthening. I recommend practicing more integration problems from the textbook chapters 4-6.',
        is_read: false
      },
      validStudentIds[1] && {
        student_id: validStudentIds[1],
        teacher_id: feedbackTeacherId,
        subject_id: subjectMap['PH101'],
        type: 'appreciation',
        message: 'Outstanding performance in the Physics mid-sem. Your understanding of mechanics concepts is impressive.',
        is_read: false
      },
      validStudentIds[2] && {
        student_id: validStudentIds[2],
        teacher_id: feedbackTeacherId,
        subject_id: subjectMap['CS101'],
        type: 'concern',
        message: 'Your attendance and assignment submissions have been inconsistent. Please meet me during office hours to discuss your progress.',
        is_read: false
      },
      validStudentIds[4] && {
        student_id: validStudentIds[4],
        teacher_id: feedbackTeacherId,
        subject_id: subjectMap['MA101'],
        type: 'concern',
        message: 'Your marks in Mathematics are below the passing threshold. I strongly recommend attending the remedial sessions every Friday.',
        is_read: false
      },
      validStudentIds[6] && {
        student_id: validStudentIds[6],
        teacher_id: feedbackTeacherId,
        type: 'improvement',
        message: 'You have potential but need to be more consistent with your studies. Try to maintain a study schedule and seek help when needed.',
        is_read: false
      },
      validStudentIds[3] && {
        student_id: validStudentIds[3],
        teacher_id: feedbackTeacherId,
        subject_id: subjectMap['PH101'],
        type: 'general',
        message: 'Good effort in the lab practical. Focus on improving your error analysis in the next experiment report.',
        is_read: true
      },
      validStudentIds[5] && {
        student_id: validStudentIds[5],
        teacher_id: feedbackTeacherId,
        subject_id: subjectMap['CS101'],
        type: 'appreciation',
        message: 'Your project submission was one of the best in class. The modular approach you took shows strong programming fundamentals.',
        is_read: false
      },
    ].filter(Boolean);

    const { error: fbErr } = await supabase.from('feedback').insert(feedbackEntries);
    if (fbErr) {
      console.error('Feedback error:', fbErr.message);
    } else {
      console.log(`  ${feedbackEntries.length} feedback entries created\n`);
    }
  } else {
    console.log('  Skipped (no teacher record or students)\n');
  }

  // ── Summary ──
  console.log('========================================');
  console.log('  Database seeded successfully!');
  console.log('========================================');
  console.log('');
  console.log('Test Accounts:');
  console.log('  Principal: principal@college.edu / principal123');
  console.log('  HOD/Admin: admin@college.edu     / admin123');
  console.log('  Teacher:   teacher@college.edu    / teacher123');
  console.log('  Student:   student@college.edu    / student123');
  console.log('  (8 students total, all use password: student123)');
  console.log('');
  console.log(`Data created:`);
  console.log(`  ${departments.length} departments`);
  console.log(`  ${subjects.length} subjects`);
  console.log(`  ${exams.length} exams`);
  console.log(`  ${marksToInsert.length} marks entries`);
  console.log(`  ${validStudentIds.length} students with marks`);
  console.log('========================================');
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
