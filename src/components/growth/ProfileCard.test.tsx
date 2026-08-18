import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ProfileCard, getProfileVisualState } from './ProfileCard';

describe('getProfileVisualState - Pure Function', () => {
  it('retorna a configuração visual correta para o perfil Criança (CHILD)', () => {
    const unselectedState = getProfileVisualState('CHILD', false);
    expect(unselectedState.title).toBe('Criança');
    expect(unselectedState.range).toBe('4 a 11 anos');
    expect(unselectedState.tag).toBe('Lúdico & Interativo');
    expect(unselectedState.isSelected).toBe(false);

    const selectedState = getProfileVisualState('CHILD', true);
    expect(selectedState.isSelected).toBe(true);
    expect(selectedState.containerClasses).toContain('border-amber-500');
  });

  it('retorna a configuração visual correta para o perfil Adolescente (TEEN)', () => {
    const unselectedState = getProfileVisualState('TEEN', false);
    expect(unselectedState.title).toBe('Adolescente');
    expect(unselectedState.range).toBe('12 a 17 anos');
    expect(unselectedState.tag).toBe('Dinâmico & Desafiante');

    const selectedState = getProfileVisualState('TEEN', true);
    expect(selectedState.isSelected).toBe(true);
    expect(selectedState.containerClasses).toContain('border-indigo-500');
  });

  it('retorna a configuração visual correta para o perfil Adulto (ADULT)', () => {
    const unselectedState = getProfileVisualState('ADULT', false);
    expect(unselectedState.title).toBe('Adulto');
    expect(unselectedState.range).toBe('18 anos ou mais');
    expect(unselectedState.tag).toBe('Profissional & Prático');

    const selectedState = getProfileVisualState('ADULT', true);
    expect(selectedState.isSelected).toBe(true);
    expect(selectedState.containerClasses).toContain('border-indigo-500');
  });
});

describe('ProfileCard Component', () => {
  it('renderiza o cartão com o estado visual retornado pela função pura e dispara onSelect ao clicar', () => {
    const handleSelect = vi.fn();

    render(
      <ProfileCard
        groupKey="CHILD"
        isSelected={false}
        onSelect={handleSelect}
      />
    );

    expect(screen.getAllByText('Criança').length).toBeGreaterThan(0);
    expect(screen.getByText(/4 a 11 anos/)).toBeDefined();
    expect(screen.getByText('Lúdico & Interativo')).toBeDefined();

    const card = screen.getByTestId('profile-card-child');
    fireEvent.click(card);

    expect(handleSelect).toHaveBeenCalledWith('CHILD');
  });

  it('reflete dinamicamente a alteração do estado de seleção', () => {
    const { rerender } = render(
      <ProfileCard
        groupKey="TEEN"
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Selecionar Perfil Adolescente')).toBeDefined();

    rerender(
      <ProfileCard
        groupKey="TEEN"
        isSelected={true}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Perfil Ativo')).toBeDefined();
  });
});
