import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Step 1: Create departments
    console.log('📦 Creating departments...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .upsert([
        { name: 'CSE', full_name: 'Computer Science & Engineering' },
        { name: 'ECE', full_name: 'Electronics & Communication Engineering' },
        { name: 'ME', full_name: 'Mechanical Engineering' },
        { name: 'EE', full_name: 'Electrical Engineering' },
      ], { onConflict: 'name' })
      .select();

    if (deptError) throw deptError;

    const cseDept = departments.find(d => d.name === 'CSE');
    console.log('✅ Departments created\n');

    // Step 2: Create subjects
    console.log('📚 Creating subjects...');
    const { error: subjectError } = await supabase
      .from('subjects')
      .upsert([
        { name: 'Mathematics-I', code: 'MA101', department_id: cseDept.id, semester: 1 },
        { name: 'Physics', code: 'PH101', department_id: cseDept.id, semester: 1 },
        { name: 'Programming in C', code: 'CS101', department_id: cseDept.id, semester: 1 },
        { name: 'Data Structures', code: 'CS201', department_id: cseDept.id, semester: 3 },
        { name: 'Database Systems', code: 'CS301', department_id: cseDept.id, semester: 5 },
      ], { onConflict: 'code' })
      .select();

    if (subjectError) throw subjectError;
    console.log('✅ Subjects created\n');

    // Step 3: Create users
    console.log('👥 Creating users...');

    // Admin
    const { data: admin, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@college.edu',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        role: 'hod'
      }
    });

    if (adminError) {
      if (adminError.message.includes('already')) {
        console.log('  ℹ️  Admin user already exists');
      } else {
        throw adminError;
      }
    } else {
      console.log('  ✓ Admin created: admin@college.edu / admin123');
    }

    // Teacher
    const { data: teacher, error: teacherError } = await supabase.auth.admin.createUser({
      email: 'teacher@college.edu',
      password: 'teacher123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Teacher User',
        role: 'teacher'
      }
    });

    if (teacherError) {
      if (teacherError.message.includes('already')) {
        console.log('  ℹ️  Teacher user already exists');
      } else {
        throw teacherError;
      }
    } else {
      console.log('  ✓ Teacher created: teacher@college.edu / teacher123');
    }

    // Student
    const { data: student, error: studentError } = await supabase.auth.admin.createUser({
      email: 'student@college.edu',
      password: 'student123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Student User',
        role: 'student'
      }
    });

    if (studentError) {
      if (studentError.message.includes('already')) {
        console.log('  ℹ️  Student user already exists');
      } else {
        throw studentError;
      }
    } else {
      console.log('  ✓ Student created: student@college.edu / student123');
    }

    console.log('✅ Users created\n');

    // Step 4: Get user IDs and update profiles
    console.log('📝 Setting up profiles...');
    const { data: usersData } = await supabase.auth.admin.listUsers();

    const adminUser = usersData.users.find(u => u.email === 'admin@college.edu');
    const teacherUser = usersData.users.find(u => u.email === 'teacher@college.edu');
    const studentUser = usersData.users.find(u => u.email === 'student@college.edu');

    if (adminUser) {
      await supabase.from('profiles').upsert({
        id: adminUser.id,
        full_name: 'Admin User',
        email: 'admin@college.edu',
        role: 'hod'
      });
    }

    let teacherId;
    if (teacherUser) {
      await supabase.from('profiles').upsert({
        id: teacherUser.id,
        full_name: 'Teacher User',
        email: 'teacher@college.edu',
        role: 'teacher'
      });

      // Create teacher record
      const { data: teacherRec } = await supabase.from('teachers').upsert({
        profile_id: teacherUser.id,
        department_id: cseDept.id,
        designation: 'Assistant Professor'
      }, { onConflict: 'profile_id' }).select().single();

      teacherId = teacherRec?.id;
    }

    let studentId;
    if (studentUser) {
      await supabase.from('profiles').upsert({
        id: studentUser.id,
        full_name: 'Student User',
        email: 'student@college.edu',
        role: 'student'
      });

      // Create student record
      const { data: studentRec } = await supabase.from('students').upsert({
        profile_id: studentUser.id,
        roll_no: '2024CSE001',
        department_id: cseDept.id,
        batch: '2024',
        semester: 1
      }, { onConflict: 'profile_id' }).select().single();

      studentId = studentRec?.id;
    }

    console.log('✅ Profiles and records created\n');

    // Step 5: Get subject IDs
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, code')
      .in('code', ['MA101', 'CS101', 'PH101']);

    const mathSubject = subjects.find(s => s.code === 'MA101');
    const cProgramming = subjects.find(s => s.code === 'CS101');
    const physics = subjects.find(s => s.code === 'PH101');

    // Step 6: Create sample exams
    console.log('📋 Creating sample exams...');
    if (teacherUser && studentUser && mathSubject && cProgramming && physics) {
      const { data: exams, error: examError } = await supabase.from('exams').upsert([
        {
          name: 'Mid Sem Mathematics-I',
          type: 'mid_sem',
          subject_id: mathSubject.id,
          max_marks: 100,
          exam_date: '2025-01-15',
          created_by: teacherUser.id
        },
        {
          name: 'Class Test 1 - C Programming',
          type: 'class_test',
          subject_id: cProgramming.id,
          max_marks: 50,
          exam_date: '2025-01-10',
          created_by: teacherUser.id
        },
        {
          name: 'Mid Sem Physics',
          type: 'mid_sem',
          subject_id: physics.id,
          max_marks: 100,
          exam_date: '2025-01-20',
          created_by: teacherUser.id
        }
      ]).select();

      if (examError) throw examError;
      console.log('✅ Sample exams created\n');

      // Step 7: Create sample marks
      if (exams && exams.length > 0 && studentId) {
        console.log('📊 Creating sample marks...');
        const { error: marksError } = await supabase.from('marks').upsert([
          {
            student_id: studentId,
            exam_id: exams[0].id,
            marks_obtained: 85.0,
            entered_by: teacherUser.id
          },
          {
            student_id: studentId,
            exam_id: exams[1].id,
            marks_obtained: 42.0,
            entered_by: teacherUser.id
          },
          {
            student_id: studentId,
            exam_id: exams[2].id,
            marks_obtained: 78.0,
            entered_by: teacherUser.id
          }
        ], { onConflict: 'student_id,exam_id' });

        if (marksError) throw marksError;
        console.log('✅ Sample marks created\n');
      }

      // Step 8: Create sample feedback
      if (teacherId && studentId && cProgramming) {
        console.log('💬 Creating sample feedback...');
        const { error: feedbackError } = await supabase.from('feedback').insert([
          {
            student_id: studentId,
            teacher_id: teacherId,
            subject_id: cProgramming.id,
            type: 'improvement',
            message: 'Good progress in C programming. Focus more on pointers and memory management.'
          }
        ]);

        if (feedbackError && !feedbackError.message.includes('duplicate')) {
          console.log('⚠️  Feedback may already exist, skipping...');
        } else {
          console.log('✅ Sample feedback created\n');
        }
      }
    }

    console.log('\n🎉 Database setup complete!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 Test Accounts:');
    console.log('═══════════════════════════════════════');
    console.log('Admin:   admin@college.edu    / admin123');
    console.log('Teacher: teacher@college.edu  / teacher123');
    console.log('Student: student@college.edu  / student123');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupDatabase();
