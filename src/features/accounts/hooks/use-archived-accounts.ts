'use client'

import { useQuery } from '@tanstack/react-query'
import { archivedAccountsQueryOptions } from '../utils'

export function useArchivedAccounts() {
  return useQuery(archivedAccountsQueryOptions())
}
