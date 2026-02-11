import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Student data - 142 CS students for 6th semester, Section B
const students = [
  { usn: '4PM23CS001', name: 'Aarav Sharma' },
  { usn: '4PM23CS002', name: 'Vivaan Patel' },
  { usn: '4PM23CS003', name: 'Aditya Kumar' },
  { usn: '4PM23CS004', name: 'Vihaan Singh' },
  { usn: '4PM23CS005', name: 'Arjun Reddy' },
  { usn: '4PM23CS006', name: 'Sai Krishnan' },
  { usn: '4PM23CS007', name: 'Reyansh Gupta' },
  { usn: '4PM23CS008', name: 'Ayaan Nair' },
  { usn: '4PM23CS009', name: 'Krishna Iyer' },
  { usn: '4PM23CS010', name: 'Ishaan Mehta' },
  { usn: '4PM23CS011', name: 'Shaurya Verma' },
  { usn: '4PM23CS012', name: 'Atharv Joshi' },
  { usn: '4PM23CS013', name: 'Advait Rao' },
  { usn: '4PM23CS014', name: 'Pranav Desai' },
  { usn: '4PM23CS015', name: 'Kabir Shah' },
  { usn: '4PM23CS016', name: 'Dhruv Agarwal' },
  { usn: '4PM23CS017', name: 'Arnav Malhotra' },
  { usn: '4PM23CS018', name: 'Vedant Kulkarni' },
  { usn: '4PM23CS019', name: 'Aadhya Sharma' },
  { usn: '4PM23CS020', name: 'Ananya Patel' },
  { usn: '4PM23CS021', name: 'Diya Kumar' },
  { usn: '4PM23CS022', name: 'Navya Singh' },
  { usn: '4PM23CS023', name: 'Isha Reddy' },
  { usn: '4PM23CS024', name: 'Sara Krishnan' },
  { usn: '4PM23CS025', name: 'Myra Gupta' },
  { usn: '4PM23CS026', name: 'Anika Nair' },
  { usn: '4PM23CS027', name: 'Riya Iyer' },
  { usn: '4PM23CS028', name: 'Kiara Mehta' },
  { usn: '4PM23CS029', name: 'Saanvi Verma' },
  { usn: '4PM23CS030', name: 'Avni Joshi' },
  { usn: '4PM23CS031', name: 'Aditi Rao' },
  { usn: '4PM23CS032', name: 'Pari Desai' },
  { usn: '4PM23CS033', name: 'Ishita Shah' },
  { usn: '4PM23CS034', name: 'Siya Agarwal' },
  { usn: '4PM23CS035', name: 'Shanaya Malhotra' },
  { usn: '4PM23CS036', name: 'Anvi Kulkarni' },
  { usn: '4PM23CS037', name: 'Aryan Patel' },
  { usn: '4PM23CS038', name: 'Rohan Sharma' },
  { usn: '4PM23CS039', name: 'Karan Kumar' },
  { usn: '4PM23CS040', name: 'Nikhil Singh' },
  { usn: '4PM23CS041', name: 'Harsh Reddy' },
  { usn: '4PM23CS042', name: 'Dev Krishnan' },
  { usn: '4PM23CS043', name: 'Yash Gupta' },
  { usn: '4PM23CS044', name: 'Raj Nair' },
  { usn: '4PM23CS045', name: 'Tanish Iyer' },
  { usn: '4PM23CS046', name: 'Rudra Mehta' },
  { usn: '4PM23CS047', name: 'Shaan Verma' },
  { usn: '4PM23CS048', name: 'Shivansh Joshi' },
  { usn: '4PM23CS049', name: 'Aarav Rao' },
  { usn: '4PM23CS050', name: 'Lakshya Desai' },
  { usn: '4PM23CS051', name: 'Ritvik Shah' },
  { usn: '4PM23CS052', name: 'Aadi Agarwal' },
  { usn: '4PM23CS053', name: 'Krish Malhotra' },
  { usan: '4PM23CS054', name: 'Veer Kulkarni' },
  { usn: '4PM23CS055', name: 'Anaya Sharma' },
  { usn: '4PM23CS056', name: 'Zara Patel' },
  { usn: '4PM23CS057', name: 'Aanya Kumar' },
  { usn: '4PM23CS058', name: 'Pihu Singh' },
  { usn: '4PM23CS059', name: 'Vanya Reddy' },
  { usn: '4PM23CS060', name: 'Aara Krishnan' },
  { usn: '4PM23CS061', name: 'Ivana Gupta' },
  { usn: '4PM23CS062', name: 'Mira Nair' },
  { usn: '4PM23CS063', name: 'Tara Iyer' },
  { usn: '4PM23CS064', name: 'Alina Mehta' },
  { usn: '4PM23CS065', name: 'Ahana Verma' },
  { usn: '4PM23CS066', name: 'Nitya Joshi' },
  { usn: '4PM23CS067', name: 'Sana Rao' },
  { usn: '4PM23CS068', name: 'Ira Desai' },
  { usn: '4PM23CS069', name: 'Maira Shah' },
  { usn: '4PM23CS070', name: 'Amaira Agarwal' },
  { usn: '4PM23CS071', name: 'Mishka Malhotra' },
  { usn: '4PM23CS072', name: 'Navika Kulkarni' },
  { usn: '4PM23CS073', name: 'Aditya Raj' },
  { usn: '4PM23CS074', name: 'Virat Singh' },
  { usn: '4PM23CS075', name: 'Siddharth Kumar' },
  { usn: '4PM23CS076', name: 'Arjun Patel' },
  { usn: '4PM23CS077', name: 'Kartik Sharma' },
  { usn: '4PM23CS078', name: 'Manav Reddy' },
  { usn: '4PM23CS079', name: 'Naman Krishnan' },
  { usn: '4PM23CS080', name: 'Parth Gupta' },
  { usn: '4PM23CS081', name: 'Ranbir Nair' },
  { usn: '4PM23CS082', name: 'Sahil Iyer' },
  { usn: '4PM23CS083', name: 'Tavish Mehta' },
  { usn: '4PM23CS084', name: 'Uday Verma' },
  { usn: '4PM23CS085', name: 'Varun Joshi' },
  { usn: '4PM23CS086', name: 'Yuvraj Rao' },
  { usn: '4PM23CS087', name: 'Aarohi Desai' },
  { usn: '4PM23CS088', name: 'Dhriti Shah' },
  { usn: '4PM23CS089', name: 'Kavya Agarwal' },
  { usn: '4PM23CS090', name: 'Larisa Malhotra' },
  { usn: '4PM23CS091', name: 'Mahika Kulkarni' },
  { usn: '4PM23CS092', name: 'Naina Sharma' },
  { usn: '4PM23CS093', name: 'Prisha Patel' },
  { usn: '4PM23CS094', name: 'Ridhi Kumar' },
  { usn: '4PM23CS095', name: 'Shanvi Singh' },
  { usn: '4PM23CS096', name: 'Tanya Reddy' },
  { usn: '4PM23CS097', name: 'Vani Krishnan' },
  { usn: '4PM23CS098', name: 'Aashi Gupta' },
  { usn: '4PM23CS099', name: 'Bhavya Nair' },
  { usn: '4PM23CS100', name: 'Charvi Iyer' },
  { usn: '4PM23CS101', name: 'Divya Mehta' },
  { usn: '4PM23CS102', name: 'Gauri Verma' },
  { usn: '4PM23CS103', name: 'Hriday Joshi' },
  { usn: '4PM23CS104', name: 'Ishaan Rao' },
  { usn: '4PM23CS105', name: 'Jhanvi Desai' },
  { usn: '4PM23CS106', name: 'Kavish Shah' },
  { usn: '4PM23CS107', name: 'Lavanya Agarwal' },
  { usn: '4PM23CS108', name: 'Moksh Malhotra' },
  { usn: '4PM23CS109', name: 'Nehaan Kulkarni' },
  { usn: '4PM23CS110', name: 'Om Sharma' },
  { usn: '4PM23CS111', name: 'Prithvi Patel' },
  { usn: '4PM23CS112', name: 'Rachit Kumar' },
  { usn: '4PM23CS113', name: 'Samay Singh' },
  { usn: '4PM23CS114', name: 'Tejas Reddy' },
  { usn: '4PM23CS115', name: 'Utkarsh Krishnan' },
  { usn: '4PM23CS116', name: 'Vihaan Gupta' },
  { usn: '4PM23CS117', name: 'Advika Nair' },
  { usn: '4PM23CS118', name: 'Brinda Iyer' },
  { usn: '4PM23CS119', name: 'Chitra Mehta' },
  { usn: '4PM23CS120', name: 'Drishti Verma' },
  { usn: '4PM23CS121', name: 'Ekta Joshi' },
  { usn: '4PM23CS122', name: 'Falak Rao' },
  { usn: '4PM23CS123', name: 'Geetika Desai' },
  { usn: '4PM23CS124', name: 'Harini Shah' },
  { usn: '4PM23CS125', name: 'Inaya Agarwal' },
  { usn: '4PM23CS126', name: 'Jiya Malhotra' },
  { usn: '4PM23CS127', name: 'Kashvi Kulkarni' },
  { usn: '4PM23CS128', name: 'Lara Sharma' },
  { usn: '4PM23CS129', name: 'Meera Patel' },
  { usn: '4PM23CS130', name: 'Nidhi Kumar' },
  { usn: '4PM23CS131', name: 'Oviya Singh' },
  { usn: '4PM23CS132', name: 'Palak Reddy' },
  { usn: '4PM23CS133', name: 'Rhea Krishnan' },
  { usn: '4PM23CS134', name: 'Swara Gupta' },
  { usn: '4PM23CS135', name: 'Tanvi Nair' },
  { usn: '4PM23CS136', name: 'Unnati Iyer' },
  { usn: '4PM23CS137', name: 'Vaani Mehta' },
  { usn: '4PM23CS138', name: 'Yamini Verma' },
  { usn: '4PM22CS001', name: 'Zubin Joshi' },
  { usn: '4PM22CS002', name: 'Aarush Rao' },
  { usn: '4PM22CS003', name: 'Bharat Desai' }
];

console.log('🚀 Starting bulk student addition...\n');
console.log(`📊 Total students to add: ${students.length}\n`);

// Get CS department ID
async function getCSEDepartmentId() {
  const { data, error } = await supabase
    .from('departments')
    .select('id')
    .eq('code', 'CSE')
    .single();

  if (error) {
    console.error('❌ Error fetching CSE department:', error.message);
    return null;
  }

  return data?.id;
}

async function addStudents() {
  const departmentId = await getCSEDepartmentId();

  if (!departmentId) {
    console.error('❌ CSE department not found. Please create it first.');
    return;
  }

  console.log(`✅ Found CSE department: ${departmentId}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const student of students) {
    try {
      const email = `${student.usn.toLowerCase()}@college.edu`;

      // Note: We cannot create auth users via the anon key
      // This script will only create student records
      // Auth users need to be created via Supabase Dashboard or service role key

      console.log(`Adding student: ${student.usn} - ${student.name}`);

      // Check if student already exists
      const { data: existing } = await supabase
        .from('students')
        .select('usn')
        .eq('usn', student.usn)
        .single();

      if (existing) {
        console.log(`  ⚠️  Student ${student.usn} already exists, skipping...`);
        continue;
      }

      // Insert student record
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          usn: student.usn,
          name: student.name,
          semester: 6,
          section: 'B',
          batch: '2023',
          department_id: departmentId
        });

      if (studentError) {
        console.log(`  ❌ Error: ${studentError.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ Added successfully`);
        successCount++;
      }

    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(50));

  console.log('\n⚠️  IMPORTANT:');
  console.log('This script only creates student records in the database.');
  console.log('To create auth users and profiles, you need to run the SQL script');
  console.log('via Supabase Dashboard SQL Editor:');
  console.log('👉 supabase/add-cs-students-6th-sem.sql\n');
}

// Run the script
addStudents().catch(console.error);
