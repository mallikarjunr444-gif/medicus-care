import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-[#4f6580] text-white shadow-sm hover:bg-[#4f6580] focus-visible:ring-[#4f6580]',
  secondary: 'border border-[#dce6f2] bg-white text-[#4f6580] hover:bg-[#f4f8fd] focus-visible:ring-[#dce6f2]',
  quiet: 'bg-transparent text-[#4f6580] hover:bg-[#eef4fc] focus-visible:ring-[#dce6f2]',
  danger: 'bg-[#a83d36] text-white hover:bg-[#92332d] focus-visible:ring-[#efb9b4]',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 rounded-lg px-3 text-xs',
  md: 'min-h-11 rounded-xl px-4 text-sm',
  lg: 'min-h-12 rounded-xl px-5 text-sm',
}

export function ClinicalButton({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function ClinicalCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-[#dce6f2] bg-white shadow-[0_4px_18px_rgba(27,65,52,.045)]', className)}
      {...props}
    />
  )
}

export function ClinicalBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border border-[#eef4fc] bg-[#eef4fc] px-2.5 py-1 text-[11px] font-semibold text-[#4f6580]', className)}
      {...props}
    />
  )
}
