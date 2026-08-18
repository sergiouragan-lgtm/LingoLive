/**
 * LingoLIVE AI Design System - Elevation & Shadow Tokens
 */

export const elevation = {
  // Standard shadows for light theme interfaces
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    xl2: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // Premium glow effects for dark mode widgets and buttons
  glows: {
    brand: '0 0 15px 1px rgba(139, 92, 246, 0.15)',
    brandIntense: '0 0 20px 4px rgba(139, 92, 246, 0.3)',
    success: '0 0 12px 1px rgba(16, 185, 129, 0.15)',
    warning: '0 0 12px 1px rgba(245, 158, 11, 0.15)',
    error: '0 0 12px 1px rgba(239, 68, 68, 0.15)',
  }
} as const;

export type ElevationTokens = typeof elevation;
