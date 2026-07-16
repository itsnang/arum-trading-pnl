'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { withAuthAction } from '@/lib/better-auth/middleware'
import { auth } from '@/lib/better-auth/server'
import { storageAdapter } from '@/lib/storage'
import { ALLOWED_UPLOAD_MIME_TYPES, AVATAR_SIGNED_URL_TTL_SECONDS, MAX_UPLOAD_BYTES, STORAGE_BUCKET } from '@/lib/storage/constants'
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
      // Use a 10-year signed URL so the avatar persists without expiry concerns
      // while keeping the bucket private (trade screenshots share the same bucket).
      const url = await storageAdapter.getSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS)
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

    // Validate the image URL belongs to this user's avatar path in our bucket —
    // prevents arbitrary URL injection. Signed URLs contain the path as a segment.
    if (image !== undefined) {
      const expectedPathSegment = `/object/sign/${STORAGE_BUCKET}/avatars/${user.id}/`
      if (!image.includes(expectedPathSegment)) {
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
