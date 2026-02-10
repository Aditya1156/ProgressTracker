# Frontend Role-Based Access Control - Usage Guide

Complete guide for implementing role-based access control in your React/Next.js frontend.

---

## 📁 File Structure

```
lib/auth/
├── roles.ts          # Core role utilities and types
└── useAuth.ts        # React hooks for authentication

components/auth/
└── RoleGuard.tsx     # React components for conditional rendering
```

---

## 🚀 Quick Start

### 1. Import the utilities

```tsx
import { useAuth, useUserRole, usePermissions } from '@/lib/auth/useAuth';
import { PrincipalOnly, RequireRole, RoleBadge } from '@/components/auth/RoleGuard';
import { isPrincipal, isHOD, Permissions } from '@/lib/auth/roles';
```

### 2. Use in your components

```tsx
function Dashboard() {
  const { user, profile, loading } = useAuth();
  const permissions = usePermissions();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome, {profile?.full_name}</h1>
      <RoleBadge role={profile?.role} />

      {permissions.canManageAllStudents && (
        <button>Manage All Students</button>
      )}
    </div>
  );
}
```

---

## 📚 Core Utilities

### Authentication Hook

```tsx
import { useAuth } from '@/lib/auth/useAuth';

function MyComponent() {
  const { user, profile, loading, error } = useAuth();

  // user: Supabase User object
  // profile: Your custom UserProfile with role
  // loading: true while fetching auth state
  // error: any authentication errors
}
```

### Role Checking Hooks

```tsx
import {
  useIsPrincipal,
  useIsHOD,
  useIsTeacher,
  useIsStudent,
  useIsAdmin,
} from '@/lib/auth/useAuth';

function TeacherPanel() {
  const isTeacher = useIsTeacher();
  const isAdmin = useIsAdmin();

  if (!isTeacher && !isAdmin) {
    return <div>Access Denied</div>;
  }

  return <div>Teacher Panel Content</div>;
}
```

### Permission Hook

```tsx
import { usePermissions } from '@/lib/auth/useAuth';

function ExamManagement() {
  const permissions = usePermissions();

  return (
    <div>
      {permissions.canCreateExams && <CreateExamButton />}
      {permissions.canManageAllExams && <DeleteExamButton />}
      {permissions.canEnterMarks && <EnterMarksForm />}
    </div>
  );
}
```

---

## 🎨 Component Guards

### Role-Specific Guards

```tsx
import {
  PrincipalOnly,
  HODOnly,
  TeacherOnly,
  StudentOnly,
  AdminOnly,
  TeacherOrAdminOnly,
} from '@/components/auth/RoleGuard';

function NavigationMenu() {
  return (
    <nav>
      {/* Everyone sees these */}
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/profile">Profile</Link>

      {/* Only Principal sees this */}
      <PrincipalOnly>
        <Link href="/admin/departments">Manage Departments</Link>
      </PrincipalOnly>

      {/* Only HOD sees this */}
      <HODOnly>
        <Link href="/hod/teachers">Manage Teachers</Link>
      </HODOnly>

      {/* Teachers and Admins see this */}
      <TeacherOrAdminOnly>
        <Link href="/exams/create">Create Exam</Link>
      </TeacherOrAdminOnly>

      {/* Only students see this */}
      <StudentOnly>
        <Link href="/marks">View My Marks</Link>
      </StudentOnly>
    </nav>
  );
}
```

### Flexible Role Guard

```tsx
import { RequireRole } from '@/components/auth/RoleGuard';

function DataManagement() {
  return (
    <div>
      {/* Single role */}
      <RequireRole role="principal">
        <button>Delete All Data</button>
      </RequireRole>

      {/* Multiple roles */}
      <RequireRole role={['teacher', 'hod', 'principal']}>
        <button>Create Exam</button>
      </RequireRole>

      {/* With fallback */}
      <RequireRole
        role="hod"
        fallback={<p>Only HOD can access this</p>}
      >
        <HODPanel />
      </RequireRole>
    </div>
  );
}
```

### Permission-Based Guard

```tsx
import { RequirePermission } from '@/components/auth/RoleGuard';

function StudentManagement() {
  return (
    <div>
      <RequirePermission permission={(p) => p.canManageAllStudents}>
        <button>Delete All Students</button>
      </RequirePermission>

      <RequirePermission permission={(p) => p.canManageDepartmentStudents}>
        <button>Add Student to Department</button>
      </RequirePermission>

      <RequirePermission
        permission={(p) => p.canEnterMarks}
        fallback={<p>You cannot enter marks</p>}
      >
        <EnterMarksForm />
      </RequirePermission>
    </div>
  );
}
```

### Conditional Rendering

```tsx
import { ConditionalRender } from '@/components/auth/RoleGuard';

function MainDashboard() {
  return (
    <ConditionalRender
      conditions={{
        principal: <PrincipalDashboard />,
        hod: <HODDashboard />,
        teacher: <TeacherDashboard />,
        student: <StudentDashboard />,
      }}
      fallback={<LoginPage />}
    />
  );
}
```

---

## 🔐 Protected Routes (Next.js)

### Using Middleware

```tsx
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get user profile
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Protect admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (profile?.role !== 'principal') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Protect HOD routes
    if (req.nextUrl.pathname.startsWith('/hod')) {
      if (profile?.role !== 'hod' && profile?.role !== 'principal') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  } else {
    // Not logged in, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/hod/:path*', '/teacher/:path*', '/student/:path*'],
};
```

### Using Hook in Page

```tsx
// app/admin/page.tsx
'use client';

import { useRequireRole } from '@/lib/auth/useAuth';

export default function AdminPage() {
  const { hasAccess, loading } = useRequireRole('principal');

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return null; // Will redirect automatically

  return <div>Admin Content</div>;
}
```

---

## 💡 Common Patterns

### Dashboard Router

```tsx
'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { getDashboardRoute } from '@/lib/auth/roles';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirect() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      router.push(getDashboardRoute(profile.role));
    }
  }, [profile, loading, router]);

  return <div>Redirecting...</div>;
}
```

### Role Badge Display

```tsx
import { RoleBadge } from '@/components/auth/RoleGuard';

function UserCard({ userId, userName, userRole }) {
  return (
    <div className="flex items-center gap-2">
      <span>{userName}</span>
      <RoleBadge role={userRole} showIcon />
    </div>
  );
}
```

### Navigation Menu

```tsx
import { usePermissions } from '@/lib/auth/useAuth';

function Sidebar() {
  const permissions = usePermissions();

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      show: true,
    },
    {
      label: 'Manage Departments',
      href: '/admin/departments',
      show: permissions.canManageAllDepartments,
    },
    {
      label: 'Manage Teachers',
      href: '/admin/teachers',
      show: permissions.canManageDepartmentTeachers,
    },
    {
      label: 'Create Exam',
      href: '/exams/create',
      show: permissions.canCreateExams,
    },
    {
      label: 'My Marks',
      href: '/marks',
      show: permissions.canViewOwnMarks,
    },
  ];

  return (
    <nav>
      {menuItems.map((item) =>
        item.show ? (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ) : null
      )}
    </nav>
  );
}
```

### Department-Scoped Data

```tsx
import { useUserDepartment, useIsAdmin } from '@/lib/auth/useAuth';

function StudentList() {
  const userDepartmentId = useUserDepartment();
  const isAdmin = useIsAdmin();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      let query = supabase.from('students').select('*');

      // HODs see only their department
      if (!isAdmin && userDepartmentId) {
        query = query.eq('department_id', userDepartmentId);
      }

      const { data } = await query;
      setStudents(data || []);
    };

    fetchStudents();
  }, [userDepartmentId, isAdmin]);

  return <div>{/* Render students */}</div>;
}
```

---

## 🎯 Real-World Examples

### 1. Student Marks Page

```tsx
'use client';

import { useAuth, useStudentProfile } from '@/lib/auth/useAuth';
import { StudentOnly } from '@/components/auth/RoleGuard';

export default function MarksPage() {
  const { profile } = useAuth();
  const studentProfile = useStudentProfile();
  const [marks, setMarks] = useState([]);

  // Fetch marks for current student
  useEffect(() => {
    if (studentProfile) {
      supabase
        .from('marks')
        .select('*, exam:exams(*), subject:subjects(*)')
        .eq('student_id', studentProfile.id)
        .then(({ data }) => setMarks(data || []));
    }
  }, [studentProfile]);

  return (
    <StudentOnly fallback={<div>Access Denied</div>}>
      <div>
        <h1>My Marks</h1>
        <p>Roll No: {studentProfile?.roll_no}</p>
        <p>Semester: {studentProfile?.semester}</p>
        <p>Section: {studentProfile?.section}</p>

        {marks.map((mark) => (
          <div key={mark.id}>
            {mark.subject.name}: {mark.marks_obtained}/{mark.exam.max_marks}
          </div>
        ))}
      </div>
    </StudentOnly>
  );
}
```

### 2. Create Exam Form

```tsx
'use client';

import { usePermissions, useUserDepartment } from '@/lib/auth/useAuth';
import { RequirePermission } from '@/components/auth/RoleGuard';

export default function CreateExamPage() {
  const permissions = usePermissions();
  const userDepartmentId = useUserDepartment();
  const [subjects, setSubjects] = useState([]);

  // Fetch subjects for user's department
  useEffect(() => {
    if (userDepartmentId) {
      supabase
        .from('subjects')
        .select('*')
        .eq('department_id', userDepartmentId)
        .then(({ data }) => setSubjects(data || []));
    }
  }, [userDepartmentId]);

  const handleSubmit = async (formData) => {
    // Create exam
    await supabase.from('exams').insert({
      name: formData.name,
      type: formData.type,
      subject_id: formData.subject_id,
      max_marks: formData.max_marks,
      exam_date: formData.exam_date,
      created_by: user.id,
    });
  };

  return (
    <RequirePermission permission={(p) => p.canCreateExams}>
      <form onSubmit={handleSubmit}>
        <select name="subject_id">
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        {/* Other form fields */}
        <button type="submit">Create Exam</button>
      </form>
    </RequirePermission>
  );
}
```

### 3. HOD Department Management

```tsx
'use client';

import { useTeacherProfile } from '@/lib/auth/useAuth';
import { HODOnly } from '@/components/auth/RoleGuard';

export default function HODDepartmentPage() {
  const teacherProfile = useTeacherProfile();
  const [departmentData, setDepartmentData] = useState(null);

  useEffect(() => {
    if (teacherProfile?.is_hod && teacherProfile.department_id) {
      // Fetch department data
      supabase
        .from('departments')
        .select('*, teachers(*), students(*), subjects(*)')
        .eq('id', teacherProfile.department_id)
        .single()
        .then(({ data }) => setDepartmentData(data));
    }
  }, [teacherProfile]);

  return (
    <HODOnly>
      <div>
        <h1>{departmentData?.full_name} Management</h1>
        <p>Teachers: {departmentData?.teachers?.length}</p>
        <p>Students: {departmentData?.students?.length}</p>
        <p>Subjects: {departmentData?.subjects?.length}</p>
      </div>
    </HODOnly>
  );
}
```

---

## 🔍 Debugging

### Check Current User Role

```tsx
import { useAuth } from '@/lib/auth/useAuth';

function DebugPanel() {
  const { user, profile } = useAuth();

  return (
    <div>
      <p>User ID: {user?.id}</p>
      <p>Email: {profile?.email}</p>
      <p>Role: {profile?.role}</p>
      <p>Name: {profile?.full_name}</p>
    </div>
  );
}
```

---

## 🚨 Common Pitfalls

1. **Don't rely only on frontend checks** - Always enforce permissions in the database with RLS
2. **Check loading state** - Always handle the loading state to prevent flashing content
3. **Use fallbacks** - Provide fallback UI for unauthorized users
4. **Type safety** - Use TypeScript types for better development experience

---

## ✅ Best Practices

1. ✅ Always use RLS policies in addition to frontend checks
2. ✅ Use permission hooks over role checks when possible
3. ✅ Provide clear feedback for unauthorized access
4. ✅ Test with all role types during development
5. ✅ Use TypeScript for type safety

---

## 📖 Additional Resources

- [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md) - Detailed role documentation
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Database setup instructions
