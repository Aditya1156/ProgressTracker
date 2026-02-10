# Quick Reference Guide - Role-Based Access Control

Fast reference for implementing RBAC in your academic progress tracker.

---

## 🚀 Setup Commands (Run in Order)

```bash
# 1. Apply improved security policies
supabase db execute -f supabase/improved-rls-policies.sql

# 2. Add section field to students table
supabase db execute -f supabase/add-section-field.sql

# 3. Create principal account
supabase db execute -f supabase/create-principal.sql

# 4. Create all HOD accounts
supabase db execute -f supabase/create-all-hods.sql

# 5. Add 6th semester CS students
supabase db execute -f supabase/add-cs-students-6th-sem.sql
```

---

## 👤 Default Login Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Principal** | `principal@pesitm.edu.in` | `admin123` | Full system access |
| **CSE HOD** | `hod.cse@pesitm.edu.in` | `admin123` | CSE department only |
| **ECE HOD** | `hod.ece@pesitm.edu.in` | `admin123` | ECE department only |
| **ME HOD** | `hod.me@pesitm.edu.in` | `admin123` | ME department only |
| **EE HOD** | `hod.ee@pesitm.edu.in` | `admin123` | EE department only |
| **Students** | `<usn>@college.edu` | `student123` | Personal data only |

🔒 **Change all passwords after first login!**

---

## 🎯 Role Hierarchy

```
┌───────────────────────────────────────┐
│  PRINCIPAL                            │
│  ✓ Manage everything                  │
│  ✓ All departments                    │
│  ✓ Create/delete departments          │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│  HOD (per department)                 │
│  ✓ Manage department teachers         │
│  ✓ Manage department students         │
│  ✓ View other departments (read-only) │
│  ✗ Cannot modify other departments    │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│  TEACHER                              │
│  ✓ Create exams                       │
│  ✓ Enter marks for own exams          │
│  ✓ Give feedback to students          │
│  ✗ Cannot manage users                │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│  STUDENT                              │
│  ✓ View own marks                     │
│  ✓ View own feedback                  │
│  ✓ View subjects and exams            │
│  ✗ Cannot see other students' data    │
└───────────────────────────────────────┘
```

---

## 📦 Frontend Components Quick Reference

### 1. Check User Role

```tsx
import { useAuth, useUserRole } from '@/lib/auth/useAuth';

const { profile } = useAuth();
const role = useUserRole();
// role will be: 'principal' | 'hod' | 'teacher' | 'student' | null
```

### 2. Show Content by Role

```tsx
import { PrincipalOnly, HODOnly, TeacherOnly, StudentOnly } from '@/components/auth/RoleGuard';

<PrincipalOnly>
  <DeleteButton />
</PrincipalOnly>

<HODOnly>
  <ManageTeachers />
</HODOnly>

<TeacherOnly>
  <CreateExam />
</TeacherOnly>

<StudentOnly>
  <ViewMarks />
</StudentOnly>
```

### 3. Check Permissions

```tsx
import { usePermissions } from '@/lib/auth/useAuth';

const permissions = usePermissions();

{permissions.canEnterMarks && <EnterMarksButton />}
{permissions.canManageAllStudents && <DeleteAllButton />}
```

### 4. Conditional Rendering

```tsx
import { RequireRole, RequirePermission } from '@/components/auth/RoleGuard';

<RequireRole role="principal">
  <AdminPanel />
</RequireRole>

<RequireRole role={['teacher', 'hod']}>
  <TeacherPanel />
</RequireRole>

<RequirePermission permission={(p) => p.canCreateExams}>
  <CreateExamForm />
</RequirePermission>
```

### 5. Role Badge

```tsx
import { RoleBadge } from '@/components/auth/RoleGuard';

<RoleBadge role={profile?.role} showIcon />
// Displays: 👑 Principal | 🎓 HOD | 📚 Teacher | 🎒 Student
```

---

## 🗄️ Database Queries by Role

### Student Queries

```typescript
// Get own marks
const { data } = await supabase
  .from('marks')
  .select('*, exam:exams(*), subject:subjects(*)')
  .eq('student_id', studentId);

// Get own feedback
const { data } = await supabase
  .from('feedback')
  .select('*, teacher:teachers(*), subject:subjects(*)')
  .eq('student_id', studentId);
```

### Teacher Queries

```typescript
// Get exams created by teacher
const { data } = await supabase
  .from('exams')
  .select('*')
  .eq('created_by', teacherId);

// Enter marks for own exam
const { data } = await supabase
  .from('marks')
  .insert({
    student_id: studentId,
    exam_id: examId,
    marks_obtained: marks,
    entered_by: teacherId,
  });
```

### HOD Queries

```typescript
// Get all students in department
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('department_id', departmentId);

// Get all teachers in department
const { data } = await supabase
  .from('teachers')
  .select('*')
  .eq('department_id', departmentId);

// Get section distribution
const { data } = await supabase
  .rpc('get_section_distribution', {
    p_department_id: departmentId,
    p_semester: 6,
  });
```

### Principal Queries

```typescript
// Get all students across all departments
const { data } = await supabase
  .from('students')
  .select('*, department:departments(*)');

// Create new department
const { data } = await supabase
  .from('departments')
  .insert({
    name: 'IT',
    full_name: 'Information Technology',
  });
```

---

## 🔐 Permission Matrix

| Action | Principal | HOD | Teacher | Student |
|--------|-----------|-----|---------|---------|
| Create Department | ✅ | ❌ | ❌ | ❌ |
| Manage All Teachers | ✅ | ❌ | ❌ | ❌ |
| Manage Dept Teachers | ✅ | ✅ | ❌ | ❌ |
| Manage All Students | ✅ | ❌ | ❌ | ❌ |
| Manage Dept Students | ✅ | ✅ | ❌ | ❌ |
| Create Exam | ✅ | ✅ | ✅ | ❌ |
| Enter Marks (Any Exam) | ✅ | ✅ | ❌ | ❌ |
| Enter Marks (Own Exam) | ✅ | ✅ | ✅ | ❌ |
| View All Marks | ✅ | ❌ | ❌ | ❌ |
| View Dept Marks | ✅ | ✅ | ❌ | ❌ |
| View Own Marks | ✅ | ✅ | ✅ | ✅ |
| Create Feedback | ✅ | ✅ | ✅ | ❌ |
| View All Feedback | ✅ | ❌ | ❌ | ❌ |
| View Dept Feedback | ✅ | ✅ | ❌ | ❌ |
| View Own Feedback | ✅ | ✅ | ✅ | ✅ |

---

## 🛠️ Common Tasks

### Create New HOD

```sql
-- For a new department
UPDATE teachers SET is_hod = true
WHERE profile_id = '<teacher_profile_id>';

UPDATE profiles SET role = 'hod'
WHERE id = '<teacher_profile_id>';
```

### Assign Students to Section

```sql
-- Assign to Section A
UPDATE students SET section = 'A'
WHERE semester = 6 AND roll_no IN ('USN1', 'USN2', 'USN3');

-- Assign to Section B
UPDATE students SET section = 'B'
WHERE semester = 6 AND roll_no IN ('USN4', 'USN5', 'USN6');
```

### Get Section Distribution

```sql
SELECT * FROM get_section_distribution(
  '<department_id>',
  6  -- semester
);
```

### Promote Teacher to HOD

```sql
-- First, demote current HOD (if any)
UPDATE teachers SET is_hod = false
WHERE department_id = '<dept_id>' AND is_hod = true;

UPDATE profiles SET role = 'teacher'
WHERE id IN (
  SELECT profile_id FROM teachers
  WHERE department_id = '<dept_id>' AND is_hod = false
);

-- Then promote new HOD
UPDATE teachers SET is_hod = true
WHERE profile_id = '<new_hod_profile_id>';

UPDATE profiles SET role = 'hod'
WHERE id = '<new_hod_profile_id>';
```

---

## 📊 Available Helper Functions

### Backend (SQL)

```sql
-- Check user role
SELECT public.is_principal();
SELECT public.is_hod();
SELECT public.is_teacher();

-- Get user's department
SELECT public.get_my_department();

-- Check if user is HOD of specific department
SELECT public.is_hod_of_department('<dept_id>');

-- Get section distribution
SELECT * FROM public.get_section_distribution('<dept_id>', <semester>);
```

### Frontend (TypeScript)

```typescript
import {
  isPrincipal,
  isHOD,
  isTeacher,
  isStudent,
  isAdmin,
  hasMinRole,
  canAccessDepartment,
  getDashboardRoute,
  getRoleDisplayName,
} from '@/lib/auth/roles';
```

---

## 🐛 Troubleshooting

### "Permission Denied" Error

```bash
# Re-apply RLS policies
supabase db execute -f supabase/improved-rls-policies.sql
```

### HOD Can't Manage Department

```sql
-- Check if is_hod flag is set
SELECT is_hod FROM teachers WHERE profile_id = '<user_id>';

-- Check if role is correct
SELECT role FROM profiles WHERE id = '<user_id>';

-- Fix if needed
UPDATE teachers SET is_hod = true WHERE profile_id = '<user_id>';
UPDATE profiles SET role = 'hod' WHERE id = '<user_id>';
```

### Students Can't See Marks

```sql
-- Check if student record exists
SELECT * FROM students WHERE profile_id = '<user_id>';

-- Check if marks exist
SELECT * FROM marks WHERE student_id = '<student_id>';
```

---

## 📚 Documentation Links

- **[ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md)** - Detailed role documentation
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[FRONTEND_ROLE_USAGE.md](./FRONTEND_ROLE_USAGE.md)** - React/Next.js usage examples

---

## 🎓 Student Section Information

Students table now includes a `section` field:

```typescript
interface Student {
  roll_no: string;
  semester: number;
  section: string; // 'A', 'B', 'C', etc.
  department_id: string;
  batch: string;
}
```

### Query by Section

```typescript
// Get all Section B students in 6th semester
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('semester', 6)
  .eq('section', 'B');
```

---

## ⚡ Quick Examples

### Complete Login Flow

```tsx
'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { ConditionalRender } from '@/components/auth/RoleGuard';

export default function Home() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ConditionalRender
      conditions={{
        principal: <PrincipalDashboard />,
        hod: <HODDashboard />,
        teacher: <TeacherDashboard />,
        student: <StudentDashboard />,
      }}
    />
  );
}
```

### Navigation with Permissions

```tsx
import { usePermissions } from '@/lib/auth/useAuth';

export function Navbar() {
  const permissions = usePermissions();

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      {permissions.canManageAllDepartments && (
        <Link href="/departments">Departments</Link>
      )}
      {permissions.canCreateExams && (
        <Link href="/exams/create">Create Exam</Link>
      )}
      {permissions.canViewOwnMarks && (
        <Link href="/marks">My Marks</Link>
      )}
    </nav>
  );
}
```

---

## 🎯 Next Steps

1. ✅ Run all setup scripts
2. ✅ Test login with each role
3. ✅ Implement frontend auth hooks
4. ✅ Create role-specific dashboards
5. ✅ Add "Change Password" feature
6. ✅ Test permissions thoroughly

---

**Need Help?** Check the detailed documentation or review the example code in the lib/auth and components/auth directories.
