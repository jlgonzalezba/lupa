export const ADMIN_EMAILS = [
  'admin@lupa.com',
  'jlgonzalezba@gmail.com',
]

export function isAdminEmail(email: string | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}