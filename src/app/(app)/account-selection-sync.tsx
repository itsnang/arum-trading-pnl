'use client'

import { useEffect, useState } from 'react'
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useSelectedAccountStore } from '@/features/accounts/store/accounts.store'

/**
 * Rehydrates the persisted account selection from localStorage, then keeps
 * it valid: falls back to the first account if nothing is selected yet, or
 * if the selected account was deleted. Centralized here instead of
 * duplicated per-screen so every route agrees on the same selection.
 *
 * The fallback logic is gated on `hasHydrated` rather than effect-ordering
 * (e.g. layout effect vs. passive effect) — racing rehydrate() against the
 * "pick a default account" effect silently overwrites a real persisted
 * selection with accounts[0] before the rehydrated value ever becomes
 * visible to it.
 *
 * `hasHydrated` always starts `false` rather than reading
 * `useSelectedAccountStore.persist.hasHydrated()` up front: the persist
 * middleware only attaches `.persist` once it can reach `window.localStorage`
 * at store-creation time, which never happens on the server, so touching
 * `.persist` outside an effect crashes SSR.
 */
export function AccountSelectionSync() {
  const [hasHydrated, setHasHydrated] = useState(false)

  // Layout effect so the rehydrated value (if any) lands before paint,
  // minimizing the flash of the wrong account. The fallback effect below
  // still waits for the onFinishHydration signal rather than trusting
  // effect-ordering, since that's what actually determines correctness.
  // Runs once on mount — subscribing to hydration only ever needs to happen once.
  useIsomorphicLayoutEffect(() => {
    const unsub = useSelectedAccountStore.persist.onFinishHydration(() => setHasHydrated(true))
    useSelectedAccountStore.persist.rehydrate()
    return unsub
  }, [])

  const { data: accounts } = useAccounts()
  const selectedAccountId = useSelectedAccountStore((s) => s.selectedAccountId)
  const setSelectedAccountId = useSelectedAccountStore((s) => s.setSelectedAccountId)

  useEffect(() => {
    if (!hasHydrated || !accounts || accounts.length === 0) return
    const stillExists = accounts.some((a) => a.id === selectedAccountId)
    if (stillExists) return
    const first = accounts[0]
    if (first) setSelectedAccountId(first.id)
  }, [hasHydrated, accounts, selectedAccountId, setSelectedAccountId])

  return null
}
