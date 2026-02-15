/**
 * Add 2nd Year Section C students (Batch 2024, Semester 3)
 * Usage: node scripts/add-2nd-year-c.mjs
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
const SECTION = "C";
const DEPT_ID = "d1000000-0000-0000-0000-000000000001";
const DEFAULT_PASSWORD = "student123";

const students = [
  ["4PM24CS125", "SAHANA Y H"],
  ["4PM24CS126", "SAI CHINMAYI R"],
  ["4PM24CS127", "SAIPRAKASH CHANDRASHEKAR ARER"],
  ["4PM24CS128", "SAMRUDH M R"],
  ["4PM24CS129", "SANJANA G S"],
  ["4PM24CS130", "SANJANA K"],
  ["4PM24CS131", "SANJANA V"],
  ["4PM24CS132", "SANJAY M K"],
  ["4PM24CS133", "SAVITRI MALLAPPA HOMBALE"],
  ["4PM24CS134", "SHABANA"],
  ["4PM24CS135", "SHABHAREESH S"],
  ["4PM24CS136", "SHRAVYA G S"],
  ["4PM24CS137", "SHREYA P CHINDI"],
  ["4PM24CS138", "SHREYA S NERALAGIMATH"],
  ["4PM24CS139", "SHREYA SARJI S D"],
  ["4PM24CS140", "SHREYA T S"],
  ["4PM24CS141", "SHREYA V D"],
  ["4PM24CS142", "SHREYAS GOWDA T G"],
  ["4PM24CS143", "SHREYAS P"],
  ["4PM24CS144", "SHREYAS S M"],
  ["4PM24CS145", "SHREYASH"],
  ["4PM24CS146", "SHREYES SULGODU SRIKRISHNA"],
  ["4PM24CS147", "SHWETA MALAVI"],
  ["4PM24CS148", "SIDDALINGESH KARADI"],
  ["4PM24CS149", "SINCHANA"],
  ["4PM24CS150", "SINCHANA G"],
  ["4PM24CS151", "SINCHANA P RAO"],
  ["4PM24CS152", "SMITHA C NAIK"],
  ["4PM24CS153", "SONA K C"],
  ["4PM24CS154", "SRUSHTI N"],
  ["4PM24CS155", "STEEVAN ABHIK K"],
  ["4PM24CS156", "SUNANDA S"],
  ["4PM24CS157", "SURAJ R K"],
  ["4PM24CS158", "SWATHI H G"],
  ["4PM24CS159", "T MOUNIKA"],
  ["4PM24CS160", "TANMAY"],
  ["4PM24CS161", "TANUSHREE M J"],
  ["4PM24CS162", "TARUN S U"],
  ["4PM24CS163", "TEJASWINI Y"],
  ["4PM24CS164", "THAKSHASHREE S C"],
  ["4PM24CS165", "THANMAY B D"],
  ["4PM24CS166", "THANVI G SHETTY"],
  ["4PM24CS167", "THANVITHA H M"],
  ["4PM24CS168", "THARUN L"],
  ["4PM24CS169", "THEJAS G"],
  ["4PM24CS170", "TIPPANAGOUDA GOUDAR"],
  ["4PM24CS171", "TIRUMALA K THANDLE"],
  ["4PM24CS172", "VACHANA B S"],
  ["4PM24CS173", "VAISHNAVI P SANGAPUR"],
  ["4PM24CS174", "VARSHA S"],
  ["4PM24CS175", "VARUN H"],
  ["4PM24CS176", "VASUKI BASUR"],
  ["4PM24CS177", "VENKATESH DORANALLI"],
  ["4PM24CS178", "VIDHATHRI V BHAT"],
  ["4PM24CS179", "VIDYA N"],
  ["4PM24CS180", "VIKAS G"],
  ["4PM24CS181", "VINUTHA S N"],
  ["4PM24CS182", "YASHASWI U MANE"],
  ["4PM24CS183", "YASHASWINI"],
  ["4PM24CS184", "YASHWANTH CHANNAPPA KAGER"],
  ["4PM24CS185", "YASHWANTH GOWDA V P"],
  ["4PM24CS186", "ZUL NOORAIN AYMAN"],
];

async function main() {
  console.log(`Adding ${students.length} students — Batch ${BATCH}, Sem ${SEMESTER}, Section ${SECTION}\n`);

  let created = 0, skipped = 0, failed = 0;

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
          .from("profiles").select("id").eq("email", email).single();
        if (existing) {
          const { error: sErr } = await supabase.from("students").upsert(
            { profile_id: existing.id, roll_no: usn, department_id: DEPT_ID, batch: BATCH, semester: SEMESTER, section: SECTION },
            { onConflict: "roll_no" }
          );
          if (sErr) { console.error(`  FAIL ${usn}: ${sErr.message}`); failed++; }
          else { console.log(`  SKIP ${usn} ${name} (exists)`); skipped++; }
        } else { console.error(`  FAIL ${usn}: no profile`); failed++; }
        continue;
      }
      console.error(`  FAIL ${usn}: ${authErr.message}`); failed++; continue;
    }

    const userId = authData.user.id;

    const { error: profErr } = await supabase.from("profiles").upsert({
      id: userId, full_name: name, email, role: "student",
    });
    if (profErr) { console.error(`  FAIL ${usn}: profile — ${profErr.message}`); failed++; continue; }

    const { error: stuErr } = await supabase.from("students").insert({
      profile_id: userId, roll_no: usn, department_id: DEPT_ID, batch: BATCH, semester: SEMESTER, section: SECTION,
    });
    if (stuErr) { console.error(`  FAIL ${usn}: student — ${stuErr.message}`); failed++; continue; }

    console.log(`  OK   ${usn} ${name}`);
    created++;
  }

  console.log(`\n========================================`);
  console.log(`Created: ${created}  Skipped: ${skipped}  Failed: ${failed}`);
  console.log(`========================================`);

  // Full batch 2024 summary
  for (const sec of ["A", "B", "C"]) {
    const { data } = await supabase.from("students").select("roll_no").eq("batch", BATCH).eq("section", sec);
    console.log(`  Batch ${BATCH} Section ${sec}: ${data?.length ?? 0} students`);
  }
}

main().catch(console.error);
