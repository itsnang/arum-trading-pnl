/** Returns "YYYY-MM" for the given Date. */
export function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Returns a Date set to the first day of the given "YYYY-MM" key. */
export function fromMonthKey(key: string): Date {
  const [yearStr, monthStr] = key.split('-')
  return new Date(Number(yearStr), Number(monthStr) - 1, 1)
}

/** "July 2026" display label from a "YYYY-MM" key. */
export function formatMonthLabel(key: string): string {
  return fromMonthKey(key).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Returns the "YYYY-MM" key for prev/next month. */
export function shiftMonth(key: string, delta: -1 | 1): string {
  const d = fromMonthKey(key)
  d.setMonth(d.getMonth() + delta)
  return toMonthKey(d)
}
