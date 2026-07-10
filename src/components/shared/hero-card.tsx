import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HeroCardProps {
  label: string
  value: ReactNode
  trailing: ReactNode
  className?: string
}

/** Fixed dark "spotlight" card with a clay radial glow — stays dark in both themes. */
export function HeroCard({ label, value, trailing, className }: HeroCardProps) {
  return (
    <div
      className={cn(
        'relative mx-5 mb-4 overflow-hidden rounded-xl bg-hero-bg px-5 py-5 text-hero-fg',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(194,94,58,0.65), transparent 70%)',
        }}
      />
      <div className="relative flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-60">{label}</p>
          {value}
        </div>
        <div className="flex flex-col items-end gap-0.5 pb-0.5">{trailing}</div>
      </div>
    </div>
  )
}
