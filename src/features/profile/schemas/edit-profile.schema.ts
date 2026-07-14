import { z } from 'zod'

export const editProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64),
})

export type EditProfileInput = z.infer<typeof editProfileSchema>
