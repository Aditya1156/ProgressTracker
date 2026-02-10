/**
 * Authentication Hooks for Role-Based Access Control
 *
 * React hooks for checking user authentication and permissions.
 * Use these hooks in your components to control access to features.
 */

'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  UserRole,
  UserProfile,
  TeacherProfile,
  StudentProfile,
  isPrincipal,
  isHOD,
  isTeacher,
  isStudent,
  isAdmin,
  isTeacherOrAdmin,
  Permissions,
} from './roles';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

// ─── MAIN AUTH HOOK ─────────────────────────────────────────────────────────

/**
 * Main authentication hook
 * Provides current user, profile, and loading state
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          setState({
            user: session.user,
            profile: profile as UserProfile,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: error as Error,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setState({
          user: session.user,
          profile: profile as UserProfile,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return state;
}

// ─── ROLE CHECKING HOOKS ────────────────────────────────────────────────────

/**
 * Get current user's role
 */
export function useUserRole(): UserRole | null {
  const { profile } = useAuth();
  return profile?.role ?? null;
}

/**
 * Check if current user is principal
 */
export function useIsPrincipal(): boolean {
  const role = useUserRole();
  return isPrincipal(role ?? undefined);
}

/**
 * Check if current user is HOD
 */
export function useIsHOD(): boolean {
  const role = useUserRole();
  return isHOD(role ?? undefined);
}

/**
 * Check if current user is teacher
 */
export function useIsTeacher(): boolean {
  const role = useUserRole();
  return isTeacher(role ?? undefined);
}

/**
 * Check if current user is student
 */
export function useIsStudent(): boolean {
  const role = useUserRole();
  return isStudent(role ?? undefined);
}

/**
 * Check if current user is admin (HOD or Principal)
 */
export function useIsAdmin(): boolean {
  const role = useUserRole();
  return isAdmin(role ?? undefined);
}

/**
 * Check if current user is teacher or admin
 */
export function useIsTeacherOrAdmin(): boolean {
  const role = useUserRole();
  return isTeacherOrAdmin(role ?? undefined);
}

// ─── PERMISSION HOOKS ───────────────────────────────────────────────────────

/**
 * Get all permissions for current user
 */
export function usePermissions() {
  const role = useUserRole();

  return {
    // Departments
    canManageAllDepartments: Permissions.canManageAllDepartments(role ?? undefined),
    canViewDepartments: Permissions.canViewDepartments(role ?? undefined),

    // Teachers
    canManageAllTeachers: Permissions.canManageAllTeachers(role ?? undefined),
    canManageDepartmentTeachers: Permissions.canManageDepartmentTeachers(role ?? undefined),
    canViewTeachers: Permissions.canViewTeachers(role ?? undefined),

    // Students
    canManageAllStudents: Permissions.canManageAllStudents(role ?? undefined),
    canManageDepartmentStudents: Permissions.canManageDepartmentStudents(role ?? undefined),
    canViewAllStudents: Permissions.canViewAllStudents(role ?? undefined),

    // Subjects
    canManageAllSubjects: Permissions.canManageAllSubjects(role ?? undefined),
    canManageDepartmentSubjects: Permissions.canManageDepartmentSubjects(role ?? undefined),
    canCreateSubjects: Permissions.canCreateSubjects(role ?? undefined),
    canViewSubjects: Permissions.canViewSubjects(role ?? undefined),

    // Exams
    canManageAllExams: Permissions.canManageAllExams(role ?? undefined),
    canManageDepartmentExams: Permissions.canManageDepartmentExams(role ?? undefined),
    canCreateExams: Permissions.canCreateExams(role ?? undefined),
    canViewExams: Permissions.canViewExams(role ?? undefined),

    // Marks
    canViewAllMarks: Permissions.canViewAllMarks(role ?? undefined),
    canViewDepartmentMarks: Permissions.canViewDepartmentMarks(role ?? undefined),
    canEnterMarks: Permissions.canEnterMarks(role ?? undefined),
    canViewOwnMarks: Permissions.canViewOwnMarks(role ?? undefined),

    // Feedback
    canViewAllFeedback: Permissions.canViewAllFeedback(role ?? undefined),
    canViewDepartmentFeedback: Permissions.canViewDepartmentFeedback(role ?? undefined),
    canCreateFeedback: Permissions.canCreateFeedback(role ?? undefined),
    canViewOwnFeedback: Permissions.canViewOwnFeedback(role ?? undefined),

    // Reports
    canGenerateCollegeReports: Permissions.canGenerateCollegeReports(role ?? undefined),
    canGenerateDepartmentReports: Permissions.canGenerateDepartmentReports(role ?? undefined),
    canGenerateClassReports: Permissions.canGenerateClassReports(role ?? undefined),
  };
}

// ─── DEPARTMENT-SPECIFIC HOOKS ──────────────────────────────────────────────

/**
 * Get current user's department ID (for teachers/HODs/students)
 */
export function useUserDepartment(): string | null {
  const { profile } = useAuth();
  const supabase = createClientComponentClient();
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setDepartmentId(null);
      return;
    }

    const fetchDepartment = async () => {
      if (profile.role === 'teacher' || profile.role === 'hod') {
        const { data } = await supabase
          .from('teachers')
          .select('department_id')
          .eq('profile_id', profile.id)
          .single();
        setDepartmentId(data?.department_id ?? null);
      } else if (profile.role === 'student') {
        const { data } = await supabase
          .from('students')
          .select('department_id')
          .eq('profile_id', profile.id)
          .single();
        setDepartmentId(data?.department_id ?? null);
      }
    };

    fetchDepartment();
  }, [profile, supabase]);

  return departmentId;
}

/**
 * Get full teacher profile (for teachers and HODs)
 */
export function useTeacherProfile(): TeacherProfile | null {
  const { profile } = useAuth();
  const supabase = createClientComponentClient();
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    if (!profile || (profile.role !== 'teacher' && profile.role !== 'hod')) {
      setTeacherProfile(null);
      return;
    }

    const fetchTeacherProfile = async () => {
      const { data } = await supabase
        .from('teachers')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (data) {
        setTeacherProfile({
          ...profile,
          department_id: data.department_id,
          designation: data.designation,
          is_hod: data.is_hod,
        } as TeacherProfile);
      }
    };

    fetchTeacherProfile();
  }, [profile, supabase]);

  return teacherProfile;
}

/**
 * Get full student profile
 */
export function useStudentProfile(): StudentProfile | null {
  const { profile } = useAuth();
  const supabase = createClientComponentClient();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (!profile || profile.role !== 'student') {
      setStudentProfile(null);
      return;
    }

    const fetchStudentProfile = async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (data) {
        setStudentProfile({
          ...profile,
          roll_no: data.roll_no,
          department_id: data.department_id,
          batch: data.batch,
          semester: data.semester,
          section: data.section,
        } as StudentProfile);
      }
    };

    fetchStudentProfile();
  }, [profile, supabase]);

  return studentProfile;
}

// ─── PROTECTED ROUTE HOOK ───────────────────────────────────────────────────

/**
 * Protect a route based on required role
 * Redirects to appropriate page if user doesn't have access
 */
export function useRequireRole(requiredRole: UserRole | UserRole[]) {
  const { profile, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (roles.includes(profile.role)) {
      setHasAccess(true);
    } else {
      // Redirect to their dashboard
      window.location.href = getDashboardRoute(profile.role);
    }
  }, [profile, loading, requiredRole]);

  return { hasAccess, loading };
}

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'principal':
      return '/dashboard/principal';
    case 'hod':
      return '/dashboard/hod';
    case 'teacher':
      return '/dashboard/teacher';
    case 'student':
      return '/dashboard/student';
  }
}
