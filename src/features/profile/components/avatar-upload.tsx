'use client'

import { useRef } from 'react'
import { Camera } from 'lucide-react'

interface AvatarUploadProps {
  currentUrl: string | null
  name: string
  onFilePicked: (file: File) => void
  previewUrl?: string | null
  size?: number
}

export function AvatarUpload({
  currentUrl,
  name,
  onFilePicked,
  previewUrl,
  size = 80,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const displayUrl = previewUrl ?? currentUrl
  const initial = name.charAt(0).toUpperCase() || '?'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so selecting the same file again triggers onChange
    e.target.value = ''
    onFilePicked(file)
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="group relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
      style={{ width: size, height: size }}
      aria-label="Change profile photo"
    >
      <div className="h-full w-full overflow-hidden rounded-full">
        {displayUrl ? (
          <img src={displayUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-clay/20 font-extrabold text-clay"
            style={{ fontSize: size * 0.35 }}
          >
            {initial}
          </div>
        )}
      </div>
      <div
        className="absolute flex items-center justify-center rounded-full bg-clay shadow-sm"
        style={{ width: size * 0.3, height: size * 0.3, right: 0, bottom: 0 }}
      >
        <Camera size={size * 0.14} className="text-white" strokeWidth={2.5} />
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
