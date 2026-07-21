'use client'

import { useEffect, useRef, useState } from 'react'
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
import { ImageCropSheet } from './image-crop-sheet'
import type { ProfileUser } from '../types'

interface ProfileSheetProps {
  user: ProfileUser
  open: boolean
  onClose: () => void
  onUpdated?: (name: string, image?: string) => void
}

export function ProfileSheet({ user, open, onClose, onUpdated }: ProfileSheetProps) {
  const router = useRouter()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)

  // Keep refs for blob URLs so we can revoke on cleanup
  const rawBlobRef = useRef<string | null>(null)
  const croppedBlobRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (rawBlobRef.current) URL.revokeObjectURL(rawBlobRef.current)
      if (croppedBlobRef.current) URL.revokeObjectURL(croppedBlobRef.current)
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { name: user.name },
  })

  useEffect(() => {
    reset({ name: user.name })
  }, [user.name, reset])

  const handleFilePicked = (file: File) => {
    if (rawBlobRef.current) URL.revokeObjectURL(rawBlobRef.current)
    const url = URL.createObjectURL(file)
    rawBlobRef.current = url
    setRawImageSrc(url)
    setCropOpen(true)
  }

  const handleCrop = (croppedFile: File) => {
    if (croppedBlobRef.current) URL.revokeObjectURL(croppedBlobRef.current)
    const url = URL.createObjectURL(croppedFile)
    croppedBlobRef.current = url
    setCroppedPreviewUrl(url)
    setAvatarFile(croppedFile)
  }

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

    const result = await updateProfile(
      imageUrl !== undefined
        ? { name: values.name, image: imageUrl }
        : { name: values.name },
    )
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Profile updated')
    onUpdated?.(values.name, imageUrl)
    router.refresh()
    setAvatarFile(null)
    setCroppedPreviewUrl(null)
    reset({ name: values.name })
    onClose()
  }

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="Edit Profile">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-5 py-5">
          <div className="flex justify-center">
            <AvatarUpload
              currentUrl={user.image}
              name={user.name}
              onFilePicked={handleFilePicked}
              previewUrl={croppedPreviewUrl}
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

      <ImageCropSheet
        imageSrc={rawImageSrc}
        open={cropOpen}
        onClose={() => setCropOpen(false)}
        onCrop={handleCrop}
      />
    </>
  )
}
