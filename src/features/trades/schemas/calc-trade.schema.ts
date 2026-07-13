import { z } from 'zod'

const positiveNumStr = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
      `Enter a valid ${label}`,
    )

export const calcTradeSchema = z.object({
  accountId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  direction: z.enum(['buy', 'sell']),
  entryPrice: positiveNumStr('entry price'),
  exitPrice: positiveNumStr('exit price'),
  lotSize: positiveNumStr('lot size'),
  screenshotPath: z.string().optional(),
})

export type CalcTradeInput = z.infer<typeof calcTradeSchema>
