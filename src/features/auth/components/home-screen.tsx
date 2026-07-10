'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/better-auth/client'
import { PageShell } from '@/components/shared/page-shell'
import { Button } from '@/components/ui/button'

export function HomeScreen({ name }: { name: string }) {
  const router = useRouter()

  const handleSignOut = () => {
    signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })
  }

  return (
    <PageShell heading={`Welcome, ${name}`} description="You are signed in.">
      <Button type="button" variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </PageShell>
  )
}
