import { AppLogo } from '@/components/shared/app-logo'

export function AppLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <AppLogo className="h-16 w-16 animate-pulse shadow-lg shadow-clay/30" />
    </div>
  )
}
