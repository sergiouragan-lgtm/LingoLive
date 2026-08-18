
import { describe, it, expect } from 'vitest';
import {
  normalizeLanguageName,
  normalizeTargetLanguages,
  setPrimaryTargetLanguage,
  addTargetLanguage,
  removeTargetLanguage,
  clearPrimaryTargetLanguage
} from './targetLanguagesPolicy';

describe('targetLanguagesPolicy', () => {
  describe('normalizeLanguageName', () => {
    it('normalizes valid strings', () => {
      expect(normalizeLanguageName(' French ')).toBe('French');
      expect(normalizeLanguageName('Português')).toBe('Português');
    });
    it('returns null for invalid inputs', () => {
      expect(normalizeLanguageName('   ')).toBe(null);
      expect(normalizeLanguageName('')).toBe(null);
      expect(normalizeLanguageName(null)).toBe(null);
      expect(normalizeLanguageName(undefined)).toBe(null);
      expect(normalizeLanguageName(123)).toBe(null);
    });
  });

  describe('normalizeTargetLanguages', () => {
    it('deduplicates and handles primary correctly', () => {
      const state = normalizeTargetLanguages({
        primaryLanguage: 'French',
        targetLanguages: ['English', 'French', 'German', 'french', 'FRENCH']
      });
      expect(state.primaryLanguage).toBe('French');
      expect(state.targetLanguages).toEqual(['French', 'English', 'German']);
    });
  });

  describe('setPrimaryTargetLanguage', () => {
    it('sets primary and preserves others', () => {
      const state = normalizeTargetLanguages({
        primaryLanguage: 'English',
        targetLanguages: ['English', 'French', 'German']
      });
      const next = setPrimaryTargetLanguage(state, 'French');
      expect(next.primaryLanguage).toBe('French');
      expect(next.targetLanguages).toEqual(['French', 'English', 'German']);
    });
  });

  describe('addTargetLanguage', () => {
    it('adds language to end', () => {
      const state = normalizeTargetLanguages({
        primaryLanguage: 'English',
        targetLanguages: ['English']
      });
      const next = addTargetLanguage(state, 'German');
      expect(next.targetLanguages).toEqual(['English', 'German']);
    });
  });

  describe('removeTargetLanguage', () => {
    it('removes secondary', () => {
      const state = normalizeTargetLanguages({
        primaryLanguage: 'English',
        targetLanguages: ['English', 'French', 'German']
      });
      const next = removeTargetLanguage(state, 'French');
      expect(next.targetLanguages).toEqual(['English', 'German']);
      expect(next.primaryLanguage).toBe('English');
    });

    it('removes primary and selects new', () => {
      const state = normalizeTargetLanguages({
        primaryLanguage: 'French',
        targetLanguages: ['French', 'English', 'German']
      });
      const next = removeTargetLanguage(state, 'French');
      expect(next.targetLanguages).toEqual(['English', 'German']);
      expect(next.primaryLanguage).toBe('English');
    });
  });

  describe('clearPrimaryTargetLanguage', () => {
    it('clears primary and preserves list', () => {
      const state = normalizeTargetLanguages({
        primaryLanguage: 'French',
        targetLanguages: ['French', 'English']
      });
      const next = clearPrimaryTargetLanguage(state);
      expect(next.primaryLanguage).toBe(null);
      expect(next.targetLanguages).toEqual(['French', 'English']);
    });
  });
});
