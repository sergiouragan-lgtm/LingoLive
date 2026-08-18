/**
 * LingoLIVE AI Design System - Color Tokens
 */

export const colors = {
  // Brand colors
  brand: {
    primary: '#8B5CF6', // Violet 500
    primaryLight: '#A78BFA', // Violet 400
    primaryDark: '#7C3AED', // Violet 600
    primaryGlow: 'rgba(139, 92, 246, 0.15)',
    secondary: '#6366F1', // Indigo 500
    secondaryLight: '#818CF8', // Indigo 400
    secondaryDark: '#4F46E5', // Indigo 600
  },

  // Neutral slate palette (Optimized for dark mode and premium light contrasts)
  neutral: {
    black: '#020617', // Slate 950
    darkest: '#0B0F19', // Deep dark
    dark: '#0F172A', // Slate 900
    card: '#1E293B', // Slate 800
    border: '#334155', // Slate 700
    muted: '#64748B', // Slate 500
    gray: '#94A3B8', // Slate 400
    lightGray: '#CBD5E1', // Slate 300
    light: '#F8FAFC', // Slate 50
    white: '#FFFFFF',
  },

  // Semantic feedback colors
  semantic: {
    success: '#10B981', // Emerald 500
    successLight: '#34D399', // Emerald 400
    successGlow: 'rgba(16, 185, 129, 0.1)',
    
    warning: '#F59E0B', // Amber 500
    warningLight: '#FBBF24', // Amber 400
    warningGlow: 'rgba(245, 158, 11, 0.1)',
    
    error: '#EF4444', // Rose 500
    errorLight: '#F87171', // Rose 400
    errorGlow: 'rgba(239, 68, 68, 0.1)',
    
    info: '#3B82F6', // Blue 500
    infoLight: '#60A5FA', // Blue 400
    infoGlow: 'rgba(59, 130, 246, 0.1)',
  },

  // Premium LingoLIVE AI Accents
  accents: {
    gold: '#F59E0B',
    silver: '#E2E8F0',
    bronze: '#CD7F32',
    platinum: '#E2E8F0',
    cyber: '#06B6D4', // Cyan 500
  }
} as const;

export type ColorTokens = typeof colors;
