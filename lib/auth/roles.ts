/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Provides type-safe role checking and permission utilities for the frontend.
 * Works with Supabase authentication and the academic progress tracking system.
 */

import { User } from '@supabase/supabase-js';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'teacher' | 'hod' | 'principal';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  college_id: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherProfile extends UserProfile {
  role: 'teacher' | 'hod';
  department_id: string;
  designation: string;
  is_hod: boolean;
}

export interface StudentProfile extends UserProfile {
  role: 'student';
  roll_no: string;
  department_id: string;
  batch: string;
  semester: number;
  section: string;
}

// ─── ROLE HIERARCHY ─────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  teacher: 1,
  hod: 2,
  principal: 3,
};

// ─── ROLE CHECKING UTILITIES ────────────────────────────────────────────────

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return userRole === requiredRole;
}

/**
 * Check if user has at least the specified role (or higher in hierarchy)
 */
export function hasMinRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Check if user is a principal
 */
export function isPrincipal(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, 'principal');
}

/**
 * Check if user is HOD
 */
export function isHOD(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, 'hod');
}

/**
 * Check if user is a teacher (not HOD)
 */
export function isTeacher(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, 'teacher');
}

/**
 * Check if user is a student
 */
export function isStudent(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, 'student');
}

/**
 * Check if user is HOD or Principal (admin level)
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return isHOD(userRole) || isPrincipal(userRole);
}

/**
 * Check if user is Teacher, HOD, or Principal
 */
export function isTeacherOrAdmin(userRole: UserRole | undefined): boolean {
  return hasMinRole(userRole, 'teacher');
}

// ─── PERMISSION CHECKS ──────────────────────────────────────────────────────

export const Permissions = {
  // Department management
  canManageAllDepartments: (role: UserRole | undefined) => isPrincipal(role),
  canViewDepartments: (role: UserRole | undefined) => !!role,

  // Teacher management
  canManageAllTeachers: (role: UserRole | undefined) => isPrincipal(role),
  canManageDepartmentTeachers: (role: UserRole | undefined) => isAdmin(role),
  canViewTeachers: (role: UserRole | undefined) => !!role,

  // Student management
  canManageAllStudents: (role: UserRole | undefined) => isPrincipal(role),
  canManageDepartmentStudents: (role: UserRole | undefined) => isAdmin(role),
  canViewAllStudents: (role: UserRole | undefined) => isTeacherOrAdmin(role),
  canViewOwnProfile: (role: UserRole | undefined) => !!role,

  // Subject management
  canManageAllSubjects: (role: UserRole | undefined) => isPrincipal(role),
  canManageDepartmentSubjects: (role: UserRole | undefined) => isAdmin(role),
  canCreateSubjects: (role: UserRole | undefined) => isTeacherOrAdmin(role),
  canViewSubjects: (role: UserRole | undefined) => !!role,

  // Exam management
  canManageAllExams: (role: UserRole | undefined) => isPrincipal(role),
  canManageDepartmentExams: (role: UserRole | undefined) => isAdmin(role),
  canManageOwnExams: (role: UserRole | undefined) => isTeacherOrAdmin(role),
  canCreateExams: (role: UserRole | undefined) => isTeacherOrAdmin(role),
  canViewExams: (role: UserRole | undefined) => !!role,

  // Marks management
  canViewAllMarks: (role: UserRole | undefined) => isPrincipal(role),
  canViewDepartmentMarks: (role: UserRole | undefined) => isAdmin(role),
  canEnterMarks: (role: UserRole | undefined) => isTeacherOrAdmin(role),
  canViewOwnMarks: (role: UserRole | undefined) => isStudent(role),

  // Feedback
  canViewAllFeedback: (role: UserRole | undefined) => isPrincipal(role),
  canViewDepartmentFeedback: (role: UserRole | undefined) => isAdmin(role),
  canCreateFeedback: (role: UserRole | undefined) => isTeacherOrAdmin(role),
  canViewOwnFeedback: (role: UserRole | undefined) => isStudent(role),

  // Reports
  canGenerateCollegeReports: (role: UserRole | undefined) => isPrincipal(role),
  canGenerateDepartmentReports: (role: UserRole | undefined) => isAdmin(role),
  canGenerateClassReports: (role: UserRole | undefined) => isTeacherOrAdmin(role),
};

// ─── UI HELPERS ─────────────────────────────────────────────────────────────

/**
 * Get dashboard route based on user role
 */
export function getDashboardRoute(role: UserRole | undefined): string {
  switch (role) {
    case 'principal':
      return '/dashboard/principal';
    case 'hod':
      return '/dashboard/hod';
    case 'teacher':
      return '/dashboard/teacher';
    case 'student':
      return '/dashboard/student';
    default:
      return '/';
  }
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole | undefined): string {
  switch (role) {
    case 'principal':
      return 'Principal';
    case 'hod':
      return 'Head of Department';
    case 'teacher':
      return 'Teacher';
    case 'student':
      return 'Student';
    default:
      return 'Unknown';
  }
}

/**
 * Get role badge color (for Tailwind CSS)
 */
export function getRoleBadgeColor(role: UserRole | undefined): string {
  switch (role) {
    case 'principal':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'hod':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'teacher':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'student':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get role icon (emoji or icon name)
 */
export function getRoleIcon(role: UserRole | undefined): string {
  switch (role) {
    case 'principal':
      return '👑';
    case 'hod':
      return '🎓';
    case 'teacher':
      return '📚';
    case 'student':
      return '🎒';
    default:
      return '👤';
  }
}

// ─── DEPARTMENT SCOPE HELPERS ───────────────────────────────────────────────

/**
 * Check if user can access a specific department
 */
export function canAccessDepartment(
  userRole: UserRole | undefined,
  userDepartmentId: string | undefined,
  targetDepartmentId: string
): boolean {
  // Principal can access all departments
  if (isPrincipal(userRole)) return true;

  // HOD can only access their department
  if (isHOD(userRole)) {
    return userDepartmentId === targetDepartmentId;
  }

  // Teachers can view all departments but can't manage others
  if (isTeacher(userRole)) {
    return userDepartmentId === targetDepartmentId;
  }

  // Students can only see their own department
  if (isStudent(userRole)) {
    return userDepartmentId === targetDepartmentId;
  }

  return false;
}

/**
 * Check if user can modify data in a specific department
 */
export function canModifyDepartment(
  userRole: UserRole | undefined,
  userDepartmentId: string | undefined,
  targetDepartmentId: string
): boolean {
  // Principal can modify all departments
  if (isPrincipal(userRole)) return true;

  // HOD can only modify their department
  if (isHOD(userRole)) {
    return userDepartmentId === targetDepartmentId;
  }

  // Teachers and students cannot modify departments
  return false;
}

// ─── EXPORT ALL ─────────────────────────────────────────────────────────────

export default {
  hasRole,
  hasMinRole,
  isPrincipal,
  isHOD,
  isTeacher,
  isStudent,
  isAdmin,
  isTeacherOrAdmin,
  Permissions,
  getDashboardRoute,
  getRoleDisplayName,
  getRoleBadgeColor,
  getRoleIcon,
  canAccessDepartment,
  canModifyDepartment,
};
