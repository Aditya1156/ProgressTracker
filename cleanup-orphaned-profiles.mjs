import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.argv[2];

if (!serviceRoleKey) {
  console.error('❌ Please provide service role key as argument');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Finding orphaned profiles...\n');

async function cleanup() {
  // Get all auth users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error listing users:', authError.message);
    return;
  }

  console.log(`📊 Auth users: ${users.length}`);

  // Get all valid auth user IDs
  const validAuthIds = new Set(users.map(u => u.id));

  // Get all profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role');

  if (profileError) {
    console.error('❌ Error listing profiles:', profileError.message);
    return;
  }

  console.log(`📊 Total profiles: ${profiles.length}\n`);

  // Find orphaned profiles (profiles without auth users)
  const orphanedProfiles = profiles.filter(p => !validAuthIds.has(p.id));

  console.log(`📊 Orphaned profiles found: ${orphanedProfiles.length}\n`);

  if (orphanedProfiles.length === 0) {
    console.log('✅ No orphaned profiles found!');
    return;
  }

  // Show sample of what will be deleted
  console.log('Sample of orphaned profiles to delete:');
  orphanedProfiles.slice(0, 10).forEach(p => {
    console.log(`  - ${p.email} (${p.full_name}) - Role: ${p.role}`);
  });

  if (orphanedProfiles.length > 10) {
    console.log(`  ... and ${orphanedProfiles.length - 10} more\n`);
  }

  console.log('\n⚠️  Starting deletion in 3 seconds... (Press Ctrl+C to cancel)\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  let deletedProfiles = 0;
  let deletedStudents = 0;
  let errors = 0;

  for (const profile of orphanedProfiles) {
    try {
      // Delete associated student records first
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('profile_id', profile.id);

      if (!studentError) {
        deletedStudents++;
      }

      // Delete the profile
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (profileDeleteError) {
        console.log(`❌ Error deleting profile ${profile.email}: ${profileDeleteError.message}`);
        errors++;
      } else {
        deletedProfiles++;
        if (deletedProfiles % 10 === 0) {
          console.log(`✅ Deleted ${deletedProfiles} profiles so far...`);
        }
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 CLEANUP SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Deleted profiles: ${deletedProfiles}`);
  console.log(`✅ Deleted student records: ${deletedStudents}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Remaining profiles: ${profiles.length - deletedProfiles}`);
  console.log('='.repeat(60));
  console.log('\n✨ Cleanup complete!');
}

cleanup().catch(console.error).finally(() => process.exit(0));
