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

async function findTeacher() {
  try {
    console.log('Searching for teacher@college.edu...\n');

    // List all users with pagination
    let allUsers = [];
    let page = 1;
    let perPage = 1000;

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage
      });

      if (error) {
        console.error('Error:', error);
        break;
      }

      allUsers = allUsers.concat(data.users);
      console.log(`  Fetched ${data.users.length} users on page ${page}...`);

      if (data.users.length < perPage) {
        break;
      }

      page++;
    }

    console.log(`\nTotal users: ${allUsers.length}\n`);

    // Find teacher
    const teacher = allUsers.find(u => u.email === 'teacher@college.edu');
    const admin = allUsers.find(u => u.email === 'admin@college.edu');

    if (admin) {
      console.log('✅ Admin found:', admin.id);
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', admin.id)
        .single();
      console.log('   Profile:', adminProfile);
    }

    if (teacher) {
      console.log('\n✅ Teacher found:', teacher.id);
      console.log('   Email:', teacher.email);
      console.log('   Created:', teacher.created_at);
      console.log('   Role:', teacher.user_metadata?.role);

      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', teacher.id)
        .single();

      if (profileError) {
        console.log('   ❌ Profile error:', profileError.message);
      } else {
        console.log('   ✅ Profile exists:', profile);
      }

      // Check teacher record
      const { data: teacherRec, error: teacherRecError } = await supabase
        .from('teachers')
        .select('*')
        .eq('profile_id', teacher.id)
        .single();

      if (teacherRecError) {
        console.log('   ❌ Teacher record error:', teacherRecError.message);
      } else {
        console.log('   ✅ Teacher record exists:', teacherRec);
      }

      // Try to reset password
      console.log('\n🔑 Resetting teacher password to: teacher123');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        teacher.id,
        { password: 'teacher123' }
      );

      if (updateError) {
        console.log('   ❌ Error resetting password:', updateError.message);
      } else {
        console.log('   ✅ Password reset successful');
      }

    } else {
      console.log('\n❌ Teacher NOT found in auth system');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

findTeacher();
