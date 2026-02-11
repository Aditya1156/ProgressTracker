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

async function checkUsers() {
  console.log('Checking users in auth system...\n');

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total users: ${data.users.length}\n`);

  data.users.forEach(user => {
    console.log('---');
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log(`Role: ${user.user_metadata?.role || 'not set'}`);
    console.log(`Created: ${user.created_at}`);
  });

  // Check if teacher exists
  const teacher = data.users.find(u => u.email === 'teacher@college.edu');

  if (teacher) {
    console.log('\n✅ Teacher account exists');
    console.log('Checking profile and teacher record...');

    // Check profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', teacher.id)
      .single();

    console.log('Profile:', profile);

    // Check teacher record
    const { data: teacherRec } = await supabase
      .from('teachers')
      .select('*')
      .eq('profile_id', teacher.id)
      .single();

    console.log('Teacher record:', teacherRec);
  } else {
    console.log('\n❌ Teacher account NOT found');
  }
}

checkUsers();
