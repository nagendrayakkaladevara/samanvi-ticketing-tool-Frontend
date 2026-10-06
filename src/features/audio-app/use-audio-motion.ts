import { useReducedMotion, type MotionProps, type Transition } from 'motion/react'

// Short, non-bouncing transitions keep an operational workspace responsive.
export function useAudioMotion() {
  const reducedMotion = useReducedMotion()
  const transition: Transition = {
    duration: reducedMotion ? 0 : 0.24,
    ease: [0.22, 1, 0.36, 1],
  }

  function reveal(index = 0): MotionProps {
    return {
      initial: reducedMotion ? false : { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: reducedMotion ? 0 : -4, transition: { duration: reducedMotion ? 0 : 0.12 } },
      transition: { ...transition, delay: reducedMotion ? 0 : Math.min(index, 5) * 0.035 },
    }
  }

  return { reducedMotion, transition, reveal }
}
