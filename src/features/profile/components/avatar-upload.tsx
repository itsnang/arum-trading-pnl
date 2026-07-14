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
