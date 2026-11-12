/**
 * Files live in Supabase Storage (bucket "order-inspiration"), but we never show the
 * Supabase domain to users. next.config.ts rewrites merchin.co/files/* to the bucket,
 * so the browser address bar always says merchin.co.
 */
const STORAGE_RE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/order-inspiration\//i;

/** Supabase public URL → "/files/…" (or absolute when a base like https://merchin.co is given). */
export function fileUrl(url: string, base = ''): string {
  if (!url || !STORAGE_RE.test(url)) return url;
  return `${base.replace(/\/$/, '')}/files/${url.replace(STORAGE_RE, '')}`;
}
