import type { ReactNode } from 'react'
import { requireSession } from '@/lib/better-auth/session'
import { AppShell } from '@/components/shared/app-shell'
import { OnboardingGate } from './onboarding-gate'
import { PrefetchController } from './prefetch-controller'

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession()
  return (
    <AppShell>
      {children}
      <OnboardingGate />
      <PrefetchController />
    </AppShell>
  )
}
