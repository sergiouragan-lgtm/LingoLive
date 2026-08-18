/**
 * LingoLIVE AI Design System - Typography Tokens
 */

export const typography = {
  // Font Families
  fonts: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
    display: 'Space Grotesk, Outfit, sans-serif',
  },

  // Font Sizes (Rem and Px)
  sizes: {
    xs: { rem: '0.75rem', px: 12 },
    sm: { rem: '0.875rem', px: 14 },
    base: { rem: '1rem', px: 16 },
    lg: { rem: '1.125rem', px: 18 },
    xl: { rem: '1.25rem', px: 20 },
    xl2: { rem: '1.5rem', px: 24 },
    xl3: { rem: '1.875rem', px: 30 },
    xl4: { rem: '2.25rem', px: 36 },
    xl5: { rem: '3rem', px: 48 },
    xl6: { rem: '3.75rem', px: 60 },
  },

  // Font Weights
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line Heights
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacings
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  }
} as const;

export type TypographyTokens = typeof typography;
