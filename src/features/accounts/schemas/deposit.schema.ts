import { z } from 'zod'

export const depositSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
      'Enter a valid amount',
    ),
  note: z.string().max(500, 'Keep it under 500 characters').optional(),
})

export type DepositInput = z.infer<typeof depositSchema>
