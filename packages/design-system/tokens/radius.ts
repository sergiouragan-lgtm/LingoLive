/**
 * LingoLIVE AI Design System - Border Radius Tokens
 */

export const radius = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  xl2: '20px',
  xl3: '24px', // Standard for cards in our UI (rounded-3xl style)
  xl4: '32px',
  full: '9999px',
} as const;

export type RadiusTokens = typeof radius;
