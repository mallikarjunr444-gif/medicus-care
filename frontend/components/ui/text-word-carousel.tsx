'use client'

import * as React from 'react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'
import { useWordCarousel, type UseWordCarouselOptions } from '@/components/ui/text-word-carousel-utils/use-word-carousel'

export interface TextWordCarouselProps extends Omit<HTMLMotionProps<'span'>, 'children'>, UseWordCarouselOptions {
  duration?: number
}

/** A line of text whose last word changes. The words slide and blur through each other. */
export function TextWordCarousel({ words, interval, className, duration = 0.45, ...props }: TextWordCarouselProps) {
  const { currentWord, key } = useWordCarousel({ words, interval })
  return (
    <span className={cn('relative inline-block', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={key}
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
          transition={{ duration, ease: [0.28, 0.11, 0.32, 1] }}
          className="inline-block"
          {...props}
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export default TextWordCarousel
