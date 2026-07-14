export const queryKeys = {
  accounts: () => ['accounts'] as const,
  archivedAccounts: () => ['accounts', 'archived'] as const,
  journal: () => ['journal'] as const,
  dayTrades: (accountId: string, date: string) =>
    ['trades', 'day', accountId, date] as const,
  monthJournal: (accountId: string, month: string) =>
    ['journal', 'month', accountId, month] as const,
}
