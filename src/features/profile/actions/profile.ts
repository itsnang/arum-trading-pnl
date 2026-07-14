'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { withAuthAction } from '@/lib/better-auth/middleware'
import { auth } from '@/lib/better-auth/server'
import { storageAdapter } from '@/lib/storage'
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES } from '@/lib/storage/constants'

export const uploadAvatar = withAuthAction(
  async ({ user }, formData: FormData): Promise<{ error?: string; url?: string }> => {
    const file = formData.get('file')
    if (!(file instanceof File)) return { error: 'No file provided' }
    if (file.size === 0) return { error: 'File is empty' }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: `File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit` }
    }

    const mime = file.type as keyof typeof ALLOWED_UPLOAD_MIME_TYPES
    if (!(file.type in ALLOWED_UPLOAD_MIME_TYPES)) return { error: 'Unsupported file type' }
    const ext = ALLOWED_UPLOAD_MIME_TYPES[mime]

    const path = `avatars/${user.id}/avatar.${ext}`

    // Delete the old avatar (ignore errors — it may not exist yet)
    await storageAdapter.delete(path).catch(() => undefined)

    try {
      await storageAdapter.upload(path, file, file.type)
      const url = storageAdapter.getPublicUrl(path)
      return { url }
    } catch {
      return { error: 'Failed to upload avatar' }
    }
  },
)

export const updateProfile = withAuthAction(
  async (_session, { name, image }: { name: string; image?: string }): Promise<{ error?: string }> => {
    try {
      await auth.api.updateUser({
        headers: await headers(),
        body: { name, ...(image !== undefined && { image }) },
      })
      revalidatePath('/', 'layout')
      return {}
    } catch {
      return { error: 'Failed to update profile' }
    }
  },
)
