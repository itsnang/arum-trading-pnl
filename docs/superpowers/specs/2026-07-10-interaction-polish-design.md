# Interaction polish: quick-add FAB, toast feedback, press states

## Context

Aurum's Journal, Accounts, and day-dialog screens were already brought to pixel/behavior parity with the bundled prototype. This pass is scoped narrowly to interaction quality, not visual style: logging a trade currently requires navigating to Journal, finding the right calendar cell, and tapping it — there's no fast path from anywhere else in the app, and successful saves/deletes give no positive confirmation beyond the sheet closing.

Explicitly out of scope (considered and rejected during brainstorming): elevation/shadow system, typography scale rework, color-tint additions to calendar cells or a win/loss border-stripe on cards. The visuals stay exactly as they are today.

## Design

### 1. Onboarding gate (supersedes the original quick-add FAB)

**Revision note:** the FAB plan below was implemented and then dropped mid-build in favor of this — a zero-account user has no meaningful action to take from a FAB anyway (nothing to log against), so the real fix is gating the app until an account exists, not adding a shortcut around the gap.

**Problem:** a brand-new user with zero trading accounts previously saw a working-looking but functionally empty Journal/Accounts UI, with no clear prompt to create an account first.

**Solution:** `src/app/(app)/onboarding-gate.tsx` (`'use client'`) — reads `useAccounts()`; while `isPending` it renders nothing, and once resolved, if `accounts.length === 0` it renders a fixed, full-screen `bg-black/40 backdrop-blur-md` overlay with a centered card containing the account-creation form. The blurred backdrop lets the (non-interactive, `pointer-events` blocked by the overlay) Journal/Accounts UI stay visible underneath, communicating "your app is right here, you just need an account first." The overlay has no close button and no click-outside-to-dismiss — it clears itself automatically once `useAccounts()` refetches with a non-empty list after account creation.

Mounted in `src/app/(app)/layout.tsx` as `<AppShell>{children}<OnboardingGate /></AppShell>`.

**Form reuse:** the account-creation form was extracted from `add-account-sheet.tsx` into `src/features/accounts/components/add-account-form.tsx` (`AddAccountForm`, takes an optional `onSuccess`), since both the gate and the existing "Add account" bottom sheet need the identical fields/validation/submit logic. `AddAccountSheet` is now a thin wrapper: `<BottomSheet><AddAccountForm onSuccess={onClose} /></BottomSheet>`. The gate uses `AddAccountForm` with no `onSuccess` — it doesn't need to imperatively close itself, since it unmounts naturally once the accounts query reflects the new account.

### 2. Toast feedback

Error toasts already exist on save/delete failure (`toast.error(result.error)` in `quick-pnl-form.tsx`, `calc-form.tsx`, `trade-list.tsx`). Adding the missing success side, using the existing `sonner` `toast` import already present in each file:

- `quick-pnl-form.tsx` and `calc-form.tsx`: on successful save, `toast.success(`Trade logged · ${formatPnl(pnl, { showPlus: true })}`)`.
- `trade-list.tsx`: on successful delete, `toast.success('Trade deleted')`.

### 3. Press states

Tactile feedback via Tailwind `active:` scale utilities — no new colors, shadows, or sizes:

- FAB: `active:scale-95`
- Win/loss toggle buttons (`quick-pnl-form.tsx`), quick/calc mode tabs (`day-dialog.tsx`), the Log win/loss submit button, the Accounts "Add" button, the trade-item delete (×) button: `active:scale-[0.98]`

All transitions use `transition-transform` already available via existing `transition-colors` patterns in these files (adding `transform` to the existing transition list where one is already present, or a plain `transition-transform` where none exists yet).

## Non-goals

- No shadow/elevation system, no typography scale changes, no new color usage beyond what already exists in the app (explicitly rejected during brainstorming in favor of a narrower interaction-only pass).
- No loading-state/skeleton work.
- No page-transition or sheet-transition changes — the existing `framer-motion` spring transition on `BottomSheet` is untouched.

## Testing

- `npx tsc --noEmit`, `npm run lint`, `npm run build` as the standard quality gate (per CLAUDE.md — no test runner configured).
- Manual Playwright smoke test (performed): registered a fresh zero-account user, confirmed the onboarding gate renders blurred/blocking on Journal, created an account through the gate's form, confirmed the gate closes and the account appears; then opened the day-dialog via a calendar tap, logged a trade, and confirmed the success toast, calendar/hero update, and press-state styling all work.
