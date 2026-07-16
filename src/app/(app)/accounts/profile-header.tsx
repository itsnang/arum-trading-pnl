'use client'

import { useEffect, useState } from 'react'
import { LogOut, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UserAvatar } from '@/components/shared/user-avatar'
import { ProfileSheet } from '@/features/profile/components/profile-sheet'
import { signOut } from '@/lib/better-auth/client'
import type { ProfileUser } from '@/features/profile/types'

interface ProfileHeaderProps {
  user: ProfileUser
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  // Optimistic local state: update immediately on save so the UI doesn't wait
  // for the 60s better-auth cookie cache to expire before reflecting changes.
  const [localName, setLocalName] = useState(user.name)
  const [localImage, setLocalImage] = useState(user.image)

  // Sync when the server prop eventually catches up (cookie cache expires → router.refresh resolves)
  useEffect(() => { setLocalName(user.name) }, [user.name])
  useEffect(() => { setLocalImage(user.image) }, [user.image])

  return (
    <>
      <div className="flex items-center gap-4 px-5 pt-8 pb-5">
        <button
          type="button"
          data-tour="profile-avatar"
          onClick={() => setEditOpen(true)}
          className="relative shrink-0 active:opacity-80"
        >
          <UserAvatar name={localName} image={localImage} size={64} />
          <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-clay shadow-sm">
            <Pencil size={10} className="text-white" strokeWidth={2.5} />
          </div>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold">{localName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red/30 bg-red/10 text-red transition-colors hover:bg-red/20 active:scale-95 md:hidden"
        >
          <LogOut size={14} />
        </button>
      </div>

      <ProfileSheet
        user={{ ...user, name: localName, image: localImage }}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={(name, image) => {
          setLocalName(name)
          if (image !== undefined) setLocalImage(image)
        }}
      />
    </>
  )
}
