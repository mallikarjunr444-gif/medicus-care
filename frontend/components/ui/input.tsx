import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * MediCare text input. Light "botanical" register to match the landing and
 * clinical primitives: white field, hairline border, green focus ring.
 * Drop-in replacement for the `.input-field` CSS class.
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2 text-sm text-[#1d1d1f]',
          'shadow-[0_1px_2px_rgba(24,51,49,.04)] transition-colors duration-150',
          'placeholder:text-[#86868b]',
          'focus-visible:border-[#0058b0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0058b0]/10',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
