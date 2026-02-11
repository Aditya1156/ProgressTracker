@echo off
echo ============================================
echo Adding 142 CS Students to Database
echo ============================================
echo.

REM Check if SUPABASE_ACCESS_TOKEN is set
if "%SUPABASE_ACCESS_TOKEN%"=="" (
    echo ERROR: SUPABASE_ACCESS_TOKEN not set
    echo.
    echo Please set it first:
    echo 1. Go to: https://supabase.com/dashboard/account/tokens
    echo 2. Generate a new token
    echo 3. Run: set SUPABASE_ACCESS_TOKEN=your_token_here
    echo 4. Then run this script again
    echo.
    pause
    exit /b 1
)

echo [1/3] Linking to Supabase project...
npx supabase link --project-ref gjdkuyzujvpmpjeyvqtk

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to link to Supabase project
    pause
    exit /b 1
)

echo.
echo [2/3] Executing SQL script...
npx supabase db execute -f supabase/add-cs-students-6th-sem.sql

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SQL script
    pause
    exit /b 1
)

echo.
echo [3/3] Verifying students were added...
npx supabase db execute --query "SELECT COUNT(*) as total FROM students WHERE semester = 6 AND section = 'B' AND batch = '2023';"

echo.
echo ============================================
echo ✅ COMPLETE!
echo ============================================
echo Default password for all students: student123
echo Students can login with: usn@college.edu
echo Example: 4pm23cs001@college.edu
echo ============================================
echo.
pause
