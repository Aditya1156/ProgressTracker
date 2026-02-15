/**
 * Add 2nd Year Section A students (Batch 2024, Semester 3)
 * Usage: node scripts/add-2nd-year-a.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gjdkuyzujvpmpjeyvqtk.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZGt1eXp1anZwbXBqZXl2cXRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0NzQ2OCwiZXhwIjoyMDg2MjIzNDY4fQ.GWgp6pRBidO1mOsxZV_-jLAWw2rRRU56irt49lPOrf0";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BATCH = "2024";
const SEMESTER = 3;
const SECTION = "A";
const DEPT_ID = "d1000000-0000-0000-0000-000000000001"; // CSE
const DEFAULT_PASSWORD = "student123";

const students = [
  ["4PM24CS001", "ABHISHEK V"],
  ["4PM24CS002", "ADITHYA KUMAR S"],
  ["4PM24CS003", "ADITHYA S"],
  ["4PM24CS004", "ADITYA HUBBALLI"],
  ["4PM24CS005", "AISHWARYA K"],
  ["4PM24CS006", "AISHWARYA YALLAPPA DALAWAI"],
  ["4PM24CS007", "AJITH KUMAR S H"],
  ["4PM24CS008", "AKASH MANJAPPA MADIVALAR"],
  ["4PM24CS009", "AKSHARI"],
  ["4PM24CS010", "AKSHATHA P M"],
  ["4PM24CS011", "AKSHATHA RATHOD"],
  ["4PM24CS012", "ALIYA SULTANA"],
  ["4PM24CS013", "AMRUTHA R"],
  ["4PM24CS014", "AMULYA K"],
  ["4PM24CS015", "ANANYA R"],
  ["4PM24CS016", "ANANYA S"],
  ["4PM24CS017", "ANKITHA B S"],
  ["4PM24CS018", "ARUN T V"],
  ["4PM24CS019", "ARYAN MOHITE"],
  ["4PM24CS020", "ATISHAY A JAIN"],
  ["4PM24CS021", "B L KASHYAPANANDA"],
  ["4PM24CS022", "BALAKRISHNA M S"],
  ["4PM24CS023", "BHAGYASHREE BASAVARAJ HOSAMANI"],
  ["4PM24CS024", "BIBI KHUZTEJA"],
  ["4PM24CS025", "BINDU S J"],
  ["4PM24CS026", "CHAITRA B"],
  ["4PM24CS027", "CHANDANA M"],
  ["4PM24CS028", "CHARAN S V"],
  ["4PM24CS029", "D G JANAKI"],
  ["4PM24CS030", "DARSHAN H V"],
  ["4PM24CS031", "DAVID BOON"],
  ["4PM24CS032", "DAYANANDA K S"],
  ["4PM24CS033", "DEEKSHITH K M"],
  ["4PM24CS034", "DEEPAK A S"],
  ["4PM24CS035", "DEEPIKA S"],
  ["4PM24CS036", "DEEPTHI R"],
  ["4PM24CS037", "DEVIKA S N"],
  ["4PM24CS038", "DHANALAKSHMI BAI M"],
  ["4PM24CS039", "DHANALAKSHMI H N"],
  ["4PM24CS040", "DISHA P"],
  ["4PM24CS041", "DIVYA R GOUDAR"],
  ["4PM24CS042", "DIVYA SHAMBULINGAPPA PATTANASHETTY"],
  ["4PM24CS043", "DIVYA SINGH N"],
  ["4PM24CS044", "G R YASHRAJ GOWDA"],
  ["4PM24CS045", "GAJANAN GOVIND GOWDA"],
  ["4PM24CS046", "GANGADHARA B"],
  ["4PM24CS047", "GLANSON D SOUZA"],
  ["4PM24CS048", "HALESH J K"],
  ["4PM24CS049", "HARSH RAJ GUPTA"],
  ["4PM24CS050", "HARSHA"],
  ["4PM24CS051", "HARSHA M"],
  ["4PM24CS052", "HARSHAVARDHAN S M"],
  ["4PM24CS053", "HARSHITHA D NANDA"],
  ["4PM24CS054", "HARSHITHA S P"],
  ["4PM24CS055", "HEMANTH M H"],
  ["4PM24CS056", "HEMANTH V NYAMAGOUDA"],
  ["4PM24CS057", "HEMANTH VASANTH A K"],
  ["4PM24CS058", "JAINYA N B"],
  ["4PM24CS059", "JEVAN U S"],
  ["4PM24CS060", "JEEVITHA E"],
];

async function main() {
  console.log(`Adding ${students.length} students — Batch ${BATCH}, Sem ${SEMESTER}, Section ${SECTION}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const [usn, name] of students) {
    const email = usn.toLowerCase() + "@college.edu";

    // 1. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name, role: "student" },
    });

    if (authErr) {
      if (authErr.message?.includes("already been registered")) {
        // User exists — make sure student row exists
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        if (existing) {
          // Ensure student record exists
          const { error: sErr } = await supabase.from("students").upsert(
            {
              profile_id: existing.id,
              roll_no: usn,
              department_id: DEPT_ID,
              batch: BATCH,
              semester: SEMESTER,
              section: SECTION,
            },
            { onConflict: "roll_no" }
          );
          if (sErr) {
            console.error(`  FAIL ${usn}: student upsert — ${sErr.message}`);
            failed++;
          } else {
            console.log(`  SKIP ${usn} ${name} (exists, ensured student row)`);
            skipped++;
          }
        } else {
          console.error(`  FAIL ${usn}: user exists but no profile`);
          failed++;
        }
        continue;
      }
      console.error(`  FAIL ${usn}: auth — ${authErr.message}`);
      failed++;
      continue;
    }

    const userId = authData.user.id;

    // 2. Create profile
    const { error: profErr } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: name,
      email,
      role: "student",
    });

    if (profErr) {
      console.error(`  FAIL ${usn}: profile — ${profErr.message}`);
      failed++;
      continue;
    }

    // 3. Create student record
    const { error: stuErr } = await supabase.from("students").insert({
      profile_id: userId,
      roll_no: usn,
      department_id: DEPT_ID,
      batch: BATCH,
      semester: SEMESTER,
      section: SECTION,
    });

    if (stuErr) {
      console.error(`  FAIL ${usn}: student — ${stuErr.message}`);
      failed++;
      continue;
    }

    console.log(`  OK   ${usn} ${name}`);
    created++;
  }

  console.log(`\n========================================`);
  console.log(`Created: ${created}  Skipped: ${skipped}  Failed: ${failed}`);
  console.log(`========================================`);

  // Verify
  const { data } = await supabase
    .from("students")
    .select("roll_no, section, semester")
    .eq("batch", BATCH)
    .eq("section", SECTION)
    .order("roll_no");

  console.log(`\nVerification: ${data?.length ?? 0} students in Batch ${BATCH} Section ${SECTION}`);
}

main().catch(console.error);
