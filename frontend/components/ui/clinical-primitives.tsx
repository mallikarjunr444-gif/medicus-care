import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-[#0058b0] text-white shadow-[0_8px_18px_-10px_rgba(15,98,87,.8)] hover:-translate-y-0.5 hover:bg-[#0058b0] focus-visible:ring-[#c7c7cc]',
  secondary: 'border border-[#d2d2d7] bg-white text-[#6e6e73] shadow-sm hover:-translate-y-0.5 hover:border-[#c7c7cc] hover:bg-[#f5f5f7] focus-visible:ring-[#c7c7cc]',
  quiet: 'bg-transparent text-[#6e6e73] hover:bg-[#f5f5f7] focus-visible:ring-[#c7c7cc]',
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

export function ClinicalCard({ className, ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn('rounded-2xl border border-[#d2d2d7] bg-white/95 shadow-[0_8px_30px_-18px_rgba(15,76,61,.38)] backdrop-blur-sm', className)}
      {...props}
    />
  )
}

export function ClinicalBadge({ className, ...props }: Readonly<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-semibold text-[#6e6e73]', className)}
      {...props}
    />
  )
}
