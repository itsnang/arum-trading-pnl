'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/shared/bottom-sheet'
import { Button } from '@/components/ui/button'
import { getCroppedBlob } from '@/lib/image/crop'

interface ImageCropSheetProps {
  imageSrc: string | null
  open: boolean
  onClose: () => void
  onCrop: (file: File) => void
}

export function ImageCropSheet({ imageSrc, open, onClose, onCrop }: ImageCropSheetProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsCropping(true)
    try {
      const file = await getCroppedBlob(imageSrc, croppedAreaPixels)
      onCrop(file)
      onClose()
    } catch {
      toast.error('Failed to crop image')
    } finally {
      setIsCropping(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Crop Photo">
      <div className="flex flex-col gap-4 px-5 py-5">
        {/* Crop canvas — fixed height so react-easy-crop can measure it */}
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { borderRadius: '0.75rem' },
                cropAreaStyle: { borderRadius: '50%', border: '2px solid rgba(194,94,58,0.8)' },
              }}
            />
          )}
        </div>

        {/* Zoom slider */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-hair accent-clay"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isCropping}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 active:scale-[0.98]"
            onClick={handleConfirm}
            disabled={isCropping}
          >
            {isCropping ? 'Cropping…' : 'Use photo'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
