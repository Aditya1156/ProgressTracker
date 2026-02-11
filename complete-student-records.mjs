import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

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
  { usn: '4PM23CS069', name: 'NISHANTH M R' },
  { usn: '4PM23CS070', name: 'PALLETI PRADEEPA' },
  { usn: '4PM23CS071', name: 'PAVAN KUMAR' },
  { usn: '4PM23CS072', name: 'POOJA S' },
  { usn: '4PM23CS073', name: 'POORVIKA J GOWDA' },
  { usn: '4PM23CS074', name: 'PRACHI YADAV' },
  { usn: '4PM23CS075', name: 'PRAHLAD P PATIL' },
  { usn: '4PM23CS076', name: 'PRAJWAL K H' },
  { usn: '4PM23CS077', name: 'PRANATH K J' },
  { usn: '4PM23CS078', name: 'PRASHANTH C' },
  { usn: '4PM23CS079', name: 'PREMA R B' },
  { usn: '4PM23CS080', name: 'PRIYA R G' },
  { usn: '4PM23CS081', name: 'PUSHKAR RAJ PUROHIT' },
  { usn: '4PM23CS082', name: 'RACHANA D' },
  { usn: '4PM23CS083', name: 'RAKSHITHA RAMESH KURDEKAR' },
  { usn: '4PM23CS084', name: 'RAMYA VIJAYKUMAR KATTI' },
  { usn: '4PM23CS085', name: 'RANJITH T H' },
  { usn: '4PM23CS086', name: 'ROHITH D K' },
  { usn: '4PM23CS087', name: 'S B SINCHANA' },
  { usn: '4PM23CS088', name: 'S U GAYATRI' },
  { usn: '4PM23CS089', name: 'SAHANA H M' },
  { usn: '4PM23CS090', name: 'SAHANA PRABULINGAPPA KAJJERA' },
  { usn: '4PM23CS091', name: 'SAHANA R MIRAJAKAR' },
  { usn: '4PM23CS092', name: 'SAMARTHA B' },
  { usn: '4PM23CS093', name: 'SANJANA K KUBASADA' },
  { usn: '4PM23CS094', name: 'SANJAY A' },
  { usn: '4PM23CS095', name: 'SANKALPA V HEGDE' },
  { usn: '4PM23CS096', name: 'SATHVIK D' },
  { usn: '4PM23CS097', name: 'SHASHANK KUMAR G N' },
  { usn: '4PM23CS098', name: 'SHASHANK V S' },
  { usn: '4PM23CS099', name: 'SHIVAJI KULKARNI' },
  { usn: '4PM23CS101', name: 'SHUBHAM KUMAR SINGH' },
  { usn: '4PM23CS102', name: 'SMITHA SUBHASH ISARAGONDA' },
  { usn: '4PM23CS103', name: 'SNEHA T' },
  { usn: '4PM23CS104', name: 'SOMANATH MOTAGI' },
  { usn: '4PM23CS105', name: 'SOUMYA GURUPADAYYA HIREMATH' },
  { usn: '4PM23CS106', name: 'SOUMYA M GALABHI' },
  { usn: '4PM23CS107', name: 'SRUSHTI M V' },
  { usn: '4PM23CS108', name: 'SUHAS PATEL N' },
  { usn: '4PM23CS109', name: 'SUHASINI H PUJAR' },
  { usn: '4PM23CS110', name: 'SUSHMA MARUTI JADHAV' },
  { usn: '4PM23CS111', name: 'SWAYAM DATTATRAY' },
  { usn: '4PM23CS112', name: 'T A ANANTHA KRISHNA' },
  { usn: '4PM23CS113', name: 'THANUSHREE K H' },
  { usn: '4PM23CS114', name: 'THEJAS GOWDA H J' },
  { usn: '4PM23CS115', name: 'THRISHA A P' },
  { usn: '4PM23CS116', name: 'TRISHA VISHWANATH BALI' },
  { usn: '4PM23CS117', name: 'TUSHAR D G' },
  { usn: '4PM23CS119', name: 'VEDHA P TUMMINAKATTI' },
  { usn: '4PM23CS120', name: 'VEERENDRA K J' },
  { usn: '4PM23CS121', name: 'VIKAS NAIK' },
  { usn: '4PM23CS122', name: 'VIKAS U G' },
  { usn: '4PM23CS124', name: 'YELLAMLA BHAVANI' },
  { usn: '4PM23CS125', name: 'YUSRA SADIYAH SHAIKH' },
  { usn: '4PM23CS126', name: 'GUNAVATHI G R' },
  { usn: '4PM24CS403', name: 'MALLANNA RAJU KARU' },
  { usn: '4PM24CS404', name: 'MOHAMMED SHAKIR MADANI' },
  { usn: '4PM24CS405', name: 'NIKITHA HUBLIKAR' },
  { usn: '4PM24CS406', name: 'PAVAN G' },
  { usn: '4PM24CS407', name: 'RABIYA BASARI' },
  { usn: '4PM24CS408', name: 'SACHIN MALLAPPA ADI' },
  { usn: '4PM24CS409', name: 'SHRIDHAR K' },
  { usn: '4PM24CS410', name: 'TEJASWINI K S' },
  { usn: '4PM24CS411', name: 'VIGHNESH C' },
  { usn: '4PM22CS003', name: 'ABHISHEK S' }
];

console.log('🚀 Creating student records for existing users...\n');

async function completeRecords() {
  // Get CSE department
  const { data: dept } = await supabase.from('departments').select('id').eq('name', 'CSE').single();
  const departmentId = dept.id;

  console.log(`✅ CSE Department: ${departmentId}\n`);

  let created = 0, skipped = 0, errors = 0;

  for (const student of students) {
    try {
      const email = `${student.usn.toLowerCase()}@college.edu`;

      // Get profile ID from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!profile) {
        console.log(`❌ ${student.usn}: Profile not found`);
        errors++;
        continue;
      }

      // Check if student record exists
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (existing) {
        console.log(`⚠️  ${student.usn}: Already exists`);
        skipped++;
        continue;
      }

      // Create student record
      const { error } = await supabase
        .from('students')
        .insert({
          profile_id: profile.id,
          roll_no: student.usn,
          department_id: departmentId,
          batch: '2023',
          semester: 6,
          section: 'B'
        });

      if (error) {
        console.log(`❌ ${student.usn}: ${error.message}`);
        errors++;
      } else {
        console.log(`✅ ${student.usn}: Created`);
        created++;
      }
    } catch (err) {
      console.log(`❌ ${student.usn}: ${err.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Created: ${created}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60));
  console.log('\n🎉 All student records completed!');
  console.log('📧 Students can login: usn@college.edu');
  console.log('🔑 Password: student123\n');
}

completeRecords().catch(console.error).finally(() => process.exit(0));
