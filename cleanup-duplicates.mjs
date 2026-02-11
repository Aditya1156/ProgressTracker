import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// We need service role key for this operation
const serviceRoleKey = process.argv[2];

if (!serviceRoleKey) {
  console.error('❌ Please provide service role key as argument:');
  console.error('   node cleanup-duplicates.mjs YOUR_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Finding duplicate users...\n');

async function cleanup() {
  // Get all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error listing users:', error.message);
    return;
  }

  console.log(`📊 Total users in auth: ${users.length}\n`);

  // Find duplicates (users with @student.college.edu that have @college.edu counterparts)
  const toDelete = [];
  const collegeUsers = new Set();
  const studentCollegeUsers = [];

  for (const user of users) {
    if (user.email.endsWith('@college.edu') && !user.email.includes('@student.')) {
      collegeUsers.add(user.email);
    } else if (user.email.endsWith('@student.college.edu')) {
      studentCollegeUsers.push(user);
    }
  }

  // Find which @student.college.edu users have @college.edu duplicates
  for (const user of studentCollegeUsers) {
    const baseEmail = user.email.replace('@student.college.edu', '@college.edu');
    if (collegeUsers.has(baseEmail)) {
      toDelete.push(user);
      console.log(`🗑️  Will delete: ${user.email} (duplicate of ${baseEmail})`);
    }
  }

  if (toDelete.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  console.log(`\n📊 Found ${toDelete.length} duplicate users to delete\n`);
  console.log('⚠️  Starting deletion in 3 seconds... (Press Ctrl+C to cancel)\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  let deleted = 0;
  let errors = 0;

  for (const user of toDelete) {
    try {
      // Delete auth user (this will cascade to profile and student if properly configured)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.log(`❌ Error deleting ${user.email}: ${deleteError.message}`);
        errors++;
      } else {
        console.log(`✅ Deleted: ${user.email}`);
        deleted++;
      }
    } catch (err) {
      console.log(`❌ Exception deleting ${user.email}: ${err.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 CLEANUP SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Deleted: ${deleted}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Remaining users: ${users.length - deleted}`);
  console.log('='.repeat(60));
}

cleanup().catch(console.error).finally(() => process.exit(0));
