/**
 * LingoLIVE AI Design System - Breakpoint Tokens
 */

export const breakpoints = {
  // Mobile, Tablet, Small Desktop, Large Desktop sizes
  widths: {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536,
  },

  // Media query helper strings (min-width queries)
  queries: {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
    xxl: '(min-width: 1536px)',
  }
} as const;

export type BreakpointTokens = typeof breakpoints;
