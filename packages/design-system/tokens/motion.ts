/**
 * LingoLIVE AI Design System - Motion Tokens (Framer Motion / Motion)
 * Reusable configurations for elegant transitions, springs, and fades.
 */

export const motion = {
  // Spring presets for bouncy, snappy, or smooth movements
  springs: {
    snappy: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
    bouncy: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
    gentle: {
      type: 'spring',
      stiffness: 150,
      damping: 20,
    },
  },

  // Transition properties
  transitions: {
    fade: {
      duration: 0.2,
      ease: 'linear',
    },
    slide: {
      type: 'spring',
      stiffness: 180,
      damping: 22,
    },
  },

  // Animation Variant Blueprints
  variants: {
    fadeInUp: {
      hidden: { opacity: 0, y: 15 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
      exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: 'easeIn' } }
    },
    fadeInScale: {
      hidden: { opacity: 0, scale: 0.96 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
      exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: 'easeIn' } }
    }
  }
} as const;

export type MotionTokens = typeof motion;
