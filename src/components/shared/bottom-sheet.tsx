'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  // Same sheet, two presentations: slides up from the bottom edge on
  // mobile, but on tablet/desktop there's no "bottom edge" worth anchoring
  // to, so it becomes a centered dialog instead.
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.96, x: '-50%', y: '-50%' } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.96, x: '-50%', y: '-50%' } : { y: '100%' }}
            transition={
              isDesktop ? { duration: 0.15 } : { type: 'spring', damping: 30, stiffness: 300 }
            }
            className={cn(
              'fixed z-50 mx-auto max-w-107.5 bg-background pb-safe',
              'bottom-0 left-0 right-0 rounded-t-xl',
              'md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:w-full md:max-w-120 md:rounded-xl',
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-muted-foreground hover:bg-hair"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
