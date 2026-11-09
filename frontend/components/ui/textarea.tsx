import * as React from 'react'
import { cn } from '@/lib/utils'

/** MediCare multiline text field; matches the light `Input` styling. */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[96px] w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-sm text-[#1d1d1f]',
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
Textarea.displayName = 'Textarea'

export { Textarea }
