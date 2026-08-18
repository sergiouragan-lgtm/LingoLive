/**
 * LingoLIVE AI Design System - Icon Tokens
 */

export const icons = {
  // Standard sizes used across LingoLIVE AI interfaces
  sizes: {
    xs: 12,    // Inline tags, micro badges
    sm: 16,    // Button labels, sidebar navigation, list metadata
    md: 20,    // Standalone action buttons, section headings, cards
    lg: 24,    // Primary headers, center illustration features
    xl: 32,    // Page highlights, success/error banners
    xxl: 48,   // Empty state icons
  },

  // Color assignments matching our palette design rules
  colors: {
    primary: '#8B5CF6',
    secondary: '#64748B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    inactive: '#334155',
  }
} as const;

export type IconTokens = typeof icons;
