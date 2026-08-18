import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SavedVocabDeck, {
  getLibraryProfileExperience,
  normalizeProfile,
  sortItemsByPriority
} from './SavedVocabDeck';
import { SavedWord } from '../../../types';

const mockWords: SavedWord[] = [
  {
    id: 'w1',
    word: 'Business Meeting',
    meaning: 'Reunião de negócios',
    pronunciation: '/ˈbɪznəs/',
    category: 'Formal',
    maturityLevel: 'Adulto',
    savedAt: '2026-07-25',
    grammarNote: '',
    exampleOriginal: '',
    exampleTranslation: ''
  },
  {
    id: 'w2',
    word: 'Playground Fun',
    meaning: 'Diversão no parque',
    pronunciation: '/ˈpleɪɡraʊnd/',
    category: 'vocabulário',
    maturityLevel: 'Infantil',
    savedAt: '2026-07-25',
    grammarNote: '',
    exampleOriginal: '',
    exampleTranslation: ''
  },
  {
    id: 'w3',
    word: 'Cool Tech Chat',
    meaning: 'Papo sobre tecnologia',
    pronunciation: '/kuːl tɛk/',
    category: 'conversação',
    maturityLevel: 'Adolescente',
    savedAt: '2026-07-25',
    grammarNote: '',
    exampleOriginal: '',
    exampleTranslation: ''
  }
];

describe('SavedVocabDeck - Adaptive Library & Pure Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. normalizeProfile handles selectedAgeGroup and userAge deterministically', () => {
    expect(normalizeProfile('CHILD')).toBe('CHILD');
    expect(normalizeProfile('TEEN')).toBe('TEEN');
    expect(normalizeProfile('ADULT')).toBe('ADULT');
    expect(normalizeProfile('Kids')).toBe('CHILD');
    expect(normalizeProfile(undefined, 8)).toBe('CHILD');
    expect(normalizeProfile(undefined, 15)).toBe('TEEN');
    expect(normalizeProfile(undefined, 25)).toBe('ADULT');
    expect(normalizeProfile()).toBeNull();
  });

  it('2. getLibraryProfileExperience returns pure, frozen, deterministic structures', () => {
    const childExp = getLibraryProfileExperience('CHILD');
    expect(childExp.heading).toBe('Escolhe a próxima aventura');
    expect(childExp.badge).toBe('Biblioteca divertida');
    expect(childExp.primaryActionLabel).toBe('Começar aventura');

    const teenExp = getLibraryProfileExperience('TEEN');
    expect(teenExp.heading).toBe('Escolhe o teu próximo desafio');
    expect(teenExp.badge).toBe('Biblioteca dinâmica');
    expect(teenExp.primaryActionLabel).toBe('Aceitar desafio');

    const adultExp = getLibraryProfileExperience('ADULT');
    expect(adultExp.heading).toBe('Conteúdos para os teus objectivos');
    expect(adultExp.badge).toBe('Biblioteca profissional');
    expect(adultExp.primaryActionLabel).toBe('Iniciar prática');

    const neutralExp = getLibraryProfileExperience(null);
    expect(neutralExp.heading).toBe('Saved Vocabulary Deck');
    expect(neutralExp.badge).toBe('Biblioteca');
    expect(neutralExp.primaryActionLabel).toBe('Explorar Expressões');
  });

  it('3. sortItemsByPriority reorders items by priority without mutating input', () => {
    const input = [...mockWords];
    const priorityList = ['vocabulário', 'conversação', 'Formal'];
    const sorted = sortItemsByPriority(input, priorityList);

    expect(sorted.length).toBe(mockWords.length);
    expect(sorted[0].id).toBe('w2'); // vocabulário
    expect(sorted[1].id).toBe('w3'); // conversação
    expect(sorted[2].id).toBe('w1'); // Formal
    expect(input[0].id).toBe('w1'); // Input is unmutated
  });

  it('4. ignores non-existent categories gracefully during sorting', () => {
    const sorted = sortItemsByPriority(mockWords, ['categoria_inexistente', 'Formal']);
    expect(sorted.length).toBe(mockWords.length);
    expect(sorted[0].id).toBe('w1'); // Formal matches second priority
  });

  it('5. renders NEUTRAL experience when no profile defined', () => {
    render(
      <SavedVocabDeck
        savedWords={mockWords}
        onDeleteWord={vi.fn()}
        onBack={vi.fn()}
        languageName="English"
        languageCode="en"
      />
    );

    expect(screen.getByTestId('library-badge').textContent).toBe('Biblioteca');
    expect(screen.getByText('Saved Vocabulary Deck')).toBeDefined();
    expect(screen.getByTestId('library-primary-action').textContent).toContain('Explorar Expressões');
  });

  it('6. renders CHILD experience when selectedAgeGroup is CHILD', () => {
    render(
      <SavedVocabDeck
        savedWords={mockWords}
        onDeleteWord={vi.fn()}
        onBack={vi.fn()}
        languageName="English"
        languageCode="en"
        selectedAgeGroup="CHILD"
      />
    );

    expect(screen.getByTestId('library-badge').textContent).toBe('Biblioteca divertida');
    expect(screen.getByText('Escolhe a próxima aventura')).toBeDefined();
    expect(screen.getByTestId('library-primary-action').textContent).toContain('Começar aventura');
  });

  it('7. renders TEEN experience when selectedAgeGroup is TEEN', () => {
    render(
      <SavedVocabDeck
        savedWords={mockWords}
        onDeleteWord={vi.fn()}
        onBack={vi.fn()}
        languageName="English"
        languageCode="en"
        selectedAgeGroup="TEEN"
      />
    );

    expect(screen.getByTestId('library-badge').textContent).toBe('Biblioteca dinâmica');
    expect(screen.getByText('Escolhe o teu próximo desafio')).toBeDefined();
    expect(screen.getByTestId('library-primary-action').textContent).toContain('Aceitar desafio');
  });

  it('8. renders ADULT experience when selectedAgeGroup is ADULT', () => {
    render(
      <SavedVocabDeck
        savedWords={mockWords}
        onDeleteWord={vi.fn()}
        onBack={vi.fn()}
        languageName="English"
        languageCode="en"
        selectedAgeGroup="ADULT"
      />
    );

    expect(screen.getByTestId('library-badge').textContent).toBe('Biblioteca profissional');
    expect(screen.getByText('Conteúdos para os teus objectivos')).toBeDefined();
    expect(screen.getByTestId('library-primary-action').textContent).toContain('Iniciar prática');
  });

  it('9. onBack button triggers callback without navigating or reloading page', () => {
    const onBackMock = vi.fn();
    render(
      <SavedVocabDeck
        savedWords={mockWords}
        onDeleteWord={vi.fn()}
        onBack={onBackMock}
        languageName="English"
        languageCode="en"
        selectedAgeGroup="ADULT"
      />
    );

    const backButton = screen.getByTestId('header-back-button');
    fireEvent.click(backButton);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
