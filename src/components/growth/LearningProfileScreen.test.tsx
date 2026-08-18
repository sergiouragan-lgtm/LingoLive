import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningProfileScreen } from './LearningProfileScreen';
import { ToastProvider } from '../../context/ToastContext';
import { smartProfileEngine } from '../../services/SmartProfileEngine';

vi.mock('../../services/SmartProfileEngine', () => ({
  smartProfileEngine: {
    addTargetLanguage: vi.fn(),
  },
}));

describe('LearningProfileScreen', () => {
  it('adds a new language when "Adicionar" is clicked', async () => {
    const setSelectedLanguage = vi.fn();
    const setSelectedAgeGroup = vi.fn();
    const setSelectedProficiency = vi.fn();
    const setView = vi.fn();
    
    const mockProfile = {
      id: 'mock-user-id',
      learning: {
        targetLanguages: {
          value: ['English']
        }
      }
    };
    
    const mockLanguage = { name: 'English', code: 'en', flag: '🇬🇧', defaultVoice: 'en-US-Standard-A' };
    
    render(
      <ToastProvider>
        <LearningProfileScreen
          userProfile={mockProfile}
          selectedAgeGroup="ADULT"
          setSelectedAgeGroup={setSelectedAgeGroup}
          selectedLanguage={mockLanguage}
          setSelectedLanguage={setSelectedLanguage}
          selectedProficiency="Beginner"
          setSelectedProficiency={setSelectedProficiency}
          setView={setView}
        />
      </ToastProvider>
    );

    // Select a language
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'French' } });
    
    // Click add
    const addButton = screen.getByText('Adicionar');
    fireEvent.click(addButton);
    
    expect(smartProfileEngine.addTargetLanguage).toHaveBeenCalledWith('mock-user-id', 'French');
  });

  it('shows other target languages from the user profile', () => {
    const setSelectedLanguage = vi.fn();
    const setSelectedAgeGroup = vi.fn();
    const setSelectedProficiency = vi.fn();
    const setView = vi.fn();
    
    const mockProfile = {
      learning: {
        targetLanguages: {
          value: ['English', 'French', 'German']
        }
      }
    };
    
    const mockLanguage = { name: 'English', code: 'en', flag: '🇬🇧', defaultVoice: 'en-US-Standard-A' };
    
    render(
      <ToastProvider>
        <LearningProfileScreen
          userProfile={mockProfile}
          selectedAgeGroup="ADULT"
          setSelectedAgeGroup={setSelectedAgeGroup}
          selectedLanguage={mockLanguage}
          setSelectedLanguage={setSelectedLanguage}
          selectedProficiency="Beginner"
          setSelectedProficiency={setSelectedProficiency}
          setView={setView}
        />
      </ToastProvider>
    );

    expect(screen.getAllByText('French').length).toBeGreaterThan(0);
    expect(screen.getAllByText('German').length).toBeGreaterThan(0);
    expect(screen.getAllByText('English').length).toBeGreaterThan(0); // Principal
  });
});
