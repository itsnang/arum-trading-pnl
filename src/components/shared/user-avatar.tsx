import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name: string
  image: string | null
  size: number
  className?: string
}

export function UserAvatar({ name, image, size, className }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div
      className={cn('overflow-hidden rounded-full bg-clay/20', className)}
      style={{ width: size, height: size }}
    >
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-extrabold text-clay"
          style={{ fontSize: Math.round(size * 0.38) }}
        >
          {initial}
        </div>
      )}
    </div>
  )
}
