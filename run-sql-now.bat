@echo off
set SUPABASE_ACCESS_TOKEN=sbp_5d734d591bb11369ea344ec10828044a46c5e8ea

echo ============================================
echo Linking to Supabase project...
echo ============================================
npx supabase link --project-ref gjdkuyzujvpmpjeyvqtk

echo.
echo ============================================
echo Executing SQL script to add 142 students...
echo ============================================
npx supabase db execute -f supabase/add-cs-students-6th-sem.sql

echo.
echo ============================================
echo Verifying students were added...
echo ============================================
npx supabase db execute --query "SELECT COUNT(*) as total_students FROM students WHERE semester = 6 AND section = 'B' AND batch = '2023';"

echo.
echo ✅ DONE!
