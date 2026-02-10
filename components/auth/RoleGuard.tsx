/**
 * Role-Based Component Guards
 *
 * React components for conditional rendering based on user roles and permissions.
 * Use these to show/hide UI elements based on user access level.
 */

'use client';

import { ReactNode } from 'react';
import { UserRole } from '@/lib/auth/roles';
import {
  useUserRole,
  useIsPrincipal,
  useIsHOD,
  useIsTeacher,
  useIsStudent,
  useIsAdmin,
  useIsTeacherOrAdmin,
  usePermissions,
} from '@/lib/auth/useAuth';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface RoleGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface RequireRoleProps extends RoleGuardProps {
  role: UserRole | UserRole[];
}

interface RequirePermissionProps extends RoleGuardProps {
  permission: (permissions: ReturnType<typeof usePermissions>) => boolean;
}

// ─── ROLE-SPECIFIC GUARDS ───────────────────────────────────────────────────

/**
 * Render children only if user is Principal
 *
 * @example
 * <PrincipalOnly>
 *   <ManageDepartmentsButton />
 * </PrincipalOnly>
 */
export function PrincipalOnly({ children, fallback = null }: RoleGuardProps) {
  const isPrincipal = useIsPrincipal();
  return <>{isPrincipal ? children : fallback}</>;
}

/**
 * Render children only if user is HOD
 *
 * @example
 * <HODOnly>
 *   <ManageDepartmentTeachers />
 * </HODOnly>
 */
export function HODOnly({ children, fallback = null }: RoleGuardProps) {
  const isHOD = useIsHOD();
  return <>{isHOD ? children : fallback}</>;
}

/**
 * Render children only if user is Teacher
 *
 * @example
 * <TeacherOnly>
 *   <CreateExamButton />
 * </TeacherOnly>
 */
export function TeacherOnly({ children, fallback = null }: RoleGuardProps) {
  const isTeacher = useIsTeacher();
  return <>{isTeacher ? children : fallback}</>;
}

/**
 * Render children only if user is Student
 *
 * @example
 * <StudentOnly>
 *   <ViewMarksButton />
 * </StudentOnly>
 */
export function StudentOnly({ children, fallback = null }: RoleGuardProps) {
  const isStudent = useIsStudent();
  return <>{isStudent ? children : fallback}</>;
}

/**
 * Render children only if user is Admin (HOD or Principal)
 *
 * @example
 * <AdminOnly>
 *   <ManageUsersButton />
 * </AdminOnly>
 */
export function AdminOnly({ children, fallback = null }: RoleGuardProps) {
  const isAdmin = useIsAdmin();
  return <>{isAdmin ? children : fallback}</>;
}

/**
 * Render children only if user is Teacher or Admin
 *
 * @example
 * <TeacherOrAdminOnly>
 *   <EnterMarksButton />
 * </TeacherOrAdminOnly>
 */
export function TeacherOrAdminOnly({ children, fallback = null }: RoleGuardProps) {
  const isTeacherOrAdmin = useIsTeacherOrAdmin();
  return <>{isTeacherOrAdmin ? children : fallback}</>;
}

// ─── FLEXIBLE ROLE GUARD ────────────────────────────────────────────────────

/**
 * Render children only if user has one of the specified roles
 *
 * @example
 * <RequireRole role="principal">
 *   <DeleteButton />
 * </RequireRole>
 *
 * @example
 * <RequireRole role={['teacher', 'hod', 'principal']}>
 *   <CreateExamButton />
 * </RequireRole>
 */
export function RequireRole({ children, role, fallback = null }: RequireRoleProps) {
  const userRole = useUserRole();

  if (!userRole) return <>{fallback}</>;

  const allowedRoles = Array.isArray(role) ? role : [role];
  const hasAccess = allowedRoles.includes(userRole);

  return <>{hasAccess ? children : fallback}</>;
}

// ─── PERMISSION-BASED GUARD ─────────────────────────────────────────────────

/**
 * Render children only if user has specific permission
 *
 * @example
 * <RequirePermission permission={(p) => p.canManageAllStudents}>
 *   <DeleteAllStudentsButton />
 * </RequirePermission>
 *
 * @example
 * <RequirePermission
 *   permission={(p) => p.canEnterMarks}
 *   fallback={<p>You don't have permission to enter marks</p>}
 * >
 *   <EnterMarksForm />
 * </RequirePermission>
 */
export function RequirePermission({
  children,
  permission,
  fallback = null,
}: RequirePermissionProps) {
  const permissions = usePermissions();
  const hasPermission = permission(permissions);

  return <>{hasPermission ? children : fallback}</>;
}

// ─── INVERSE GUARDS ─────────────────────────────────────────────────────────

/**
 * Render children only if user is NOT a specific role
 *
 * @example
 * <NotStudent>
 *   <TeacherPanel />
 * </NotStudent>
 */
export function NotStudent({ children, fallback = null }: RoleGuardProps) {
  const isStudent = useIsStudent();
  return <>{!isStudent ? children : fallback}</>;
}

/**
 * Render children only if user is authenticated (any role)
 *
 * @example
 * <Authenticated>
 *   <DashboardLink />
 * </Authenticated>
 */
export function Authenticated({ children, fallback = null }: RoleGuardProps) {
  const userRole = useUserRole();
  return <>{userRole ? children : fallback}</>;
}

/**
 * Render children only if user is NOT authenticated
 *
 * @example
 * <NotAuthenticated>
 *   <LoginButton />
 * </NotAuthenticated>
 */
export function NotAuthenticated({ children, fallback = null }: RoleGuardProps) {
  const userRole = useUserRole();
  return <>{!userRole ? children : fallback}</>;
}

// ─── MULTI-CONDITION GUARD ──────────────────────────────────────────────────

interface ConditionalRenderProps {
  conditions: {
    principal?: ReactNode;
    hod?: ReactNode;
    teacher?: ReactNode;
    student?: ReactNode;
  };
  fallback?: ReactNode;
}

/**
 * Render different content based on user role
 *
 * @example
 * <ConditionalRender
 *   conditions={{
 *     principal: <PrincipalDashboard />,
 *     hod: <HODDashboard />,
 *     teacher: <TeacherDashboard />,
 *     student: <StudentDashboard />,
 *   }}
 *   fallback={<LoginPage />}
 * />
 */
export function ConditionalRender({ conditions, fallback = null }: ConditionalRenderProps) {
  const userRole = useUserRole();

  if (!userRole) return <>{fallback}</>;

  switch (userRole) {
    case 'principal':
      return <>{conditions.principal ?? fallback}</>;
    case 'hod':
      return <>{conditions.hod ?? fallback}</>;
    case 'teacher':
      return <>{conditions.teacher ?? fallback}</>;
    case 'student':
      return <>{conditions.student ?? fallback}</>;
    default:
      return <>{fallback}</>;
  }
}

// ─── ROLE BADGE COMPONENT ───────────────────────────────────────────────────

import { getRoleDisplayName, getRoleBadgeColor, getRoleIcon } from '@/lib/auth/roles';

interface RoleBadgeProps {
  role?: UserRole;
  showIcon?: boolean;
  className?: string;
}

/**
 * Display a badge showing the user's role
 *
 * @example
 * <RoleBadge role={userRole} showIcon />
 */
export function RoleBadge({ role, showIcon = true, className = '' }: RoleBadgeProps) {
  if (!role) return null;

  const displayName = getRoleDisplayName(role);
  const badgeColor = getRoleBadgeColor(role);
  const icon = getRoleIcon(role);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor} ${className}`}
    >
      {showIcon && <span>{icon}</span>}
      <span>{displayName}</span>
    </span>
  );
}

// ─── EXPORTS ────────────────────────────────────────────────────────────────

export default {
  PrincipalOnly,
  HODOnly,
  TeacherOnly,
  StudentOnly,
  AdminOnly,
  TeacherOrAdminOnly,
  RequireRole,
  RequirePermission,
  NotStudent,
  Authenticated,
  NotAuthenticated,
  ConditionalRender,
  RoleBadge,
};
