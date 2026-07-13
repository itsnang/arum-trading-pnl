'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type PasswordFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  autoComplete: 'current-password' | 'new-password'
}

export function PasswordField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  autoComplete,
}: PasswordFieldProps<TFieldValues>) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            {label}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={visible ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete={autoComplete}
                className="h-11 rounded-xl text-sm pl-9 pr-10"
                {...field}
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity hover:opacity-70"
              >
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}
