'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/better-auth/client'
import { loginSchema, type LoginInput } from '../schemas'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/shared/password-field'
import { AppLogo } from '@/components/shared/app-logo'

export function LoginScreen() {
  const router = useRouter()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: LoginInput) => {
    const { error } = await signIn.email(values)
    if (error) {
      toast.error(error.message ?? 'Invalid email or password')
      return
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <AppLogo className="w-15.5 h-15.5 mb-5 shadow-lg shadow-clay/30" />
      <div className="w-full max-w-sm rounded-xl border border-line bg-card px-7 py-8 shadow-lg">
        <h1 className="text-[28px] leading-tight mb-1 text-foreground">
          Welcome back
        </h1>
        <p className="text-sm mb-7 text-muted-foreground">
          Sign in to your gold trading journal.
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
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="h-11 rounded-xl pl-9 text-sm"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <PasswordField
              control={form.control}
              name="password"
              label="Password"
              autoComplete="current-password"
            />

            <div className="flex justify-end -mt-2">
              <Link
                href="/forgot-password"
                className="text-xs text-primary transition-opacity hover:opacity-70"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-lg text-sm font-semibold tracking-wide active:scale-[0.98] mt-2"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Sign in
            </Button>
          </form>
        </Form>
      </div>

      <p className="text-sm mt-6 text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-primary transition-opacity hover:opacity-70"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
