'use client'

import { useEffect, useState } from 'react'

export interface UseWordCarouselOptions {
  words: string[]
  /** Milliseconds each word stays on screen. */
  interval?: number
}

/** Cycles through a list of words. Holds on the first word for reduced-motion users. */
export function useWordCarousel({ words, interval = 2400 }: UseWordCarouselOptions) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length < 2) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval)
    return () => window.clearInterval(id)
  }, [words.length, interval])

  return { currentWord: words[index] ?? '', key: index, index }
}
