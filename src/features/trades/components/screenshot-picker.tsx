'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFile } from '@/lib/storage/actions'
import { cn } from '@/lib/utils'

interface ScreenshotPickerProps {
  onChange: (path: string | undefined) => void
}

// Uploads immediately on file select, before the trade form is submitted —
// the form only ever carries the resulting storage path, never a File.
// A picked-then-abandoned file is left orphaned in storage; acceptable for
// this scope (no cleanup job), same tradeoff every unsent-attachment flow makes.
export function ScreenshotPicker({ onChange }: ScreenshotPickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await uploadFile(formData)
    setUploading(false)
    if (res.error || !res.path || !res.url) {
      toast.error(res.error ?? 'Failed to upload screenshot')
      return
    }
    setPreviewUrl(res.url)
    onChange(res.path)
  }

  const handleRemove = () => {
    setPreviewUrl(undefined)
    onChange(undefined)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
      {previewUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, query-string token expires in 1h; not a candidate for next/image optimization/caching */}
          <img src={previewUrl} alt="Trade screenshot" className="h-32 w-full rounded-xl object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground shadow"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3',
            'text-xs font-medium text-muted-foreground transition active:scale-[0.98] disabled:opacity-50',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <ImagePlus size={14} /> Add screenshot
            </>
          )}
        </button>
      )}
    </div>
  )
}
