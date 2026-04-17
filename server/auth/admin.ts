import type { SessionUser } from './sessions';

// ADMIN_EMAILS=mail1@x.de,mail2@y.de — kommaseparierte Liste.
// Ungesetzt → niemand ist admin, alle /admin/*-Routen geben 404.
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(user: SessionUser | null): boolean {
  if (!user) return false;
  return getAdminEmails().includes(user.email.toLowerCase());
}
