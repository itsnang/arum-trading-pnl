'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/better-auth/client'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { AppLogo } from '@/components/shared/app-logo'

export function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: ForgotPasswordInput) => {
    // better-auth returns success even for unknown emails (anti-enumeration),
    // so the UI shows the same "check your email" state regardless of `error`.
    await requestPasswordReset({ email: values.email, redirectTo: '/reset-password' })
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <AppLogo className="w-15.5 h-15.5 mb-5 shadow-lg shadow-clay/30" />
        <div className="w-full max-w-sm rounded-xl bg-card px-7 py-8 shadow-lg text-center">
          <h1 className="text-[28px] leading-tight mb-1 text-foreground">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, we&apos;ve sent a link to reset your password.
          </p>
        </div>
        <p className="text-sm mt-6 text-muted-foreground">
          <Link href="/login" className="text-primary transition-opacity hover:opacity-70">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <AppLogo className="w-15.5 h-15.5 mb-5 shadow-lg shadow-clay/30" />
      <div className="w-full max-w-sm rounded-xl bg-card px-7 py-8 shadow-lg">
        <h1 className="text-[28px] leading-tight mb-1 text-foreground">
          Forgot password
        </h1>
        <p className="text-sm mb-7 text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-11 rounded-xl text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-lg text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Send reset link
            </button>
          </form>
        </Form>
      </div>

      <p className="text-sm mt-6 text-muted-foreground">
        <Link href="/login" className="text-primary transition-opacity hover:opacity-70">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
