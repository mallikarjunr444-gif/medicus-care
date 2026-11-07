import Image from 'next/image'

interface BrandLogoProps {
  className: string
  priority?: boolean
}

/** Crops the supplied wordmark's generous transparent canvas into a compact header logo. */
export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden ${className}`}>
      <Image
        src="/logo.png"
        alt="Medicus Care"
        fill
        sizes="(max-width: 640px) 132px, 160px"
        className="object-cover object-center"
        priority={priority}
      />
    </span>
  )
}
