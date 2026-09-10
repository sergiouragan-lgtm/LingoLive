import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { colors, radius, zindex } from './index';

const bridge = readFileSync(resolve(process.cwd(), 'packages/design-system/tailwind.css'), 'utf8').toLowerCase();

describe('Tailwind token bridge', () => {
  it.each([
    ['brand primary', colors.brand.primary],
    ['brand secondary', colors.brand.secondary],
    ['success', colors.semantic.success],
    ['warning', colors.semantic.warning],
    ['error', colors.semantic.error],
    ['info', colors.semantic.info],
    ['small radius', radius.sm],
    ['medium radius', radius.md],
    ['large radius', radius.lg],
    ['modal layer', String(zindex.modal)],
  ])('keeps the %s token synchronized', (_name, value) => {
    expect(bridge).toContain(String(value).toLowerCase());
  });
});
