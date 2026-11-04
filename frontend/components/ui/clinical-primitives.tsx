import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-[#14685d] text-white shadow-sm hover:bg-[#0f594f] focus-visible:ring-[#9dd1c2]',
  secondary: 'border border-[#dce7e1] bg-white text-[#28453e] hover:bg-[#f5f9f6] focus-visible:ring-[#b7d4c7]',
  quiet: 'bg-transparent text-[#45615a] hover:bg-[#edf4ef] focus-visible:ring-[#b7d4c7]',
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
      className={cn('rounded-2xl border border-[#e1e9e4] bg-white shadow-[0_4px_18px_rgba(27,65,52,.045)]', className)}
      {...props}
    />
  )
}

export function ClinicalBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border border-[#dce9e1] bg-[#f2f8f4] px-2.5 py-1 text-[11px] font-semibold text-[#286153]', className)}
      {...props}
    />
  )
}
