'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react'

const STEPS = [
  { kicker: 'Choose', title: 'Pick your language.', body: 'Kannada, Hindi or English, and the doctor you would like to talk to.' },
  { kicker: 'Talk', title: 'Say what is wrong.', body: 'Speak or type. The doctor replies out loud, with subtitles, and asks what it needs to know.' },
  { kicker: 'Leave', title: 'Take a clear next step.', body: 'Get a short summary and guidance on whether to rest, see a clinician, or go to hospital.' },
]

function Screen({ step }: { step: number }) {
  return (
    <div className="relative mx-auto w-[270px] sm:w-[310px]">
      <div className="absolute -inset-8 -z-10 rounded-[72px] bg-[#2997ff]/25 blur-3xl" aria-hidden="true" />
      <div className="rounded-[56px] bg-gradient-to-br from-[#e4e7f7] via-[#b4badf] to-[#8d93bb] p-[3px] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)]">
        <div className="rounded-[53px] bg-black p-[7px]">
          <div className="relative h-[470px] overflow-hidden rounded-[46px] bg-black sm:h-[530px]">
            <div className="absolute left-1/2 top-3 z-30 flex h-[30px] w-[104px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3 ring-1 ring-white/[0.06]" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#0d1020] ring-1 ring-[#2a3358]" />
            </div>
            <div className="absolute inset-x-0 bottom-2 z-20 mx-auto h-1 w-28 rounded-full bg-white/70" aria-hidden="true" />
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className="absolute inset-0 px-5 pt-[68px]"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4, ease: [0.28, 0.11, 0.32, 1] }}
              >
                {step === 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">Language</p>
                    {['ಕನ್ನಡ  Kannada', 'हिन्दी  Hindi', 'English'].map((l, i) => (
                      <motion.div
                        key={l}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.12 }}
                        className={`mt-3 flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] ${i === 0 ? 'bg-[#0071e3] font-semibold text-white' : 'bg-[#1c1c1e] text-[#f5f5f7]'}`}
                      >
                        {l}
                        {i === 0 && <span aria-hidden="true">✓</span>}
                      </motion.div>
                    ))}
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">Dr. Ananya</p>
                    <motion.p initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="ml-auto w-fit max-w-[88%] rounded-[18px] rounded-br-md bg-[#0071e3] px-4 py-2.5 text-[14px] text-white">
                      I have had a fever and a headache since yesterday.
                    </motion.p>
                    <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="w-fit max-w-[90%] rounded-[18px] rounded-bl-md bg-[#2c2c2e] px-4 py-2.5 text-[14px] text-[#f5f5f7]">
                      I am sorry you are unwell. How high has the fever been?
                    </motion.p>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">Summary</p>
                    <div className="mt-4 rounded-2xl bg-[#1c1c1e] p-4">
                      <p className="text-[15px] font-semibold text-white">Rest and fluids</p>
                      <p className="mt-1 text-[13px] leading-[1.5] text-[#a1a1a6]">See a clinician if the fever lasts more than three days or you feel worse. For breathing trouble or chest pain, call 112.</p>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-4 flex items-center justify-center rounded-full bg-[#0071e3] py-3 text-[14px] font-semibold text-white">
                      Save summary
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Pinned, scroll-driven walkthrough: the phone stays put while the three steps change beside it. */
export function ScrollStory() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length * 0.999))))
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })

  return (
    <section ref={ref} id="how-it-works" aria-label="How it works" className="relative h-[320vh] scroll-mt-12 bg-black text-[#f5f5f7]">
      <div className="sticky top-12 flex h-[calc(100dvh-3rem)] items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <motion.div className="absolute left-[8%] top-[10%] h-[440px] w-[440px] rounded-full blur-[120px]" animate={{ backgroundColor: ['#0071e3', '#7a5cff', '#30b8d5'][step], opacity: 0.35 }} transition={{ duration: 0.9 }} />
        </div>
        <div className="relative mx-auto grid w-full max-w-[1080px] items-center gap-4 px-5 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="mb-3 text-[15px] font-semibold text-[#2997ff]">Three steps. About five minutes.</p>
            <div className="relative min-h-[170px] sm:min-h-[210px]">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.title}
                  className="absolute inset-x-0 top-0"
                  initial={false}
                  animate={{ opacity: step === i ? 1 : 0, y: step === i ? 0 : step > i ? -28 : 28 }}
                  transition={{ duration: 0.5, ease: [0.28, 0.11, 0.32, 1] }}
                  aria-hidden={step !== i}
                >
                  <h2 className="text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[52px]">{s.title}</h2>
                  <p className="mt-4 max-w-[440px] text-[17px] leading-[1.5] text-[#a1a1a6] sm:text-[19px]">{s.body}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3" aria-hidden="true">
              {STEPS.map((s, i) => (
                <span key={s.title} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-10 bg-[#2997ff]' : 'w-1.5 bg-[#3a3a3c]'}`} />
              ))}
            </div>
          </div>
          <div className="order-1 h-[340px] sm:h-[480px] lg:order-2 lg:h-auto">
            <div className="origin-top scale-[0.64] sm:scale-90 lg:scale-100">
              <Screen step={step} />
            </div>
          </div>
        </div>
        <motion.div className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-[#2997ff]" style={{ scaleX: bar }} aria-hidden="true" />
      </div>
    </section>
  )
}
