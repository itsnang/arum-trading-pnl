# Profile Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Profile tab (3rd nav tab) where users can view their name/avatar and edit them, with avatar images stored in Supabase Storage.

**Architecture:** New `src/features/profile/` slice with server actions, a bottom-sheet form, and a screen component. `AppShell` gains a `user` prop so the Profile tab can show the avatar/initials. Avatar upload extends the existing `StorageAdapter` with `getPublicUrl`. Updates go through better-auth's `auth.api.updateUser`.

**Tech Stack:** Next.js 16 server actions, better-auth, Supabase Storage, React Hook Form + Zod, shadcn/ui, Framer Motion (via `BottomSheet`)

---

## Files

| Action | Path |
|--------|------|
| Modify | `src/lib/storage/types.ts` |
| Modify | `src/lib/storage/supabase-adapter.ts` |
| Create | `src/features/profile/types.ts` |
| Create | `src/features/profile/schemas/edit-profile.schema.ts` |
| Create | `src/features/profile/schemas/index.ts` |
| Create | `src/features/profile/actions/profile.ts` |
| Create | `src/features/profile/actions/index.ts` |
| Create | `src/features/profile/components/avatar-upload.tsx` |
| Create | `src/features/profile/components/profile-sheet.tsx` |
| Create | `src/features/profile/components/profile-screen.tsx` |
| Create | `src/app/(app)/profile/page.tsx` |
| Modify | `src/components/shared/app-shell.tsx` |
| Modify | `src/app/(app)/layout.tsx` |
| Modify | `src/features/accounts/components/accounts-screen.tsx` |

---

### Task 1: Extend StorageAdapter with `getPublicUrl`

**Files:**
- Modify: `src/lib/storage/types.ts`
- Modify: `src/lib/storage/supabase-adapter.ts`

- [ ] **Step 1: Add `getPublicUrl` to the interface**

Replace the entire contents of `src/lib/storage/types.ts`:

```ts
import 'server-only'

export interface StorageAdapter {
  /** Uploads `file` to `path`. Throws on failure. */
  upload(path: string, file: File, contentType: string): Promise<{ path: string }>
  /** Returns a time-limited signed URL for reading a private file. Throws on failure. */
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>
  /** Returns a permanent public URL. Requires the bucket to have public read enabled. */
  getPublicUrl(path: string): string
  /** Deletes the file at `path`. Throws on failure — callers that want
   *  best-effort cleanup (e.g. deleting an owning record) should catch. */
  delete(path: string): Promise<void>
}
```

- [ ] **Step 2: Implement `getPublicUrl` in `SupabaseStorageAdapter`**

Replace the entire contents of `src/lib/storage/supabase-adapter.ts`:

```ts
import 'server-only'
import { supabaseStorageClient } from './client'
import type { StorageAdapter } from './types'

export class SupabaseStorageAdapter implements StorageAdapter {
  constructor(private readonly bucket: string) {}

  async upload(path: string, file: File, contentType: string): Promise<{ path: string }> {
    const { data, error } = await supabaseStorageClient.storage
      .from(this.bucket)
      .upload(path, file, { contentType, upsert: false })
    if (error || !data) throw new Error(`Storage upload failed: ${error?.message ?? 'unknown error'}`)
    return { path: data.path }
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await supabaseStorageClient.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds)
    if (error || !data) throw new Error(`Storage signed URL failed: ${error?.message ?? 'unknown error'}`)
    return data.signedUrl
  }

  getPublicUrl(path: string): string {
    const { data } = supabaseStorageClient.storage
      .from(this.bucket)
      .getPublicUrl(path)
    return data.publicUrl
  }

  async delete(path: string): Promise<void> {
    const { error } = await supabaseStorageClient.storage.from(this.bucket).remove([path])
    if (error) throw new Error(`Storage delete failed: ${error.message}`)
  }
}
```

- [ ] **Step 3: Run quality gate**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/storage/types.ts src/lib/storage/supabase-adapter.ts
git commit -m "feat(storage): add getPublicUrl to StorageAdapter"
```

---

### Task 2: Profile schema and types

**Files:**
- Create: `src/features/profile/types.ts`
- Create: `src/features/profile/schemas/edit-profile.schema.ts`
- Create: `src/features/profile/schemas/index.ts`

- [ ] **Step 1: Create `types.ts`**

Create `src/features/profile/types.ts`:

```ts
export interface ProfileUser {
  name: string
  email: string
  image: string | null
}
```

- [ ] **Step 2: Create edit-profile schema**

Create `src/features/profile/schemas/edit-profile.schema.ts`:

```ts
import { z } from 'zod'

export const editProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64),
})

export type EditProfileInput = z.infer<typeof editProfileSchema>
```

- [ ] **Step 3: Create schema barrel**

Create `src/features/profile/schemas/index.ts`:

```ts
export { editProfileSchema, type EditProfileInput } from './edit-profile.schema'
```

- [ ] **Step 4: Run quality gate**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/profile/types.ts src/features/profile/schemas/
git commit -m "feat(profile): add profile types and schema"
```

---

### Task 3: Profile server actions

**Files:**
- Create: `src/features/profile/actions/profile.ts`
- Create: `src/features/profile/actions/index.ts`

- [ ] **Step 1: Create `profile.ts` action file**

Create `src/features/profile/actions/profile.ts`:

```ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { withAuthAction } from '@/lib/better-auth/middleware'
import { auth } from '@/lib/better-auth/server'
import { storageAdapter } from '@/lib/storage'
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES } from '@/lib/storage/constants'

export const uploadAvatar = withAuthAction(
  async ({ user }, formData: FormData): Promise<{ error?: string; url?: string }> => {
    const file = formData.get('file')
    if (!(file instanceof File)) return { error: 'No file provided' }
    if (file.size === 0) return { error: 'File is empty' }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: `File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit` }
    }

    const mime = file.type as keyof typeof ALLOWED_UPLOAD_MIME_TYPES
    if (!(file.type in ALLOWED_UPLOAD_MIME_TYPES)) return { error: 'Unsupported file type' }
    const ext = ALLOWED_UPLOAD_MIME_TYPES[mime]

    const path = `avatars/${user.id}/avatar.${ext}`

    // Delete the old avatar (ignore errors — it may not exist yet)
    await storageAdapter.delete(path).catch(() => undefined)

    try {
      await storageAdapter.upload(path, file, file.type)
      const url = storageAdapter.getPublicUrl(path)
      return { url }
    } catch {
      return { error: 'Failed to upload avatar' }
    }
  },
)

export const updateProfile = withAuthAction(
  async (_session, { name, image }: { name: string; image?: string }): Promise<{ error?: string }> => {
    try {
      await auth.api.updateUser({
        headers: await headers(),
        body: { name, ...(image !== undefined && { image }) },
      })
      revalidatePath('/', 'layout')
      return {}
    } catch {
      return { error: 'Failed to update profile' }
    }
  },
)
```

- [ ] **Step 2: Create action barrel**

Create `src/features/profile/actions/index.ts`:

```ts
export { uploadAvatar, updateProfile } from './profile'
```

- [ ] **Step 3: Run quality gate**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/profile/actions/
git commit -m "feat(profile): add uploadAvatar and updateProfile server actions"
```

---

### Task 4: AvatarUpload component

**Files:**
- Create: `src/features/profile/components/avatar-upload.tsx`

- [ ] **Step 1: Create component**

Create `src/features/profile/components/avatar-upload.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  currentUrl: string | null
  name: string
  onChange: (file: File) => void
  size?: number
}

export function AvatarUpload({ currentUrl, name, onChange, size = 80 }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const displayUrl = previewUrl ?? currentUrl
  const initial = name.charAt(0).toUpperCase() || '?'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    onChange(file)
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="group relative shrink-0 overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
      style={{ width: size, height: size }}
      aria-label="Change profile photo"
    >
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center bg-clay/20 font-extrabold text-clay',
          )}
          style={{ fontSize: size * 0.35 }}
        >
          {initial}
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <Camera size={size * 0.28} className="text-white" />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleChange}
        tabIndex={-1}
      />
    </button>
  )
}
```

- [ ] **Step 2: Run quality gate**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/components/avatar-upload.tsx
git commit -m "feat(profile): add AvatarUpload component"
```

---

### Task 5: ProfileSheet component

**Files:**
- Create: `src/features/profile/components/profile-sheet.tsx`

- [ ] **Step 1: Create component**

Create `src/features/profile/components/profile-sheet.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/shared/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { editProfileSchema, type EditProfileInput } from '../schemas'
import { uploadAvatar, updateProfile } from '../actions'
import { AvatarUpload } from './avatar-upload'
import type { ProfileUser } from '../types'

interface ProfileSheetProps {
  user: ProfileUser
  open: boolean
  onClose: () => void
}

export function ProfileSheet({ user, open, onClose }: ProfileSheetProps) {
  const router = useRouter()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { name: user.name },
  })

  const onSubmit = async (values: EditProfileInput) => {
    let imageUrl: string | undefined

    if (avatarFile) {
      const fd = new FormData()
      fd.append('file', avatarFile)
      const result = await uploadAvatar(fd)
      if (result.error) {
        toast.error(result.error)
        return
      }
      imageUrl = result.url
    }

    const result = await updateProfile({ name: values.name, image: imageUrl })
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Profile updated')
    router.refresh()
    setAvatarFile(null)
    reset({ name: values.name })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-5 py-5">
        {/* Avatar picker — centred above the fields */}
        <div className="flex justify-center">
          <AvatarUpload
            currentUrl={user.image}
            name={user.name}
            onChange={setAvatarFile}
            size={88}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name">Name</Label>
          <Input id="profile-name" placeholder="Your name" {...register('name')} />
          {errors.name && <p className="text-xs text-red">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Email</Label>
          <Input value={user.email} disabled className="opacity-50" readOnly />
          <p className="text-[11px] text-muted-foreground">Email cannot be changed.</p>
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full active:scale-[0.98]">
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </BottomSheet>
  )
}
```

- [ ] **Step 2: Run quality gate**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/components/profile-sheet.tsx
git commit -m "feat(profile): add ProfileSheet edit form"
```

---

### Task 6: ProfileScreen component

**Files:**
- Create: `src/features/profile/components/profile-screen.tsx`

- [ ] **Step 1: Create component**

Create `src/features/profile/components/profile-screen.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

  const handleSignOut = () => {
    signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })
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

      {/* Sign out */}
      <div className="mt-4 px-5 pb-4">
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
```

- [ ] **Step 2: Run quality gate**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/components/profile-screen.tsx
git commit -m "feat(profile): add ProfileScreen component"
```

---

### Task 7: Profile page route

**Files:**
- Create: `src/app/(app)/profile/page.tsx`

- [ ] **Step 1: Create page**

Create `src/app/(app)/profile/page.tsx`:

```tsx
import { requireSession } from '@/lib/better-auth/session'
import { ProfileScreen } from '@/features/profile/components/profile-screen'

export default async function ProfilePage() {
  const { user } = await requireSession()

  return (
    <ProfileScreen
      user={{
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      }}
    />
  )
}
```

- [ ] **Step 2: Run quality gate**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/profile/page.tsx
git commit -m "feat(profile): add /profile route"
```

---

### Task 8: Add Profile tab to AppShell + pass user from AppLayout

**Files:**
- Modify: `src/components/shared/app-shell.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Update `app-shell.tsx`**

Replace the entire contents of `src/components/shared/app-shell.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, LogOut, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/better-auth/client'
import { AppLogo } from './app-logo'

interface AppShellUser {
  name: string
  image: string | null
}

interface AppShellProps {
  children: React.ReactNode
  user: AppShellUser
}

function NavAvatar({ user, size }: { user: AppShellUser; size: number }) {
  const initial = user.name.charAt(0).toUpperCase()
  return (
    <div
      className="overflow-hidden rounded-full bg-clay/20"
      style={{ width: size, height: size }}
    >
      {user.image ? (
        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-extrabold text-clay"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {initial}
        </div>
      )}
    </div>
  )
}

const tabs = [
  { href: '/journal', label: 'Journal', icon: CalendarDays },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: null },
] as const

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = () => {
    signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop/tablet sidebar */}
      <nav className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center gap-1 border-r border-line bg-background py-5 md:flex">
        <AppLogo className="mb-6 h-9 w-9" />
        <div className="flex flex-1 flex-col items-center gap-1.5">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-semibold transition-colors',
                  active ? 'bg-clay/10 text-clay' : 'text-muted-foreground hover:bg-hair hover:text-foreground',
                )}
              >
                {Icon ? (
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                ) : (
                  <NavAvatar user={user} size={20} />
                )}
                {label}
              </Link>
            )
          })}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-hair hover:text-foreground"
        >
          <LogOut size={20} strokeWidth={1.8} />
          Sign out
        </button>
      </nav>

      <div className="flex min-h-screen flex-1 flex-col items-center md:pl-20">
        <main className="app-container flex-1">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 z-30 w-full shrink-0 border-t border-line bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex pb-safe">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                    active ? 'text-clay' : 'text-muted-foreground',
                  )}
                >
                  {Icon ? (
                    <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                  ) : (
                    <NavAvatar user={user} size={22} />
                  )}
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `layout.tsx` to pass user to AppShell**

Replace the entire contents of `src/app/(app)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireSession } from '@/lib/better-auth/session'
import { getQueryClient } from '@/lib/query-client'
import { accountsQueryOptions } from '@/features/accounts/utils'
import { AppShell } from '@/components/shared/app-shell'
import { OnboardingGate } from './onboarding-gate'
import { PrefetchController } from './prefetch-controller'
import { AccountSelectionSync } from './account-selection-sync'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession()
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(accountsQueryOptions())

  return (
    <AppShell user={{ name: user.name, image: user.image ?? null }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {children}
        <AccountSelectionSync />
        <OnboardingGate />
        <PrefetchController />
      </HydrationBoundary>
    </AppShell>
  )
}
```

- [ ] **Step 3: Run quality gate**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/app-shell.tsx src/app/(app)/layout.tsx
git commit -m "feat(profile): add Profile tab to nav with avatar, pass user from AppLayout"
```

---

### Task 9: Remove sign-out from AccountsScreen

The sign-out button now lives in `ProfileScreen`. Remove it from `AccountsScreen` to avoid duplication.

**Files:**
- Modify: `src/features/accounts/components/accounts-screen.tsx`

- [ ] **Step 1: Remove unused imports and sign-out section**

Replace the entire contents of `src/features/accounts/components/accounts-screen.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Archive, Plus } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { useSelectedAccountStore } from '../store/accounts.store'
import { useAccounts } from '../hooks/use-accounts'
import { groupTotalsByType } from '../utils'
import { AccountTypeTotals } from './account-type-totals'
import { AccountCard } from './account-card'
import { AccountSheet } from './account-sheet'
import { ArchivedAccountsSheet } from './archived-accounts-sheet'

export function AccountsScreen() {
  const { data: accounts = [] } = useAccounts()
  const [addOpen, setAddOpen] = useState(false)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccountStore()

  const typeTotals = groupTotalsByType(accounts)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-8">
        <div>
          <h1 className="text-xl font-extrabold">Accounts</h1>
          <p className="text-xs text-muted-foreground">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label="View archived accounts"
            onClick={() => setArchivedOpen(true)}
            className="grid h-[38px] w-[38px] place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-foreground active:scale-90"
          >
            <Archive size={16} />
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 rounded-xl bg-clay px-3 py-2 text-xs font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Per-type totals */}
      <AccountTypeTotals totals={typeTotals} />

      {/* Account list */}
      <div className="flex flex-col gap-3 px-5 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
        {accounts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground lg:col-span-2 xl:col-span-3">
            No accounts yet. Add one to get started.
          </div>
        ) : (
          accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              isSelected={acc.id === selectedAccountId}
              onSelect={() => setSelectedAccountId(acc.id)}
            />
          ))
        )}
      </div>

      <AccountSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <ArchivedAccountsSheet open={archivedOpen} onClose={() => setArchivedOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 2: Run quality gate**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/accounts/components/accounts-screen.tsx
git commit -m "feat(accounts): remove sign-out (moved to Profile screen)"
```

---

### Task 10: Visual verification checklist

- [ ] Navigate to `/profile` — see large avatar circle (initials if no image set), name, email, "Edit profile" button, Sign out button
- [ ] Tap "Edit profile" — `ProfileSheet` slides up with avatar picker + name field + disabled email
- [ ] Tap the avatar circle in the sheet — system file picker opens; selecting an image shows a preview
- [ ] Edit name + optionally pick an avatar → Save — toast "Profile updated", sheet closes, name/avatar update on screen
- [ ] Bottom nav shows 3 tabs: Journal | Accounts | Profile — Profile tab shows user's avatar (or initials)
- [ ] Desktop sidebar shows 3 nav links including Profile with avatar icon
- [ ] Accounts screen no longer has a sign-out button
- [ ] Uploading an avatar stores the image and shows it on next page load

> **Supabase prerequisite:** Before testing avatar upload, ensure the `pipfolio-uploads` bucket has **public read** enabled in the Supabase dashboard (Storage → Buckets → `pipfolio-uploads` → Edit → Public bucket: on). Without this, `getPublicUrl` returns a URL that yields 400.
