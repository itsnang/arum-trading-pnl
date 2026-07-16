'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

const PAD = 8
const MAX_RETRIES = 20 // ~1.6 s

export interface TourStep {
  target: string
  title: string
  body: string
  tipPosition: 'below' | 'above'
}

interface TourTooltipProps {
  steps: TourStep[]
  storageKey: string
}

interface Rect { top: number; left: number; width: number; height: number }

function getRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

export function TourTooltip({ steps, storageKey }: TourTooltipProps) {
  // SSR guard — must be before createPortal
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const maskId = useId()
  const [step, setStep] = useState<number | null>(null)
  const [rect, setRect] = useState<Rect | null>(null)

  // Stable ref so measure/advance/dismiss don't recreate when steps array identity changes
  const stepsRef = useRef(steps)
  useEffect(() => { stepsRef.current = steps })

  const measure = useCallback((s: number) => {
    const target = stepsRef.current[s]?.target
    if (!target) return
    let tries = 0
    let cancelled = false
    let timerId: ReturnType<typeof setTimeout>
    const attempt = () => {
      if (cancelled) return
      const r = getRect(target)
      if (r) { setRect(r); return }
      if (++tries < MAX_RETRIES) timerId = setTimeout(attempt, 80)
    }
    attempt()
    return () => { cancelled = true; clearTimeout(timerId) }
  }, [])

  useEffect(() => {
    if (localStorage.getItem(storageKey)) return
    const t = setTimeout(() => { setStep(0); measure(0) }, 600)
    return () => clearTimeout(t)
  }, [storageKey, measure])

  // Refresh rect on resize / orientation change so the spotlight stays aligned
  useEffect(() => {
    if (step === null) return
    const refresh = () => {
      const target = stepsRef.current[step]?.target
      if (target) { const r = getRect(target); if (r) setRect(r) }
    }
    window.addEventListener('resize', refresh)
    window.addEventListener('orientationchange', refresh)
    return () => {
      window.removeEventListener('resize', refresh)
      window.removeEventListener('orientationchange', refresh)
    }
  }, [step])

  const dismiss = useCallback(() => {
    localStorage.setItem(storageKey, '1')
    setStep(null)
    setRect(null)
  }, [storageKey])

  const advance = useCallback(() => {
    setStep((prev) => {
      const next = (prev ?? 0) + 1
      if (next >= stepsRef.current.length) return prev // dismiss handles this
      measure(next)
      return next
    })
  }, [measure])

  const handleAdvance = useCallback(() => {
    const next = (step ?? 0) + 1
    if (next >= stepsRef.current.length) {
      dismiss()
    } else {
      advance()
    }
  }, [step, advance, dismiss])

  const currentStep = step !== null ? stepsRef.current[step] : null
  const isLast = currentStep !== null && step === stepsRef.current.length - 1

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {currentStep && rect && (
        <>
          {/* Dark overlay with spotlight cutout */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            onClick={handleAdvance}
          >
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id={maskId}>
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={rect.left - PAD}
                    y={rect.top - PAD}
                    width={rect.width + PAD * 2}
                    height={rect.height + PAD * 2}
                    rx={10}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask={`url(#${maskId})`} />
            </svg>
          </motion.div>

          {/* Spotlight ring */}
          <motion.div
            key="ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed z-50 rounded-[10px] ring-2 ring-clay"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
            }}
          />

          {/* Tooltip bubble */}
          <motion.div
            key={`tip-${step}`}
            initial={{ opacity: 0, y: currentStep.tipPosition === 'below' ? -6 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed z-50 w-64"
            style={
              currentStep.tipPosition === 'below'
                ? { top: rect.top + rect.height + PAD + 14, left: Math.min(Math.max(rect.left, 12), window.innerWidth - 272) }
                : { bottom: window.innerHeight - rect.top + PAD + 14, left: Math.min(Math.max(rect.left, 12), window.innerWidth - 272) }
            }
          >
            {currentStep.tipPosition === 'below' && (
              <div className="ml-4 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-card" />
            )}
            <div className="rounded-xl bg-card p-4 shadow-xl ring-1 ring-line">
              <div className="mb-3 flex items-center gap-1.5">
                {stepsRef.current.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? 'w-4 bg-clay' : 'w-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm font-bold">{currentStep.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{currentStep.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); dismiss() }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAdvance() }}
                  className="rounded-lg bg-clay px-3 py-1.5 text-xs font-semibold text-white active:scale-95"
                >
                  {isLast ? 'Done' : 'Next →'}
                </button>
              </div>
            </div>
            {currentStep.tipPosition === 'above' && (
              <div className="ml-4 h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-card" />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
