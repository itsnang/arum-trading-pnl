'use client'

import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { AccountForm } from '@/features/accounts/components/account-form'

/** Blocks the app behind a blurred overlay until the user has at least one trading account. */
export function OnboardingGate() {
  const { data: accounts, isPending } = useAccounts()

  if (isPending || (accounts && accounts.length > 0)) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-xl bg-background p-5 shadow-lg">
        <h2 className="text-lg font-bold">Create your first trading account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add an account to start tracking your trades.
        </p>
        <div className="mt-4">
          <AccountForm />
        </div>
      </div>
    </div>
  )
}
