import * as React from 'react'
import { cn } from '@/lib/utils'

/** Accessible form label, styled for the light MediCare design system. */
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'mb-1.5 block text-sm font-medium text-[#36564d]',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  ),
)
Label.displayName = 'Label'

export { Label }
