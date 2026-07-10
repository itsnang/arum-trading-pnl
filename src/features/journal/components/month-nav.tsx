import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthLabel } from '@/lib/format'

interface MonthNavProps {
  month: string
  onPrev: () => void
  onNext: () => void
}

export function MonthNav({ month, onPrev, onNext }: MonthNavProps) {
  return (
    <div className="flex items-center justify-between px-5 py-2">
      <button
        type="button"
        onClick={onPrev}
        className="rounded-full p-1.5 text-muted-foreground hover:bg-hair"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-semibold">{formatMonthLabel(month)}</span>
      <button
        type="button"
        onClick={onNext}
        className="rounded-full p-1.5 text-muted-foreground hover:bg-hair"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
