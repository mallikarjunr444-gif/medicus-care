"use client";

import { VoiceOrb } from "@/components/ui/voice-orb";
import {
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

export function VoiceOrbPreview() {
  const activity = useMotionValue(0);
  const reducedMotion = useReducedMotion();
  useAnimationFrame((time) => {
    if (reducedMotion) {
      activity.set(0);
      return;
    }
    // Simulated syllables and pauses demonstrate activity without opening audio.
    const t = time / 1000;
    const phrase = Math.max(0, Math.sin(t * 0.85));
    const syllable = Math.max(0, Math.sin(t * 9.3 + Math.sin(t * 2.1)));
    activity.set(phrase * (0.12 + syllable ** 2 * 0.72));
  });
  return (
    <div className="flex w-full h-screen items-center justify-center">
      <VoiceOrb
        activity={activity}
        aria-label="Voice visualization"
        className="w-64 sm:w-72"
      />
    </div>
  );
}

export default VoiceOrbPreview;
