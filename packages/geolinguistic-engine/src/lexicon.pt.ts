import type { RegionalExpression } from './index';

// Seed lexicon. Keep entries reviewable and data-driven; do not use it to infer user identity.
export const PORTUGUESE_REGIONAL_EXPRESSIONS: RegionalExpression[] = [
  { expression: 'bué', language: 'pt', variants: ['pt-AO', 'pt-PT'], regions: ['Angola', 'Portugal'], meaning: 'muito; em grande quantidade', standardEquivalent: 'muito', register: 'slang', contexts: ['conversation'] },
  { expression: 'fixe', language: 'pt', variants: ['pt-PT', 'pt-AO'], regions: ['Portugal', 'Angola'], meaning: 'bom; agradável; interessante', standardEquivalent: 'bom', register: 'informal', contexts: ['conversation'] },
  { expression: 'legal', language: 'pt', variants: ['pt-BR'], regions: ['Brasil'], meaning: 'bom; agradável; interessante', standardEquivalent: 'bom', register: 'informal', contexts: ['conversation'] },
];
