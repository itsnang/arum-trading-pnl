# Profile Image Crop — Design Spec

**Date:** 2026-07-21
**Feature:** Client-side image crop before avatar upload

---

## Overview

When a user changes their profile picture, a crop sheet opens immediately after file selection. The user positions and zooms a 1:1 (square) crop box over their image, then confirms. The cropped square is uploaded; the app masks it as a circle everywhere it appears. No server or DB changes are required.

---

## User Flow

1. User opens ProfileSheet and taps the avatar.
2. Device file picker opens (existing behavior — JPEG/PNG/WebP, max 5 MB).
3. After a file is selected, `ImageCropSheet` opens as a bottom sheet on top of ProfileSheet.
4. `react-easy-crop` renders the raw image with a 1:1 crop box and a circular overlay mask.
5. User pans, pinches/zooms, and repositions the crop box freely. The box stays square.
6. User taps **"Use photo"**: `getCroppedBlob()` extracts the crop region via canvas → produces a `File`.
7. `ImageCropSheet` closes and passes the cropped `File` back to ProfileSheet.
8. ProfileSheet shows the cropped preview in the avatar picker (existing blob-URL preview).
9. User taps **Save** → existing `uploadAvatar` + `updateProfile` actions run unchanged.
10. Tapping **Cancel** in the crop sheet discards the selection; file picker can be re-opened.

---

## Architecture

### New files

**`src/lib/image/crop.ts`**
- Export: `getCroppedBlob(imageSrc: string, croppedAreaPixels: Area): Promise<File>`
- Draws source image onto an `HTMLCanvasElement` at the cropped coordinates.
- Returns `canvas.toBlob()` as a `File` with `type: 'image/jpeg'` and name `avatar.jpg`.
- Pure utility — no React, no state.

**`src/features/profile/components/image-crop-sheet.tsx`**
- Props: `imageSrc: string | null`, `open: boolean`, `onClose: () => void`, `onCrop: (file: File) => void`
- Uses `react-easy-crop` with `aspect={1}`, `cropShape="rect"` (square box), circular overlay via `showGrid={false}` and custom CSS mask.
- Local state: `crop`, `zoom`, `croppedAreaPixels` (all from react-easy-crop callbacks).
- Zoom slider: `<input type="range">` from 1–3x for users who cannot pinch.
- **"Use photo"** button: calls `getCroppedBlob()` then `onCrop(file)` then `onClose()`.
- **"Cancel"** button: calls `onClose()` with no side effects.

### Modified files

**`src/features/profile/components/avatar-upload.tsx`**
- Rename `onChange` prop to `onFilePicked` to clarify it fires before cropping.
- On file input change: call `onFilePicked(file)` instead of `onChange(file)`. Remove the blob preview creation from this component — preview is now driven by the cropped file returned from `ImageCropSheet`.

**`src/features/profile/components/profile-sheet.tsx`**
- Add state: `rawImageSrc: string | null` (blob URL of the raw picked file), `cropOpen: boolean`.
- `onFilePicked(file)`: create blob URL → set `rawImageSrc` → set `cropOpen = true`.
- `onCrop(croppedFile)`: set `avatarFile = croppedFile`, create preview blob URL for `AvatarUpload`, revoke `rawImageSrc` blob URL.
- Render `<ImageCropSheet imageSrc={rawImageSrc} open={cropOpen} onClose={...} onCrop={onCrop} />`.
- Rest of submit flow unchanged.

---

## Dependencies

- **`react-easy-crop`** — install via `npm install react-easy-crop`. ~15 KB. Handles touch gestures natively.

---

## Constraints

- Crop output is always JPEG (`image/jpeg`) regardless of input format — simplifies MIME handling and reduces file size.
- Output size: `canvas` renders at the pixel dimensions of the cropped area (natural image pixels), capped by the source image resolution. No upscaling.
- Blob URLs created for raw image preview are revoked after `onCrop` resolves to prevent memory leaks.
- No changes to server actions, storage adapter, DB schema, or URL validation logic.

---

## Error handling

- If `getCroppedBlob()` throws (canvas security error on cross-origin image — not applicable here since source is a local blob URL): show `toast.error('Failed to crop image')` and close the crop sheet without setting a file.
- File size of cropped output is not re-validated client-side (original was already under 5 MB; a crop is always smaller). Server action still enforces the 5 MB limit as a safety net.
