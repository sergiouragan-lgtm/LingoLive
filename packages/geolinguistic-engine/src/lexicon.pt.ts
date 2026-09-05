import type { RegionalExpression } from './index';

// Small seed only. Production growth must use reviewed, versioned data with provenance.
export const PORTUGUESE_REGIONAL_EXPRESSIONS: RegionalExpression[] = [
  { expression: 'bué', language: 'pt', variants: ['pt-AO', 'pt-PT'], regions: ['Angola', 'Portugal'], meaning: 'muito; em grande quantidade', standardEquivalent: 'muito', register: 'slang', contexts: ['conversation'] },
  { expression: 'fixe', language: 'pt', variants: ['pt-PT', 'pt-AO'], regions: ['Portugal', 'Angola'], meaning: 'bom; agradável; interessante', standardEquivalent: 'bom', register: 'informal', contexts: ['conversation'] },
  { expression: 'legal', language: 'pt', variants: ['pt-BR'], regions: ['Brasil'], meaning: 'bom; agradável; interessante', standardEquivalent: 'bom', register: 'informal', contexts: ['conversation'] }
];
