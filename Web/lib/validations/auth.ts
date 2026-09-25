import { z } from "zod";

const trimmedString = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`);

export const employerRegisterSchema = z
  .object({
    companyName: trimmedString("Company name", 200),
    ownerName: trimmedString("Your name", 120),
    email: z
      .string()
      .trim()
      .min(1, "Work email is required")
      .email("Enter a valid work email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    termsAccepted: z.boolean().refine((value) => value === true, {
      message: "You must accept the Terms of Service and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type EmployerRegisterInput = z.infer<typeof employerRegisterSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Work email is required")
    .email("Enter a valid work email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function parseEmployerRegisterFormData(formData: FormData) {
  return employerRegisterSchema.safeParse({
    companyName: String(formData.get("companyName") ?? ""),
    ownerName: String(formData.get("ownerName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    termsAccepted: formData.get("termsAccepted") === "on",
  });
}

export function parseLoginFormData(formData: FormData) {
  return loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
}

const passwordFieldSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Reset link is invalid or expired"),
    password: passwordFieldSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function parseForgotPasswordFormData(formData: FormData) {
  return forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
}

export function parseResetPasswordFormData(formData: FormData) {
  return resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
}
