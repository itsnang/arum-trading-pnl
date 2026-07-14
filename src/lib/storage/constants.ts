export const STORAGE_BUCKET = 'pipfolio-uploads'
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB
export const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour
export const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10 // 10 years

// MIME allowlist doubles as the extension map for storage paths, so the two
// can never drift apart.
export const ALLOWED_UPLOAD_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const
