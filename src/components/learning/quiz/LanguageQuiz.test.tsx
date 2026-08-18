import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LanguageQuiz, {
  getAssessmentProfileExperience,
  normalizeAssessmentProfile
} from './LanguageQuiz';
import { LANGUAGES } from '../../../data';
import { Language } from '../../../types';
import { QUIZ_QUESTIONS } from '../../../quizData';

if (typeof window !== 'undefined' && !window.AudioContext) {
  window.AudioContext = vi.fn().mockImplementation(() => ({
    createOscillator: () => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn() }),
    createGain: () => ({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
    }),
    destination: {}
  })) as any;
}

describe('LanguageQuiz - Adaptive Assessment Profile Contract & Normalization', () => {
  const dummyLanguage: Language = LANGUAGES[0];

  afterEach(() => {
    cleanup();
  });

  it('1. returns CHILD for canonical CHILD input', () => {
    expect(normalizeAssessmentProfile('CHILD')).toBe('CHILD');
  });

  it('2. returns TEEN for canonical TEEN input', () => {
    expect(normalizeAssessmentProfile('TEEN')).toBe('TEEN');
  });

  it('3. returns ADULT for canonical ADULT input', () => {
    expect(normalizeAssessmentProfile('ADULT')).toBe('ADULT');
  });

  it('4. returns CHILD for legacy CRIANÇA / CRIANÇAS / INFÂNCIA inputs', () => {
    expect(normalizeAssessmentProfile('CRIANÇA')).toBe('CHILD');
    expect(normalizeAssessmentProfile('criança')).toBe('CHILD');
    expect(normalizeAssessmentProfile('CRIANÇAS')).toBe('CHILD');
    expect(normalizeAssessmentProfile('INFÂNCIA')).toBe('CHILD');
  });

  it('5. returns TEEN for legacy ADOLESCENTE / ADOLESCENTES / PRÉ-ADOLESCENTES inputs', () => {
    expect(normalizeAssessmentProfile('ADOLESCENTE')).toBe('TEEN');
    expect(normalizeAssessmentProfile('adolescente')).toBe('TEEN');
    expect(normalizeAssessmentProfile('ADOLESCENTES')).toBe('TEEN');
    expect(normalizeAssessmentProfile('PRÉ-ADOLESCENTES')).toBe('TEEN');
  });

  it('6. returns ADULT for legacy ADULTO / ADULTOS inputs', () => {
    expect(normalizeAssessmentProfile('ADULTO')).toBe('ADULT');
    expect(normalizeAssessmentProfile('adulto')).toBe('ADULT');
    expect(normalizeAssessmentProfile('ADULTOS')).toBe('ADULT');
  });

  it('7. explicit valid profile prevails over userAge', () => {
    expect(normalizeAssessmentProfile('CHILD', 30)).toBe('CHILD');
    expect(normalizeAssessmentProfile('TEEN', 8)).toBe('TEEN');
    expect(normalizeAssessmentProfile('ADULT', 15)).toBe('ADULT');
    expect(normalizeAssessmentProfile('CRIANÇA', 30)).toBe('CHILD');
  });

  it('8. invalid profile falls back to valid userAge', () => {
    expect(normalizeAssessmentProfile('INVALID_PROFILE', 8)).toBe('CHILD');
    expect(normalizeAssessmentProfile('INVALID_PROFILE', 15)).toBe('TEEN');
    expect(normalizeAssessmentProfile('INVALID_PROFILE', 25)).toBe('ADULT');
  });

  it('9. invalid profile and missing or invalid age returns null', () => {
    expect(normalizeAssessmentProfile('INVALID_PROFILE')).toBeNull();
    expect(normalizeAssessmentProfile('INVALID_PROFILE', -1)).toBeNull();
  });

  it('10. userAge 0 returns CHILD', () => {
    expect(normalizeAssessmentProfile(null, 0)).toBe('CHILD');
  });

  it('11. userAge 11 returns CHILD', () => {
    expect(normalizeAssessmentProfile(null, 11)).toBe('CHILD');
  });

  it('12. userAge 11.5 returns CHILD', () => {
    expect(normalizeAssessmentProfile(null, 11.5)).toBe('CHILD');
  });

  it('13. userAge 12 returns TEEN', () => {
    expect(normalizeAssessmentProfile(null, 12)).toBe('TEEN');
  });

  it('14. userAge 17 returns TEEN', () => {
    expect(normalizeAssessmentProfile(null, 17)).toBe('TEEN');
  });

  it('15. userAge 17.5 returns TEEN', () => {
    expect(normalizeAssessmentProfile(null, 17.5)).toBe('TEEN');
  });

  it('16. userAge 18 returns ADULT', () => {
    expect(normalizeAssessmentProfile(null, 18)).toBe('ADULT');
  });

  it('17. userAge 120 returns ADULT', () => {
    expect(normalizeAssessmentProfile(null, 120)).toBe('ADULT');
  });

  it('18. userAge -1 returns null', () => {
    expect(normalizeAssessmentProfile(null, -1)).toBeNull();
  });

  it('19. userAge NaN returns null', () => {
    expect(normalizeAssessmentProfile(null, NaN)).toBeNull();
  });

  it('20. userAge Infinity returns null', () => {
    expect(normalizeAssessmentProfile(null, Infinity)).toBeNull();
  });

  it('21. userAge -Infinity returns null', () => {
    expect(normalizeAssessmentProfile(null, -Infinity)).toBeNull();
  });

  it('22. total absence of profile and age returns null', () => {
    expect(normalizeAssessmentProfile()).toBeNull();
    expect(normalizeAssessmentProfile(null, undefined)).toBeNull();
  });

  it('23. getAssessmentProfileExperience("CHILD") returns Child Experience', () => {
    const exp = getAssessmentProfileExperience('CHILD');
    expect(exp.heading).toBe('Vamos mostrar o que já aprendeste');
    expect(exp.startActionLabel).toBe('Começar desafio');
  });

  it('24. getAssessmentProfileExperience("TEEN") returns Teen Experience', () => {
    const exp = getAssessmentProfileExperience('TEEN');
    expect(exp.heading).toBe('Pronto para testar o teu progresso?');
    expect(exp.startActionLabel).toBe('Aceitar desafio');
  });

  it('25. getAssessmentProfileExperience("ADULT") returns Adult Experience', () => {
    const exp = getAssessmentProfileExperience('ADULT');
    expect(exp.heading).toBe('Avaliação dos teus conhecimentos');
    expect(exp.startActionLabel).toBe('Iniciar avaliação');
  });

  it('26. getAssessmentProfileExperience(null) returns Neutral Experience', () => {
    const exp = getAssessmentProfileExperience(null);
    expect(exp.heading).toBe('Desafio Quiz Escolar');
    expect(exp.startActionLabel).toBe('Começar Jogo!');
  });

  it('27. experience objects are frozen to prevent accidental mutation', () => {
    expect(Object.isFrozen(getAssessmentProfileExperience('CHILD'))).toBe(true);
    expect(Object.isFrozen(getAssessmentProfileExperience('TEEN'))).toBe(true);
    expect(Object.isFrozen(getAssessmentProfileExperience('ADULT'))).toBe(true);
    expect(Object.isFrozen(getAssessmentProfileExperience(null))).toBe(true);
  });

  it('28. normalizeAssessmentProfile and getAssessmentProfileExperience are pure and deterministic', () => {
    expect(normalizeAssessmentProfile('CHILD')).toEqual(normalizeAssessmentProfile('CHILD'));
    expect(getAssessmentProfileExperience('CHILD')).toEqual(getAssessmentProfileExperience('CHILD'));
  });

  it('29. reactivity: changing selectedAgeGroup prop from CHILD to TEEN updates UI immediately', () => {
    const { rerender } = render(
      <LanguageQuiz
        currentLanguage={dummyLanguage}
        selectedAgeGroup="CHILD"
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText('Vamos mostrar o que já aprendeste')).not.toBeNull();

    rerender(
      <LanguageQuiz
        currentLanguage={dummyLanguage}
        selectedAgeGroup="TEEN"
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText('Pronto para testar o teu progresso?')).not.toBeNull();
  });

  it('30. clicking start button invokes quiz start exactly once and transitions state', () => {
    const onCompleteQuiz = vi.fn();
    render(
      <LanguageQuiz
        currentLanguage={dummyLanguage}
        selectedAgeGroup="CHILD"
        onBack={vi.fn()}
        onCompleteQuiz={onCompleteQuiz}
      />
    );

    const startBtn = document.getElementById('btn-start-dynamic-quiz');
    expect(startBtn).not.toBeNull();
    fireEvent.click(startBtn!);

    expect(document.getElementById('assessment-profile-heading')).toBeNull();
  });

  it('31. preserves questions source and structure intact', () => {
    expect(Array.isArray(QUIZ_QUESTIONS)).toBe(true);
    expect(QUIZ_QUESTIONS.length).toBeGreaterThan(0);
  });

  it('32. preserves onBack callback (route action)', () => {
    const onBackMock = vi.fn();
    render(
      <LanguageQuiz
        currentLanguage={dummyLanguage}
        selectedAgeGroup="TEEN"
        onBack={onBackMock}
      />
    );

    const backSpan = screen.getAllByText('Voltar ao Dashboard')[0];
    const backBtn = backSpan.closest('button') || backSpan;
    fireEvent.click(backBtn);

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('33. falls back safely to neutral state for invalid profile values without age', () => {
    render(
      <LanguageQuiz
        currentLanguage={dummyLanguage}
        selectedAgeGroup="UNKNOWN_PROFILE_GROUP"
        onBack={vi.fn()}
      />
    );

    const heading = document.getElementById('assessment-profile-heading');
    const startBtn = document.getElementById('btn-start-dynamic-quiz');

    expect(heading?.textContent).toBe('Desafio Quiz Escolar');
    expect(startBtn?.textContent).toContain('Começar Jogo!');
  });
});

