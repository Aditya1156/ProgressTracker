/**
 * Input Validation Utilities
 * Provides secure validation for user inputs
 */

// UUID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength validation
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validate UUID format
 */
export function isValidUUID(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMAIL_REGEX.test(value);
}

/**
 * Validate password strength
 * Returns error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }

  return null; // Valid
}

/**
 * Validate integer within range
 */
export function isValidInteger(
  value: string | null | undefined,
  min?: number,
  max?: number
): boolean {
  if (!value) return false;

  const num = parseInt(value, 10);
  if (isNaN(num)) return false;

  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;

  return true;
}

/**
 * Validate semester number (1-8)
 */
export function isValidSemester(value: string | null | undefined): boolean {
  return isValidInteger(value, 1, 8);
}

/**
 * Validate exam type
 */
export const VALID_EXAM_TYPES = ["class_test", "mid_sem", "end_sem", "assignment", "practical"] as const;
export type ExamType = (typeof VALID_EXAM_TYPES)[number];

export function isValidExamType(value: string | null | undefined): value is ExamType {
  if (!value) return false;
  return VALID_EXAM_TYPES.includes(value as ExamType);
}

/**
 * Validate user role
 */
export const VALID_ROLES = ["student", "teacher", "hod", "principal", "class_coordinator", "lab_assistant", "parent"] as const;
export type UserRole = (typeof VALID_ROLES)[number];

export function isValidRole(value: string | null | undefined): value is UserRole {
  if (!value) return false;
  return VALID_ROLES.includes(value as UserRole);
}

/**
 * Sanitize string input (basic XSS prevention)
 * Note: React handles XSS, but good to sanitize database inputs
 */
export function sanitizeString(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .trim()
    .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
    .substring(0, 1000); // Limit length
}

/**
 * Validate marks value
 */
export function isValidMarks(
  marksObtained: number,
  maxMarks: number
): boolean {
  if (marksObtained < 0 || marksObtained > maxMarks) {
    return false;
  }
  return true;
}

/**
 * Generic validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate API request parameters
 */
export function validateRequired<T extends Record<string, any>>(
  params: T,
  requiredFields: (keyof T)[]
): ValidationResult<T> {
  for (const field of requiredFields) {
    if (!params[field]) {
      return {
        success: false,
        error: `Missing required field: ${String(field)}`,
      };
    }
  }

  return {
    success: true,
    data: params,
  };
}
