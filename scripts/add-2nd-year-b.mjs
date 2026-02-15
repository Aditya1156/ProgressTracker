/**
 * Add 2nd Year Section B students (Batch 2024, Semester 3)
 * Usage: node scripts/add-2nd-year-b.mjs
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
const SECTION = "B";
const DEPT_ID = "d1000000-0000-0000-0000-000000000001";
const DEFAULT_PASSWORD = "student123";

const students = [
  ["4PM24CS061", "JEEVITHA S"],
  ["4PM24CS062", "KANCHANA M S"],
  ["4PM24CS063", "KARTHIK Y"],
  ["4PM24CS064", "KAVYA RAMESH TELI"],
  ["4PM24CS065", "KEERTHANA H S"],
  ["4PM24CS066", "KEERTHANA S"],
  ["4PM24CS067", "KIRAN T P"],
  ["4PM24CS068", "KSHITIJ KALAL"],
  ["4PM24CS069", "LAKSHMI SANNAGOUDA JOGIHALLI"],
  ["4PM24CS070", "LATA V KADAPPANAVAR"],
  ["4PM24CS071", "LAVANYA P"],
  ["4PM24CS072", "MADHUMALA G N"],
  ["4PM24CS073", "MANOJ KUMAR S"],
  ["4PM24CS074", "MANOJKUMAR SANGANAL"],
  ["4PM24CS075", "MANYA S N"],
  ["4PM24CS076", "MEENAKSHI K"],
  ["4PM24CS077", "MEGHARAJ K S"],
  ["4PM24CS078", "MEHNAAZ KHANUM"],
  ["4PM24CS079", "MONIKA N"],
  ["4PM24CS080", "MRUDULA R"],
  ["4PM24CS081", "MUHAIMIN FATHIMA"],
  ["4PM24CS082", "NAMRATHA N"],
  ["4PM24CS083", "NANDISH S L"],
  ["4PM24CS084", "NAYANA B U"],
  ["4PM24CS085", "NAYANA M"],
  ["4PM24CS086", "NEHA V JADHAV"],
  ["4PM24CS087", "NIKHITA SHAHAPUR"],
  ["4PM24CS088", "NIRIKSHA R MUTTUR"],
  ["4PM24CS089", "NIRMALA B R"],
  ["4PM24CS090", "NISHKALA K R"],
  ["4PM24CS091", "NIVEDITHA S P"],
  ["4PM24CS092", "PALLAVI SHIVARAJ JAKKAVAR"],
  ["4PM24CS093", "PAVANA KUMARA G H"],
  ["4PM24CS094", "PAVANI S"],
  ["4PM24CS095", "POORVIKA S BHAT"],
  ["4PM24CS096", "PRAJNA N"],
  ["4PM24CS097", "PRAJWAL H"],
  ["4PM24CS098", "PRAJWAL M MALAGI"],
  ["4PM24CS099", "PRAJWAL SHIVAPUTRA SONTANUR"],
  ["4PM24CS100", "PRARTHANA N"],
  ["4PM24CS101", "PRASANNA D S"],
  ["4PM24CS102", "PRASANNAKUMAR BADIGER"],
  ["4PM24CS103", "PRATHEEK K P"],
  ["4PM24CS104", "PRIYA M"],
  ["4PM24CS105", "PRUTHVI A"],
  ["4PM24CS106", "PRUTHVI PATEL C"],
  ["4PM24CS107", "PRUTHWI S"],
  ["4PM24CS108", "R SANJAY"],
  ["4PM24CS109", "RACHANA H"],
  ["4PM24CS110", "RACHANA R"],
  ["4PM24CS111", "RAHUL KALMANI"],
  ["4PM24CS112", "RAJAT SHANMUKHA NAIK"],
  ["4PM24CS113", "RAJESH NAGAPPA HALLIGANNANAVAR"],
  ["4PM24CS114", "RAKESH G M"],
  ["4PM24CS115", "RAKSHITA"],
  ["4PM24CS116", "RAKSHITA JAGADEESH BENDIGERI"],
  ["4PM24CS117", "REHANULLA"],
  ["4PM24CS118", "RENUKARYA H M"],
  ["4PM24CS119", "ROHINI SINDHE"],
  ["4PM24CS120", "ROHITH KUMAR NAYAKA S"],
  ["4PM24CS121", "RUDRESH A N"],
  ["4PM24CS122", "S SINCHANA"],
  ["4PM24CS123", "SAGAR G RAO"],
  ["4PM24CS124", "SAHANA K"],
];

async function main() {
  console.log(`Adding ${students.length} students — Batch ${BATCH}, Sem ${SEMESTER}, Section ${SECTION}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const [usn, name] of students) {
    const email = usn.toLowerCase() + "@college.edu";

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name, role: "student" },
    });

    if (authErr) {
      if (authErr.message?.includes("already been registered")) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        if (existing) {
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
            console.error(`  FAIL ${usn}: ${sErr.message}`);
            failed++;
          } else {
            console.log(`  SKIP ${usn} ${name} (exists)`);
            skipped++;
          }
        } else {
          console.error(`  FAIL ${usn}: no profile found`);
          failed++;
        }
        continue;
      }
      console.error(`  FAIL ${usn}: ${authErr.message}`);
      failed++;
      continue;
    }

    const userId = authData.user.id;

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

  const { data } = await supabase
    .from("students")
    .select("roll_no")
    .eq("batch", BATCH)
    .eq("section", SECTION)
    .order("roll_no");

  console.log(`\nVerification: ${data?.length ?? 0} students in Batch ${BATCH} Section ${SECTION}`);
}

main().catch(console.error);
