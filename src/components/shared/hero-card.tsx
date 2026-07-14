import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HeroCardProps {
  label: string
  value: ReactNode
  trailing?: ReactNode
  /** Smaller padding/glow and a stacked (not side-by-side) layout, for use
   *  in a grid of cards rather than as the single full-bleed page hero. */
  compact?: boolean
  className?: string
}

/** Fixed dark "spotlight" card with a clay radial glow — stays dark in both themes. */
export function HeroCard({ label, value, trailing, compact, className }: HeroCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-hero-bg text-hero-fg',
        compact ? 'px-4 py-4' : 'mx-5 mb-4 px-5 py-5',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute rounded-full',
          compact ? '-right-6 -top-8 h-24 w-24' : '-right-10 -top-12 h-44 w-44',
        )}
        style={{
          background: 'radial-gradient(circle, rgba(194,94,58,0.65), transparent 70%)',
        }}
      />
      <div
        className={cn(
          'relative',
          compact ? 'flex flex-col gap-1' : 'flex items-end justify-between gap-3',
        )}
      >
        <div className="flex flex-col gap-1">
          <p
            className={cn(
              'font-bold uppercase tracking-[0.12em] opacity-60',
              compact ? 'text-[10px]' : 'text-[11px]',
            )}
          >
            {label}
          </p>
          {value}
        </div>
        {trailing && (
          <div className={compact ? undefined : 'flex flex-col items-end gap-0.5 pb-0.5'}>
            {trailing}
          </div>
        )}
      </div>
    </div>
  )
}
