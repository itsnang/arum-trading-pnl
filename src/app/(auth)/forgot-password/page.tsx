import type { Metadata } from 'next'
import { ForgotPasswordScreen } from '@/features/auth/components/forgot-password-screen'

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Reset your account password.',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />
}
