import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTeacher() {
  try {
    console.log('Creating teacher account...\n');

    // Get CSE department
    const { data: dept } = await supabase
      .from('departments')
      .select('*')
      .eq('name', 'CSE')
      .single();

    if (!dept) {
      console.error('❌ CSE department not found');
      return;
    }

    // Create teacher auth user
    const { data: teacher, error: teacherError } = await supabase.auth.admin.createUser({
      email: 'teacher@college.edu',
      password: 'teacher123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Dr. Rajesh Kumar',
        role: 'teacher'
      }
    });

    if (teacherError) {
      console.error('❌ Error creating teacher:', teacherError.message);
      return;
    }

    console.log('✅ Teacher auth user created');
    console.log('   Email: teacher@college.edu');
    console.log('   Password: teacher123');
    console.log('   ID:', teacher.user.id);

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: teacher.user.id,
      full_name: 'Dr. Rajesh Kumar',
      email: 'teacher@college.edu',
      role: 'teacher'
    });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      return;
    }

    console.log('✅ Profile created');

    // Create teacher record
    const { error: teacherRecError } = await supabase.from('teachers').insert({
      profile_id: teacher.user.id,
      department_id: dept.id,
      designation: 'Assistant Professor'
    });

    if (teacherRecError) {
      console.error('❌ Error creating teacher record:', teacherRecError.message);
      return;
    }

    console.log('✅ Teacher record created');
    console.log('\n🎉 Teacher account is ready to use!');
    console.log('\nLogin credentials:');
    console.log('  Email: teacher@college.edu');
    console.log('  Password: teacher123');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTeacher();
