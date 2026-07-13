import { z } from 'zod'

export const quickTradeSchema = z.object({
  accountId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  result: z.enum(['win', 'loss']),
  pnl: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
      'Enter a positive amount',
    ),
  screenshotPath: z.string().optional(),
})

export type QuickTradeInput = z.infer<typeof quickTradeSchema>
