'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { withAuthAction } from '@/lib/better-auth/middleware'
import { auth } from '@/lib/better-auth/server'
import { storageAdapter } from '@/lib/storage'
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES, STORAGE_BUCKET } from '@/lib/storage/constants'
import { env } from '@/env'
import { editProfileSchema } from '../schemas'

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

    try {
      await storageAdapter.upload(path, file, file.type, { upsert: true })
      const url = `${storageAdapter.getPublicUrl(path)}?t=${Date.now()}`
      return { url }
    } catch {
      return { error: 'Failed to upload avatar' }
    }
  },
)

export const updateProfile = withAuthAction(
  async ({ user }, { name, image }: { name: string; image?: string }): Promise<{ error?: string }> => {
    // Validate name with schema
    const parsed = editProfileSchema.safeParse({ name })
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return { error: firstError?.message ?? 'Invalid name' }
    }

    // If an image URL is provided, ensure it belongs to this user's avatar path
    // in our own storage bucket — prevents arbitrary URL injection.
    if (image !== undefined) {
      const expectedPrefix = `${env.SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/avatars/${user.id}/`
      if (!image.startsWith(expectedPrefix)) {
        return { error: 'Invalid avatar URL' }
      }
    }

    try {
      await auth.api.updateUser({
        headers: await headers(),
        body: { name: parsed.data.name, ...(image !== undefined && { image }) },
      })
      revalidatePath('/', 'layout')
      return {}
    } catch {
      return { error: 'Failed to update profile' }
    }
  },
)
