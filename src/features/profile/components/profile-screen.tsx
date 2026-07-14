'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { signOut } from '@/lib/better-auth/client'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ProfileSheet } from './profile-sheet'
import type { ProfileUser } from '../types'

interface ProfileScreenProps {
  user: ProfileUser
}

export function ProfileScreen({ user }: ProfileScreenProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const initial = user.name.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => router.push('/login'),
        },
      })
    } catch {
      toast.error('Sign out failed. Please try again.')
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-8">
        <div>
          <h1 className="text-xl font-extrabold">Profile</h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Avatar + identity */}
      <div className="flex flex-col items-center gap-3 px-5 py-8">
        {/* Avatar circle */}
        <div className="relative h-20 w-20 overflow-hidden rounded-full">
          {user.image ? (
            <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-clay/20 text-2xl font-extrabold text-clay">
              {initial}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-base font-bold">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="mt-1 rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-clay/40 hover:text-foreground active:scale-95"
        >
          Edit profile
        </button>
      </div>

      {/* Sign out — desktop sidebar has its own, so this is mobile-only */}
      <div className="mt-4 px-5 pb-4 md:hidden">
        <Separator className="mb-6" />
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          Sign out
        </Button>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Pipfolio · Built by Chhay
        </p>
      </div>

      <ProfileSheet user={user} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}
