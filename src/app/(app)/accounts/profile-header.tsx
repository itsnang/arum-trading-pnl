'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { UserAvatar } from '@/components/shared/user-avatar'
import { ProfileSheet } from '@/features/profile/components/profile-sheet'
import type { ProfileUser } from '@/features/profile/types'

interface ProfileHeaderProps {
  user: ProfileUser
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-4 px-5 pt-8 pb-5">
        {/* Avatar with pencil badge */}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="shrink-0 active:opacity-80"
        >
          <UserAvatar name={user.name} image={user.image} size={64} />
        </button>

        {/* Name + email + edit */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold transition-colors hover:bg-hair active:scale-95"
        >
          <Pencil size={13} />
          Edit
        </button>
      </div>

      <ProfileSheet user={user} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  )
}
