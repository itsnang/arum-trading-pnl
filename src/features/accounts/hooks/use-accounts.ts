'use client'

import { useQuery } from '@tanstack/react-query'
import { accountsQueryOptions } from '../utils'

export function useAccounts() {
  return useQuery(accountsQueryOptions())
}
