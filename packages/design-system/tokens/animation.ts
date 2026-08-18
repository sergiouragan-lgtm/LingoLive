/**
 * LingoLIVE AI Design System - Animation & Transition Tokens
 */

export const animation = {
  // Duration tokens
  durations: {
    instant: '0ms',
    fast: '150ms', // hover, active states
    normal: '250ms', // standard content fades, expansions
    slow: '400ms', // large modal transitions, page transitions
    verySlow: '700ms', // complex illustration timelines
  },

  // Easing curves
  easings: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Elegant spring/bounce back curves
    pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // Full CSS transition shorthands
  transitions: {
    hover: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    card: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms ease-out',
    fade: 'opacity 200ms linear',
  }
} as const;

export type AnimationTokens = typeof animation;
