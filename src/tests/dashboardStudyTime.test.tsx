import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { StudyTimeTracker } from '../components/learning/StudyTimeTracker';

describe('StudyTimeTracker', () => {
  it('shows the unavailable state when canonical progress has no duration', () => {
    render(<StudyTimeTracker userId="test-user" totalMinutes={0} />);
    expect(screen.getByText(/Tempo de estudo ainda não disponível/i)).toBeDefined();
  });

  it('renders minutes supplied by canonical learning progress', () => {
    render(<StudyTimeTracker userId="test-user" totalMinutes={3} />);
    expect(screen.getByText('3 min')).toBeDefined();
    expect(screen.getByLabelText('Tempo total de estudo: 3 minutos')).toBeDefined();
  });

  it('renders hours and remaining minutes', () => {
    render(<StudyTimeTracker userId="test-user" totalMinutes={125} />);
    expect(screen.getByText('2h 5 min')).toBeDefined();
    expect(screen.getByLabelText('Tempo total de estudo: 2 horas 5 minutos')).toBeDefined();
  });

  it('renders the supplied total without querying legacy activity collections', () => {
    render(<StudyTimeTracker userId="test-user" totalMinutes={30} />);
    expect(screen.getByText('30 min')).toBeDefined();
  });
});
