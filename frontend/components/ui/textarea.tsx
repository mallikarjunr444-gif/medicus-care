import * as React from 'react'
import { cn } from '@/lib/utils'

/** MediCare multiline text field; matches the light `Input` styling. */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[96px] w-full rounded-xl border border-[#dfe8e2] bg-white px-3.5 py-2.5 text-sm text-[#183331]',
          'shadow-[0_1px_2px_rgba(24,51,49,.04)] transition-colors duration-150',
          'placeholder:text-[#9aa8a2]',
          'focus-visible:border-[#0f7565] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0f7565]/10',
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
