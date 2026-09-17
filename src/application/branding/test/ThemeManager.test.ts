import { describe, it, expect, vi } from 'vitest';
import { ThemeManager } from '../ThemeManager';
import { BrandConfig } from '../../../domain/branding/BrandConfig';

describe('ThemeManager', () => {
  it('should apply theme', () => {
    const root = document.documentElement;
    vi.spyOn(root.style, 'setProperty');

    ThemeManager.applyTheme('corporate');
    expect(root.style.setProperty).toHaveBeenCalledWith('--theme-primaryColor', '#2563EB');
  });

  it('should apply brand config', () => {
    const mockConfig: BrandConfig = {
      primaryColor: 'red',
      secondaryColor: 'blue',
      tenantId: 't1',
      id: 'b1',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'u1',
      updatedBy: 'u1',
      status: 'active',
      version: 1,
      audit: [],
      domain: 'example.com',
      logoUrl: '',
      faviconUrl: '',
      fontFamily: '',
      emailSettings: { fromName: '', templateId: '' },
      loginPageSettings: { title: 'Test Title', showSocialLogin: false }
    } as any;

    const root = document.documentElement;
    vi.spyOn(root.style, 'setProperty');

    ThemeManager.applyBrandConfig(mockConfig);
    expect(root.style.setProperty).toHaveBeenCalledWith('--primary-color', 'red');
  });
});
