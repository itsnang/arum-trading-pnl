'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/journal', label: 'Journal', icon: CalendarDays },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="app-container flex min-h-screen flex-col bg-background">
      <main className="flex-1">{children}</main>
      <nav className="sticky bottom-0 z-30 shrink-0 border-t border-line bg-background/95 backdrop-blur-sm">
        <div className="flex pb-safe">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  active ? 'text-clay' : 'text-muted-foreground',
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
