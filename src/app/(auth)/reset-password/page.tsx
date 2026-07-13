import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ResetPasswordScreen } from '@/features/auth/components/reset-password-screen'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new account password.',
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  )
}
