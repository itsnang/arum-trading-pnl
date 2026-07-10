import { z } from 'zod'

export const addAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  broker: z.string().max(60).optional(),
  type: z.enum(['personal', 'funded', 'demo']),
  startingBalance: z
    .string()
    .min(1, 'Balance is required')
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0,
      'Enter a valid amount',
    ),
})

export type AddAccountInput = z.infer<typeof addAccountSchema>
