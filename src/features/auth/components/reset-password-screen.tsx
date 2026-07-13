'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resetPassword } from '@/lib/better-auth/client'
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/shared/password-field'
import { AppLogo } from '@/components/shared/app-logo'

export function ResetPasswordScreen() {
  const router = useRouter()
  const token = useSearchParams().get('token')

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const { isSubmitting } = form.formState

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <AppLogo className="w-15.5 h-15.5 mb-5 shadow-lg shadow-clay/30" />
        <div className="w-full max-w-sm rounded-xl border border-line bg-card px-7 py-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red/10">
            <AlertCircle size={26} className="text-red" />
          </div>
          <h1 className="text-[28px] leading-tight mb-1 text-foreground">
            Invalid link
          </h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <p className="text-sm mt-6 text-muted-foreground">
          <Link href="/forgot-password" className="text-primary transition-opacity hover:opacity-70">
            Request a new link
          </Link>
        </p>
      </div>
    )
  }

  const onSubmit = async (values: ResetPasswordInput) => {
    const { error } = await resetPassword({ newPassword: values.newPassword, token })
    if (error) {
      toast.error(error.message ?? 'Unable to reset password')
      return
    }
    toast.success('Password updated — sign in with your new password')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <AppLogo className="w-15.5 h-15.5 mb-5 shadow-lg shadow-clay/30" />
      <div className="w-full max-w-sm rounded-xl border border-line bg-card px-7 py-8 shadow-lg">
        <h1 className="text-[28px] leading-tight mb-1 text-foreground">
          Reset password
        </h1>
        <p className="text-sm mb-7 text-muted-foreground">
          Choose a new password for your account.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <PasswordField
              control={form.control}
              name="newPassword"
              label="New password"
              autoComplete="new-password"
            />

            <PasswordField
              control={form.control}
              name="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-lg text-sm font-semibold tracking-wide active:scale-[0.98] mt-2"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Update password
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
