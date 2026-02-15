/**
 * Update student semesters based on batch year
 * Batch 2023 → Semester 6 (3rd year)
 * Batch 2025 → Semester 1 (1st year)
 *
 * Usage: node scripts/add-students.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gjdkuyzujvpmpjeyvqtk.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZGt1eXp1anZwbXBqZXl2cXRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0NzQ2OCwiZXhwIjoyMDg2MjIzNDY4fQ.GWgp6pRBidO1mOsxZV_-jLAWw2rRRU56irt49lPOrf0";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Updating student semesters based on batch...\n");

  // Update batch 2023 → semester 6
  const { data: updated23, error: err23 } = await supabase
    .from("students")
    .update({ semester: 6 })
    .eq("batch", "2023")
    .select("roll_no");

  if (err23) {
    console.error("FAIL batch 2023:", err23.message);
  } else {
    console.log(`  Batch 2023 → Semester 6: ${updated23?.length ?? 0} students updated`);
  }

  // Update batch 2025 → semester 1
  const { data: updated25, error: err25 } = await supabase
    .from("students")
    .update({ semester: 1 })
    .eq("batch", "2025")
    .select("roll_no");

  if (err25) {
    console.error("FAIL batch 2025:", err25.message);
  } else {
    console.log(`  Batch 2025 → Semester 1: ${updated25?.length ?? 0} students updated`);
  }

  // Verify
  console.log("\n========================================");
  console.log("Verification:");

  const batches = ["2023", "2025"];
  for (const batch of batches) {
    const { data } = await supabase
      .from("students")
      .select("semester, section")
      .eq("batch", batch);

    const semSet = new Set((data ?? []).map((s) => s.semester));
    const secSet = new Set((data ?? []).filter((s) => s.section).map((s) => s.section));

    console.log(
      `  Batch ${batch}: ${data?.length ?? 0} students, Semester(s): ${[...semSet].join(",")}, Sections: ${[...secSet].sort().join(",")}`
    );
  }
  console.log("========================================");
}

main().catch(console.error);
