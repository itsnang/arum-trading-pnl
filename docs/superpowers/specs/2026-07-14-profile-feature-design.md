# Profile Feature — Design Spec

**Date:** 2026-07-14  
**Scope:** New `src/features/profile/` slice, nav changes, storage adapter extension.

---

## Goal

Add a Profile tab (3rd tab) that shows the logged-in user's name and avatar, and lets them edit their name and upload an avatar image stored in Supabase Storage.

---

## Data Model

No new DB columns needed. The `user` table already has:
- `name text NOT NULL` — displayed and editable
- `image text` — stores the public avatar URL; currently always `null`

Updates go through better-auth's `auth.api.updateUser({ headers, body: { name, image } })`.

---

## Avatar Storage

- **Bucket:** `pipfolio-uploads` (already exists)
- **Path:** `avatars/{userId}/avatar.{ext}` with `upsert: true` to replace the old avatar on re-upload
- **URL type:** Public URL (`getPublicUrl`) — permanent, no expiry. Requires the `pipfolio-uploads` bucket to have public read enabled in the Supabase dashboard.
- **StorageAdapter extension:** Add `getPublicUrl(path: string): string` to the `StorageAdapter` interface and `SupabaseStorageAdapter`. Supabase's `getPublicUrl` is synchronous — no DB round trip, just URL construction.

---

## Architecture

### Feature slice: `src/features/profile/`

```
src/features/profile/
  actions/
    index.ts          ← barrel re-export only
    profile.ts        ← 'use server'; updateProfile + uploadAvatar actions
  components/
    profile-screen.tsx
    profile-sheet.tsx ← edit name + avatar form (bottom sheet)
    avatar-upload.tsx ← file input with preview circle
  schemas/
    index.ts
    edit-profile.schema.ts
  types.ts
```

### Pages & routing

- `src/app/(app)/profile/page.tsx` — Server Component; calls `requireSession()`, passes `user` to `ProfileScreen`

### Nav changes: `src/components/shared/app-shell.tsx`

- Accept `user: { name: string; image: string | null }` prop (passed from `AppLayout`)
- Add Profile tab (`href: '/profile'`) to both mobile bottom nav and desktop sidebar
- Tab icon: `<Avatar>` — circular, 22px on mobile / 20px on desktop — showing avatar image or initials fallback
- `AppLayout` (`src/app/(app)/layout.tsx`) passes `{ name, email, image }` from `requireSession()` to `AppShell`

---

## Components

### `ProfileScreen`

Props: `user: { id: string; name: string; email: string; image: string | null }`

Layout (mobile-first):
1. Header row: title "Profile", `ThemeToggle`
2. Avatar circle (80px) — image if set, else initials — tap to open edit sheet
3. Name (bold) + email (muted) below avatar
4. "Edit profile" button → opens `ProfileSheet`
5. Separator
6. Sign-out button (moved here from `AccountsScreen`)

The sign-out button is removed from `AccountsScreen` (it belongs on a profile/settings screen, not an account list).

### `ProfileSheet`

A `BottomSheet` wrapping a React Hook Form form.

Fields:
- Avatar: `AvatarUpload` component (file picker, circular preview)
- Name: text input

On submit:
1. If a new file was picked: call `uploadAvatar(formData)` server action → get public URL
2. Call `updateProfile({ name, image })` server action
3. On success: `router.refresh()` to re-render server components with fresh session data; close sheet

### `AvatarUpload`

Props: `currentUrl: string | null; name: string; onChange: (file: File) => void`

- Hidden `<input type="file" accept="image/*">` triggered by clicking the circle
- Circle shows: preview of selected file (local object URL) → existing `currentUrl` → initials fallback
- No upload happens at this stage — file is held in form state until submit

### Edit profile schema (`edit-profile.schema.ts`)

```ts
z.object({
  name: z.string().min(1, 'Name is required').max(64),
})
```

Avatar is outside Zod (it's a `File | null` held directly in form state, not serialisable).

---

## Server Actions (`profile.ts`)

### `uploadAvatar(formData: FormData)`

Wrapped in `withAuthAction`. Uses the existing `storageAdapter`:
1. Extract `file` from FormData; validate size + MIME (reuse `ALLOWED_UPLOAD_MIME_TYPES` / `MAX_UPLOAD_BYTES`)
2. `path = avatars/${user.id}/avatar.${ext}`
3. `storageAdapter.delete(path)` — ignore errors (file may not exist yet)
4. `storageAdapter.upload(path, file, contentType)`
5. `storageAdapter.getPublicUrl(path)` → return `{ url }`
6. Returns `{ error?: string; url?: string }`

### `updateProfile({ name, image }: { name: string; image?: string })`

Wrapped in `withAuthAction`. Calls:
```ts
await auth.api.updateUser({
  headers: await headers(),
  body: { name, ...(image !== undefined && { image }) },
})
```
Returns `{ error?: string }`.

---

## StorageAdapter changes

Add to `StorageAdapter` interface (`src/lib/storage/types.ts`):
```ts
getPublicUrl(path: string): string
```

Add to `SupabaseStorageAdapter` (`src/lib/storage/supabase-adapter.ts`):
```ts
getPublicUrl(path: string): string {
  const { data } = supabaseStorageClient.storage
    .from(this.bucket)
    .getPublicUrl(path)
  return data.publicUrl
}
```

> **Supabase dashboard prerequisite:** Set `pipfolio-uploads` bucket to **public** (Storage → Buckets → Edit). Without this, public URLs return 400.

---

## `AppShell` prop change

```ts
// Before
AppShell({ children })

// After
AppShell({ children, user }: { children: ReactNode; user: { name: string; image: string | null } })
```

`AppLayout` passes `{ name: session.user.name, image: session.user.image }`.

---

## Files changed / created

| Action | Path |
|--------|------|
| Modify | `src/lib/storage/types.ts` |
| Modify | `src/lib/storage/supabase-adapter.ts` |
| Modify | `src/components/shared/app-shell.tsx` |
| Modify | `src/app/(app)/layout.tsx` |
| Create | `src/app/(app)/profile/page.tsx` |
| Create | `src/features/profile/actions/index.ts` |
| Create | `src/features/profile/actions/profile.ts` |
| Create | `src/features/profile/schemas/index.ts` |
| Create | `src/features/profile/schemas/edit-profile.schema.ts` |
| Create | `src/features/profile/components/avatar-upload.tsx` |
| Create | `src/features/profile/components/profile-sheet.tsx` |
| Create | `src/features/profile/components/profile-screen.tsx` |
| Create | `src/features/profile/types.ts` |
| Modify | `src/features/accounts/components/accounts-screen.tsx` — remove sign-out button |

---

## Out of scope

- Email change (requires better-auth email verification flow)
- Password change
- Account deletion
- Avatar cropping
