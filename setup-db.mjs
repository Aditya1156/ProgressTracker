import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('📦 Reading schema.sql...');
    const schema = readFileSync('supabase/schema.sql', 'utf-8');

    console.log('🔧 Executing schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schema });

    if (schemaError) {
      // Try alternative method - split and execute statements
      console.log('⚠️  Direct execution not available, trying alternative method...');
      console.log('Please run the SQL files manually in Supabase Dashboard:');
      console.log('1. Go to: https://supabase.com/dashboard/project/gjdkuyzujvpmpjeyvqtk/sql/new');
      console.log('2. Copy contents from: supabase/schema.sql');
      console.log('3. Run the SQL');
      console.log('4. Then copy contents from: supabase/seed.sql');
      console.log('5. Run the SQL');
      process.exit(1);
    }

    console.log('✅ Schema created successfully!');

    console.log('📦 Reading seed.sql...');
    const seed = readFileSync('supabase/seed.sql', 'utf-8');

    console.log('🌱 Seeding database...');
    const { error: seedError } = await supabase.rpc('exec_sql', { sql: seed });

    if (seedError) {
      console.error('❌ Error seeding database:', seedError);
      process.exit(1);
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n🎉 Database setup complete!');
    console.log('\nTest Accounts:');
    console.log('Admin: admin@college.edu / admin123');
    console.log('Teacher: teacher@college.edu / teacher123');
    console.log('Student: student@college.edu / student123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
