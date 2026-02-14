import * as z from "zod";

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .transform((v) => v.trim()),
});

export const passwordChangeSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/\d/, "Must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const institutionSettingsSchema = z.object({
  name: z.string().min(1, "Institution name is required").max(200),
  code: z.string().min(1, "Code is required").max(20),
  address: z.string().max(500),
  phone: z.string().max(20),
  email: z.string(),
  website: z.string(),
});

export const academicYearSchema = z.object({
  current: z.string().regex(/^\d{4}-\d{4}$/, "Format: YYYY-YYYY"),
  start_date: z.string().min(1, "Start date required"),
  end_date: z.string().min(1, "End date required"),
});

export const gradingSchema = z.object({
  thresholds: z.record(z.string(), z.number().min(0).max(100)),
  pass_mark: z.number().min(0).max(100),
});

export const roleChangeSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  new_role: z.enum([
    "student",
    "teacher",
    "hod",
    "principal",
    "class_coordinator",
    "lab_assistant",
    "parent",
  ]),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
export type InstitutionSettingsData = z.infer<typeof institutionSettingsSchema>;
export type AcademicYearData = z.infer<typeof academicYearSchema>;
export type GradingData = z.infer<typeof gradingSchema>;
export type RoleChangeData = z.infer<typeof roleChangeSchema>;
