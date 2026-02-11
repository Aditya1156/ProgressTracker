import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// First half of 6th sem CSE students
const students = [
  { usn: '4PM23CS001', name: 'ADARSH UMESH HEGDE' },
  { usn: '4PM23CS002', name: 'ADITYA KUMAR' },
  { usn: '4PM23CS003', name: 'AHMED SHAREEF' },
  { usn: '4PM23CS004', name: 'AISHWARYA K R' },
  { usn: '4PM23CS005', name: 'AISHWARYALAXMI' },
  { usn: '4PM23CS006', name: 'AKASH' },
  { usn: '4PM23CS007', name: 'ALOK HAVANAGI' },
  { usn: '4PM23CS008', name: 'AMRUTHA R H' },
  { usn: '4PM23CS009', name: 'ANAND HOLI' },
  { usn: '4PM23CS010', name: 'ANANYA K JOIS' },
  { usn: '4PM23CS011', name: 'ANISH M' },
  { usn: '4PM23CS012', name: 'ANKITHA B' },
  { usn: '4PM23CS013', name: 'ANKITHA C' },
  { usn: '4PM23CS014', name: 'ANKITHA N B' },
  { usn: '4PM23CS015', name: 'ANUSHA H M' },
  { usn: '4PM23CS016', name: 'B M BHARATH KUMAR' },
  { usn: '4PM23CS017', name: 'BHARGAVI S R' },
  { usn: '4PM23CS018', name: 'BHAVYA G S' },
  { usn: '4PM23CS019', name: 'CHANDANA B' },
  { usn: '4PM23CS020', name: 'CHANDRAPPA IRAPPA BANNIHATTI' },
  { usn: '4PM23CS021', name: 'CHETAN R J' },
  { usn: '4PM23CS022', name: 'CHETAN SATYEPPA MAGADUM' },
  { usn: '4PM23C0S23', name: 'CHINMAY S R' },
  { usn: '4PM23CS024', name: 'D R VIJAY' },
  { usn: '4PM23CS025', name: 'DASARI KEERTHAN DATTA' },
  { usn: '4PM23CS026', name: 'DEEKSHA J R' },
  { usn: '4PM23CS027', name: 'DHANYA P TIMALAPUR' },
  { usn: '4PM23CS028', name: 'DHRUVA PATEL H' },
  { usn: '4PM23CS029', name: 'DIVYA S K' },
  { usn: '4PM23CS030', name: 'DUTHI S M' },
  { usn: '4PM23CS031', name: 'G VARUN RAJU' },
  { usn: '4PM23CS032', name: 'GAGAN R BANGER' },
  { usn: '4PM23CS033', name: 'GAGANA J' },
  { usn: '4PM23CS034', name: 'GORAKATI CHAITANYA REDDY' },
  { usn: '4PM23CS035', name: 'GOWTHAM K' },
  { usn: '4PM23CS036', name: 'H GANESH' },
  { usn: '4PM23CS037', name: 'H N SPANDAN GOWDA' },
  { usn: '4PM23CS038', name: 'HARSHA D P' },
  { usn: '4PM23CS039', name: 'HARSHITHA B R' },
  { usn: '4PM23CS042', name: 'IMRAN BAIG' },
  { usn: '4PM23CS043', name: 'JAYASURYA V' },
  { usn: '4PM23CS044', name: 'JEEVANA KRISHNAMOORTI NAIK' },
  { usn: '4PM23CS045', name: 'JYOTI ASHOK HINDI' },
  { usn: '4PM23CS046', name: 'K C ASHWINI' },
  { usn: '4PM23CS047', name: 'K N NANDITHA' },
  { usn: '4PM23CS048', name: 'KAVANA A' },
  { usn: '4PM23CS049', name: 'KONA VENKATA SRUJANA SREE' },
  { usn: '4PM23CS050', name: 'LAVANYA J' },
  { usn: '4PM23CS051', name: 'LIKHITH GOWDA K N' },
  { usn: '4PM23CS052', name: 'LINGANAGOUDA SHADAKSHARAGOUDA PATIL' },
  { usn: '4PM23CS053', name: 'M C BINDU RANI' },
  { usn: '4PM23CS054', name: 'MAHANTESHA U' },
  { usn: '4PM23CS055', name: 'MAHERA MUSKAN' },
  { usn: '4PM23CS056', name: 'MANASA M P' },
  { usn: '4PM23CS057', name: 'MANASA N C' },
  { usn: '4PM23CS058', name: 'MANDARA G N' },
  { usn: '4PM23CS059', name: 'MANSI H J' },
  { usn: '4PM23CS061', name: 'MD ZULKERNAIN KHAN' },
  { usn: '4PM23CS062', name: 'MOHAMMED MAAZ F' },
  { usn: '4PM23CS063', name: 'MOHAMMED SAIF KATTIMANI' },
  { usn: '4PM23CS064', name: 'MUBARAK KHAN' },
  { usn: '4PM23CS065', name: 'NANDAN S P' },
  { usn: '4PM23CS066', name: 'NANDINI HOSAMANI' },
  { usn: '4PM24CS400', name: 'A R VAISHNAVI' },
  { usn: '4PM24CS401', name: 'BHUVAN S' },
  { usn: '4PM24CS402', name: 'CHETHAN K C' },
  { usn: '4PM23CS067', name: 'NIDA KHANUM' },
  { usn: '4PM23CS068', name: 'NISHAN K N' },
  { usn: '4PM23CS069', name: 'NISHANTH M R' }
];

async function addStudents() {
  console.log('🚀 Adding 6th semester CSE students...\n');

  try {
    // Get CSE department ID
    const { data: cseDept } = await supabase
      .from('departments')
      .select('id')
      .eq('name', 'CSE')
      .single();

    if (!cseDept) {
      console.error('❌ CSE department not found');
      return;
    }

    console.log(`📦 Found CSE department: ${cseDept.id}\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const student of students) {
      const email = `${student.usn.toLowerCase()}@student.college.edu`;
      const password = 'student123'; // Default password for all students

      try {
        // Create user account
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: student.name,
            role: 'student'
          }
        });

        if (userError) {
          if (userError.message.includes('already')) {
            console.log(`  ⚠️  ${student.usn} (${student.name}) - already exists`);
            skipCount++;
            continue;
          } else {
            throw userError;
          }
        }

        // Create profile
        await supabase.from('profiles').upsert({
          id: userData.user.id,
          full_name: student.name,
          email,
          role: 'student'
        });

        // Create student record
        await supabase.from('students').upsert({
          profile_id: userData.user.id,
          roll_no: student.usn,
          department_id: cseDept.id,
          batch: '2023',
          semester: 6
        }, { onConflict: 'profile_id' });

        console.log(`  ✓ ${student.usn} - ${student.name}`);
        successCount++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`  ❌ ${student.usn} - Error: ${error.message}`);
      }
    }

    console.log(`\n✅ Complete!`);
    console.log(`   Added: ${successCount} students`);
    console.log(`   Skipped: ${skipCount} students (already exist)`);
    console.log(`\n📧 All students can login with:`);
    console.log(`   Email: [usn]@student.college.edu`);
    console.log(`   Password: student123`);
    console.log(`   Example: 4pm23cs001@student.college.edu / student123`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addStudents();
