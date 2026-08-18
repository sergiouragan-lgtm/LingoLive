/**
 * LingoLIVE AI Design System - Z-Index Layer Tokens
 * Establishes absolute depth hierarchy standards.
 */

export const zindex = {
  deep: -10,
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  drawer: 400,
  modal: 500,
  popover: 600,
  toast: 900,
  tooltip: 1000,
} as const;

export type ZIndexTokens = typeof zindex;
