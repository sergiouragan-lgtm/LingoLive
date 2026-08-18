/**
 * LingoLIVE AI Design System - Spacing Tokens
 * Base-4 scale for rhythm, layout padding, and gaps.
 */

export const spacing = {
  // Numeric values in pixels
  px: {
    xs2: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xl2: 24,
    xl3: 32,
    xl4: 40,
    xl5: 48,
    xl6: 64,
    xl7: 80,
    xl8: 96,
  },

  // Rem string values (assuming base 16px font-size)
  rem: {
    xs2: '0.125rem', // 2px
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    xl2: '1.5rem',   // 24px
    xl3: '2rem',     // 32px
    xl4: '2.5rem',   // 40px
    xl5: '3rem',     // 48px
    xl6: '4rem',     // 64px
    xl7: '5rem',     // 80px
    xl8: '6rem',     // 96px
  },

  // Aliases for layout-specific needs
  layout: {
    gutter: '1.5rem',       // 24px
    sectionGap: '3rem',     // 48px
    containerMax: '80rem',  // 1280px
  }
} as const;

export type SpacingTokens = typeof spacing;
