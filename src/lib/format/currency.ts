export function formatPnl(
  value: number | string,
  opts?: { showPlus?: boolean },
): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(n))
  if (n >= 0) return opts?.showPlus === true ? `+$${formatted}` : `$${formatted}`
  return `-$${formatted}`
}

export function formatBalance(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/** Compact signed P&L for tight spaces, e.g. "+12k", "-1.4k", "+340". */
export function formatPnlShort(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : '+'
  if (abs >= 10000) return `${sign}${(abs / 1000).toFixed(0)}k`
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`
  return `${sign}${Math.round(abs)}`
}
