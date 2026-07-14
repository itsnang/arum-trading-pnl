import type { AccountType } from '../types'

export const typeBadge: Record<AccountType, { label: string; className: string }> = {
  personal: { label: 'Personal', className: 'bg-green/10 text-green' },
  funded: { label: 'Funded', className: 'bg-clay/10 text-clay' },
  demo: { label: 'Demo', className: 'bg-hair text-muted-foreground' },
}
