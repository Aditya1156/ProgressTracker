# Database Setup Guide

## Complete Setup Instructions

Follow these steps in order to set up your academic progress tracking system with proper role-based access control.

---

## Step 1: Initial Schema Setup

Run the base schema to create all tables:

```bash
supabase db execute -f supabase/schema.sql
```

**What this does:**
- Creates tables: profiles, departments, students, teachers, subjects, exams, marks, feedback
- Enables Row Level Security (RLS)
- Sets up basic triggers

---

## Step 2: Seed Initial Data

Add departments and test data:

```bash
supabase db execute -f supabase/seed-complete.sql
```

**What this does:**
- Adds CSE, ECE, ME, EE departments
- Creates sample subjects
- Adds test users (admin, teacher, student)

---

## Step 3: Apply Improved RLS Policies

Install the enhanced role-based security:

```bash
supabase db execute -f supabase/improved-rls-policies.sql
```

**What this does:**
- Adds `is_hod` column to teachers table
- Creates helper functions (is_principal, is_hod, etc.)
- Implements proper permission hierarchy
- Sets up department-scoped access for HODs

---

## Step 4: Create Principal Account

Create the highest-level admin account:

```bash
supabase db execute -f supabase/create-principal.sql
```

**Login credentials:**
- Email: `principal@pesitm.edu.in`
- Password: `admin123`
- Role: Principal (full access)

⚠️ **Important:** Change password after first login!

---

## Step 5: Create HOD and Teachers

Create department heads and teachers:

```bash
supabase db execute -f supabase/create-hod-teacher-examples.sql
```

**Created accounts:**
- HOD CSE: `hod.cse@pesitm.edu.in` / `admin123`
- Teacher: `prof.smith@pesitm.edu.in` / `teacher123`

---

## Step 6: Add Students

Add the 6th semester CS students:

```bash
supabase db execute -f supabase/add-cs-students-6th-sem.sql
```

**Created accounts:**
- 142 students for 6th semester, Section B
- Email format: `<usn>@college.edu` (e.g., `4pm23cs001@college.edu`)
- Password: `student123` (all students)

---

## Role Hierarchy Summary

```
┌─────────────────────────────────────────────┐
│           PRINCIPAL                         │
│  • Full access to everything                │
│  • Manage all departments, users, data      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           HOD (per department)              │
│  • Manage teachers in their dept            │
│  • Manage students in their dept            │
│  • Manage subjects, exams, marks in dept    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           TEACHER                           │
│  • Create exams for their subjects          │
│  • Enter marks for their exams              │
│  • Give feedback to their students          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           STUDENT                           │
│  • View own marks                           │
│  • View own feedback                        │
│  • View subjects and exams                  │
└─────────────────────────────────────────────┘
```

---

## Verification

After setup, verify everything is working:

### 1. Check if policies are active:
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### 2. Check created users:
```sql
SELECT email, role FROM profiles ORDER BY role;
```

### 3. Check HODs:
```sql
SELECT p.full_name, p.email, d.name as department
FROM teachers t
JOIN profiles p ON t.profile_id = p.id
JOIN departments d ON t.department_id = d.id
WHERE t.is_hod = true;
```

### 4. Check student count:
```sql
SELECT COUNT(*) FROM students WHERE semester = 6 AND batch = '2023';
```

---

## Common Tasks

### Create New HOD for ECE Department
```sql
-- Run the HOD creation script and change:
-- 1. Email: hod.ece@pesitm.edu.in
-- 2. Department ID to ECE department UUID
-- 3. Name to actual HOD name
```

### Promote Teacher to HOD
```sql
UPDATE teachers SET is_hod = true
WHERE profile_id = (SELECT id FROM profiles WHERE email = 'teacher@email.com');

UPDATE profiles SET role = 'hod'
WHERE email = 'teacher@email.com';
```

### Add New Student
```sql
-- Follow the pattern in add-cs-students-6th-sem.sql
-- Or create individual student via admin panel
```

---

## Troubleshooting

### Permission Denied Error
- Check if RLS policies are applied: `supabase db execute -f supabase/improved-rls-policies.sql`
- Verify user role: `SELECT role FROM profiles WHERE id = auth.uid();`

### HOD Can't Manage Department
- Check if `is_hod` flag is set: `SELECT is_hod FROM teachers WHERE profile_id = '<user_id>';`
- Verify department assignment matches

### Students Can't See Marks
- Ensure student record exists in `students` table
- Check if marks are linked to correct `student_id`

---

## Default Passwords

| Role | Default Password |
|------|------------------|
| Principal | `admin123` |
| HOD | `admin123` |
| Teacher | `teacher123` |
| Student | `student123` |

**🔒 Security Notice:** All users should change their password on first login!

---

## Next Steps

1. ✅ Set up authentication in your frontend
2. ✅ Create role-based dashboards
3. ✅ Implement "change password" functionality
4. ✅ Add email verification (optional)
5. ✅ Create admin panel for user management

---

## File Structure

```
supabase/
├── schema.sql                          # Base database schema
├── seed-complete.sql                   # Initial test data
├── improved-rls-policies.sql           # Enhanced security policies
├── create-principal.sql                # Create principal account
├── create-hod-teacher-examples.sql     # Create HOD/Teacher accounts
└── add-cs-students-6th-sem.sql         # Add 6th sem CS students

docs/
├── ROLES_AND_PERMISSIONS.md            # Detailed role documentation
└── SETUP_GUIDE.md                      # This file
```

---

## Support

For detailed role permissions, see: [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md)
