import { useId } from 'react'
import { cn } from '@/lib/utils'

interface AppLogoProps {
  className?: string
}

/** Pipfolio brand mark: an ascending bar chart, used on the login/register screens. */
export function AppLogo({ className }: AppLogoProps) {
  const gradientId = useId()

  return (
    <div
      className={cn('flex items-center justify-center rounded-lg border', className)}
      style={{
        background: 'radial-gradient(120% 120% at 30% 20%, #221C15 0%, #0C0B09 70%)',
        borderColor: '#332F27',
      }}
    >
      <svg viewBox="0 0 80 80" fill="none" className="h-full w-full p-3">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#C25E3A" />
            <stop offset="1" stopColor="#F0C86E" />
          </linearGradient>
        </defs>
        <rect x="14" y="40" width="13" height="24" rx="3" fill="#D06B45" opacity="0.5" />
        <rect x="33" y="28" width="13" height="36" rx="3" fill="#D06B45" opacity="0.75" />
        <rect x="52" y="14" width="13" height="50" rx="3" fill={`url(#${gradientId})`} />
        <path
          d="M12 52 L58 20 L58 30 L68 14"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
