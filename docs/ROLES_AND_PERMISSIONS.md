# Role-Based Access Control (RBAC) System

## Role Hierarchy

```
PRINCIPAL (Highest Authority)
    ↓
HOD (Head of Department) - Per Department
    ↓
TEACHER - Per Subject/Class
    ↓
STUDENT (Lowest Level)
```

---

## Role Definitions & Permissions

### 1. **PRINCIPAL** 👑
**Scope:** College-wide access

**Can:**
- ✅ View, Create, Update, Delete ALL departments
- ✅ View, Create, Update, Delete ALL teachers (across all departments)
- ✅ View, Create, Update, Delete ALL students (across all departments)
- ✅ View, Create, Update, Delete ALL subjects
- ✅ View, Create, Update, Delete ALL exams
- ✅ View, Update ALL marks (across all departments)
- ✅ View ALL feedback
- ✅ Generate reports for entire college
- ✅ Manage HODs

**Cannot:**
- ❌ Nothing - has complete access

**Use Case:**
- College Principal/Director
- System Administrator

---

### 2. **HOD** (Head of Department) 🎓
**Scope:** Department-level access

**Can:**
- ✅ View ALL departments (read-only for other departments)
- ✅ View, Create, Update, Delete teachers IN THEIR DEPARTMENT
- ✅ View, Create, Update, Delete students IN THEIR DEPARTMENT
- ✅ View, Create, Update, Delete subjects IN THEIR DEPARTMENT
- ✅ View, Create, Update, Delete exams IN THEIR DEPARTMENT
- ✅ View, Update marks for students IN THEIR DEPARTMENT
- ✅ View feedback for students IN THEIR DEPARTMENT
- ✅ Generate reports for their department
- ✅ Assign teachers to subjects

**Cannot:**
- ❌ Modify other departments
- ❌ Manage teachers/students from other departments
- ❌ Delete the department they head
- ❌ Create new departments

**Use Case:**
- Department Head (CSE, ECE, ME, etc.)
- Program Coordinator

---

### 3. **TEACHER** 📚
**Scope:** Subject/Class-level access

**Can:**
- ✅ View ALL departments (read-only)
- ✅ View teachers in their department
- ✅ View students ENROLLED IN THEIR SUBJECTS
- ✅ View subjects they teach
- ✅ Create exams for THEIR SUBJECTS
- ✅ View, Create, Update marks for exams THEY CREATED
- ✅ Create, Update, Delete feedback for students IN THEIR CLASSES
- ✅ View own profile and update basic info
- ✅ Generate reports for their classes

**Cannot:**
- ❌ Manage other teachers
- ❌ Create/delete students
- ❌ Modify subjects they don't teach
- ❌ View/modify marks for other teachers' exams
- ❌ Manage departments

**Use Case:**
- Assistant Professor
- Associate Professor
- Lecturer

---

### 4. **STUDENT** 🎒
**Scope:** Personal data only

**Can:**
- ✅ View OWN profile
- ✅ Update OWN basic info (avatar, contact details)
- ✅ View OWN marks across all subjects
- ✅ View OWN feedback from teachers
- ✅ View subjects in their semester/department
- ✅ View exams scheduled for their class
- ✅ View teachers teaching them
- ✅ View their department info

**Cannot:**
- ❌ View other students' data
- ❌ Modify marks
- ❌ Create/delete exams
- ❌ View other students' feedback
- ❌ Manage any users
- ❌ Create feedback

**Use Case:**
- Enrolled students

---

## Database Schema for Roles

### Current Implementation
```sql
-- In profiles table
role text not null default 'student'
  check (role in ('student', 'teacher', 'hod', 'principal'))
```

### HOD Assignment
HODs need to be linked to their department. Update the `teachers` table:

```sql
-- Add is_hod flag to teachers table
ALTER TABLE public.teachers
ADD COLUMN is_hod boolean DEFAULT false;

-- Create unique constraint: only one HOD per department
CREATE UNIQUE INDEX unique_hod_per_dept
ON public.teachers (department_id)
WHERE is_hod = true;
```

---

## Permission Matrix

| Resource | Principal | HOD | Teacher | Student |
|----------|-----------|-----|---------|---------|
| **Departments** | Full | View All, Manage Own | View All | View Own |
| **Teachers** | Full | Manage in Dept | View in Dept | View Own Teachers |
| **Students** | Full | Manage in Dept | View in Classes | View Self |
| **Subjects** | Full | Manage in Dept | View/Teach Own | View in Semester |
| **Exams** | Full | Manage in Dept | Manage Own | View Scheduled |
| **Marks** | Full | View/Edit in Dept | Manage Own Exams | View Own |
| **Feedback** | View All | View in Dept | Create/Edit Own | View Own |

---

## Security Best Practices

### 1. **Principle of Least Privilege**
- Users get ONLY the permissions they need
- Default role is "student" (most restricted)

### 2. **Row-Level Security (RLS)**
- All tables have RLS enabled
- Policies enforce role-based access
- Backend validation as defense-in-depth

### 3. **Audit Trail**
- All modifications track `created_by` and `entered_by`
- Timestamps on all records

### 4. **Department Isolation**
- HODs cannot access other departments
- Teachers see only their students
- Cross-department queries restricted

### 5. **Cascading Deletes**
- Deleting a user cascades properly
- Foreign key constraints prevent orphaned data

---

## Role Assignment Workflow

### Principal Account
```sql
-- Created manually by system admin
INSERT INTO auth.users (email, ...) VALUES ('principal@college.edu', ...);
UPDATE profiles SET role = 'principal' WHERE email = 'principal@college.edu';
```

### HOD Account
```sql
-- 1. Create as teacher first
INSERT INTO teachers (profile_id, department_id, ...) VALUES (...);

-- 2. Promote to HOD
UPDATE teachers SET is_hod = true WHERE id = '<teacher_id>';
UPDATE profiles SET role = 'hod' WHERE id = '<profile_id>';
```

### Teacher Account
```sql
-- Standard teacher creation
INSERT INTO teachers (profile_id, department_id, designation) VALUES (...);
UPDATE profiles SET role = 'teacher' WHERE id = '<profile_id>';
```

### Student Account
```sql
-- Students created in bulk or individually
INSERT INTO students (profile_id, roll_no, department_id, ...) VALUES (...);
-- Role defaults to 'student'
```

---

## API/Frontend Recommendations

### Check User Role
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .single();

if (profile.role === 'principal') {
  // Show admin dashboard
} else if (profile.role === 'hod') {
  // Show HOD dashboard
} else if (profile.role === 'teacher') {
  // Show teacher dashboard
} else {
  // Show student dashboard
}
```

### Role-Based UI Components
```typescript
{role === 'principal' && <ManageAllDepartments />}
{['principal', 'hod'].includes(role) && <ManageTeachers />}
{['principal', 'hod', 'teacher'].includes(role) && <EnterMarks />}
```

---

## Migration Path

If you need to migrate existing data:

1. Add `is_hod` column to teachers
2. Update RLS policies
3. Assign HOD flag to department heads
4. Test each role's access
5. Deploy new frontend with role checks

---

## Summary

**Best Role Structure:**
- **Principal:** Full system access
- **HOD:** Department-scoped admin
- **Teacher:** Class/subject-scoped
- **Student:** Personal data only

This creates a clear hierarchy with appropriate access controls at each level.
