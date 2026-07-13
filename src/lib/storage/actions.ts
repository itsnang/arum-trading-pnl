'use server'

import { withAuthAction } from '@/lib/better-auth/middleware'
import { storageAdapter } from './index'
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES, DEFAULT_SIGNED_URL_TTL_SECONDS } from './constants'

export const uploadFile = withAuthAction(
  async ({ user }, formData: FormData): Promise<{ error?: string; url?: string; path?: string }> => {
    const file = formData.get('file')
    if (!(file instanceof File)) return { error: 'No file provided' }
    if (file.size === 0) return { error: 'File is empty' }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: `File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit` }
    }

    // file.type is browser-supplied and not magic-byte verified — acceptable
    // for this scope (accidental misuse, not adversarial upload resistance).
    const mime = file.type as keyof typeof ALLOWED_UPLOAD_MIME_TYPES
    if (!(file.type in ALLOWED_UPLOAD_MIME_TYPES)) return { error: 'Unsupported file type' }
    const ext = ALLOWED_UPLOAD_MIME_TYPES[mime]

    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    try {
      await storageAdapter.upload(path, file, file.type)
      const url = await storageAdapter.getSignedUrl(path, DEFAULT_SIGNED_URL_TTL_SECONDS)
      return { url, path }
    } catch {
      return { error: 'Failed to upload file' }
    }
  },
)
