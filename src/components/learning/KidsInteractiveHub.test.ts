import { describe, expect, it } from 'vitest';
import { scoreKidsPronunciation } from './KidsInteractiveHub';

describe('scoreKidsPronunciation', () => {
  it('awards stars from recognized evidence rather than random success', () => {
    expect(scoreKidsPronunciation('Maçã', 'maca')).toBe(3);
    expect(scoreKidsPronunciation('eu disse apple hoje', 'apple')).toBe(2);
    expect(scoreKidsPronunciation('banana', 'rocket')).toBe(1);
    expect(scoreKidsPronunciation('', 'sun')).toBe(0);
  });
});
