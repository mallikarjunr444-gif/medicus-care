import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Soft animated aurora / mesh background in the MediCare botanical register
 * (mint, sky and white). Sits behind content; add to a `relative isolate`
 * section and it will render at `-z-10`.
 */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      <div
        className="animate-medicare-aurora absolute -right-[10%] -top-[18%] h-[34rem] w-[34rem] rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #bce9d6 0%, transparent 70%)',
          filter: 'blur(70px)',
          animationDuration: '20s',
        }}
      />
      <div
        className="animate-medicare-aurora absolute -bottom-[22%] left-[16%] h-[28rem] w-[28rem] rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #a9d9ee 0%, transparent 70%)',
          filter: 'blur(70px)',
          animationDuration: '24s',
          animationDelay: '-8s',
        }}
      />
      <div
        className="animate-medicare-aurora absolute right-[28%] top-[32%] h-[22rem] w-[22rem] rounded-full opacity-45"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #eaf6ee 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDuration: '18s',
          animationDelay: '-14s',
        }}
      />
    </div>
  )
}
