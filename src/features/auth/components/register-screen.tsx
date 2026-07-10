'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/better-auth/client'
import { registerSchema, type RegisterInput } from '../schemas'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordField } from '@/components/shared/password-field'

export function RegisterScreen() {
  const router = useRouter()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: RegisterInput) => {
    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    })
    if (error) {
      toast.error(error.message ?? 'Unable to create account')
      return
    }
    router.push('/')
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card px-7 py-8 shadow-lg">
        <h1 className="text-[28px] leading-tight mb-1 text-foreground">
          Create account
        </h1>
        <p className="text-sm mb-7 text-muted-foreground">
          Backed by Postgres + better-auth
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    Full name
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Jane Doe"
                      autoComplete="name"
                      className="h-11 rounded-xl text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

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

            <PasswordField
              control={form.control}
              name="password"
              label="Password"
              autoComplete="new-password"
            />

            <PasswordField
              control={form.control}
              name="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Create account
            </button>
          </form>
        </Form>
      </div>

      <p className="text-sm mt-6 text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary transition-opacity hover:opacity-70"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
