/** Company owners with this email can access /super-admin routes. */
export function isSuperAdmin(email: string | null | undefined) {
  const allowed = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!allowed || !email) return false;
  return email.trim().toLowerCase() === allowed;
}
