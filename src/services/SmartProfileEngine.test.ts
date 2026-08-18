import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartProfileEngine } from './SmartProfileEngine';
import { updateDoc, setDoc } from 'firebase/firestore';

const DELETE_FIELD_SENTINEL = Symbol('deleteField');

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, collection, id) => ({ collection, id })),
  getDoc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteField: vi.fn(() => DELETE_FIELD_SENTINEL),
}));

vi.mock('../firebase', () => ({
  db: {}
}));

describe('SmartProfileEngine - Normalized Target Languages Persistence', () => {
  let engine: SmartProfileEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new SmartProfileEngine();
  });

  it('TESTE 1 — LIMPEZA PERSISTENTE DE STRING VAZIA ("")', async () => {
    await engine.updateLearning('user-1', {
      targetLanguage: ''
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toBe(DELETE_FIELD_SENTINEL);
    expect(updateCallArg['learning.targetLanguages']).toBe(DELETE_FIELD_SENTINEL);
  });

  it('TESTE 2 — LIMPEZA PERSISTENTE DE ESPAÇOS ("   ")', async () => {
    await engine.updateLearning('user-1', {
      targetLanguage: '   '
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toBe(DELETE_FIELD_SENTINEL);
    expect(updateCallArg['learning.targetLanguages']).toBe(DELETE_FIELD_SENTINEL);
  });

  it('TESTE 3 — ATTRIBUTE VAZIO (value: "")', async () => {
    const attrEmpty = {
      value: '',
      confidence: 1,
      source: 'user',
      lastUpdated: '2026-07-22T12:00:00.000Z',
      validationStatus: 'verified',
      version: '1.0.0'
    };

    await engine.updateLearning('user-1', {
      targetLanguage: attrEmpty as any
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toBe(DELETE_FIELD_SENTINEL);
    expect(updateCallArg['learning.targetLanguages']).toBe(DELETE_FIELD_SENTINEL);
  });

  it('TESTE 4 — ATTRIBUTE COM ESPAÇOS (value: "   ")', async () => {
    const attrSpaces = {
      value: '   ',
      confidence: 1,
      source: 'user',
      lastUpdated: '2026-07-22T12:00:00.000Z',
      validationStatus: 'verified',
      version: '1.0.0'
    };

    await engine.updateLearning('user-1', {
      targetLanguage: attrSpaces as any
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toBe(DELETE_FIELD_SENTINEL);
    expect(updateCallArg['learning.targetLanguages']).toBe(DELETE_FIELD_SENTINEL);
  });

  it('TESTE 5 — CAMPO AUSENTE NÃO APAGA (cefrLevel actualizado)', async () => {
    const attrCefr = {
      value: 'B2',
      confidence: 0.9,
      source: 'assessment',
      lastUpdated: '2026-07-22',
      validationStatus: 'verified',
      version: '1.0'
    };

    await engine.updateLearning('user-1', {
      cefrLevel: attrCefr as any
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.cefrLevel']).toEqual(attrCefr);
    expect(updateCallArg['learning.targetLanguage']).toBeUndefined();
    expect(updateCallArg['learning.targetLanguages']).toBeUndefined();
  });

  it('TESTE 6 — VALOR VÁLIDO CONTINUA SINCRONIZADO (French)', async () => {
    await engine.updateLearning('user-1', {
      targetLanguage: 'French'
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toBe('French');
    expect(updateCallArg['learning.targetLanguages']).toEqual(['French']);
  });

  it('TESTE 7 — ATTRIBUTE VÁLIDO PRESERVA METADATA', async () => {
    const attrTargetLanguage = {
      value: 'French',
      confidence: 1,
      source: 'user',
      lastUpdated: '2026-07-22T12:00:00.000Z',
      validationStatus: 'verified',
      version: '1.0.0'
    };

    await engine.updateLearning('user-1', {
      targetLanguage: attrTargetLanguage as any
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toEqual(attrTargetLanguage);
    expect(updateCallArg['learning.targetLanguages']).toEqual({
      value: ['French'],
      confidence: 1,
      source: 'user',
      lastUpdated: '2026-07-22T12:00:00.000Z',
      validationStatus: 'verified',
      version: '1.0.0'
    });
  });

  it('TESTE 8 — OUTROS CAMPOS PRESERVADOS (targetLanguage vazio + cefrLevel válido)', async () => {
    const attrCefr = {
      value: 'B2',
      confidence: 0.9,
      source: 'assessment',
      lastUpdated: '2026-07-22',
      validationStatus: 'verified',
      version: '1.0'
    };

    await engine.updateLearning('user-1', {
      targetLanguage: '',
      cefrLevel: attrCefr as any
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toBe(DELETE_FIELD_SENTINEL);
    expect(updateCallArg['learning.targetLanguages']).toBe(DELETE_FIELD_SENTINEL);
    expect(updateCallArg['learning.cefrLevel']).toEqual(attrCefr);
  });

  it('TESTE 9 — INITIALIZEPROFILE COM VAZIO', async () => {
    await engine.initializeProfile('user-99', {
      identity: {} as any,
      localization: {} as any,
      learning: {
        targetLanguage: ''
      } as any,
      educational: {} as any,
      aiPersonalization: {} as any,
      gamification: {} as any,
      subscription: {} as any,
      account: {} as any,
      childProfile: {} as any,
      accessibility: {} as any
    });

    expect(setDoc).toHaveBeenCalledTimes(1);
    const setCallArg = vi.mocked(setDoc).mock.calls[0][1] as any;
    expect(setCallArg.learning.targetLanguage).toBeUndefined();
    expect(setCallArg.learning.targetLanguages).toBeUndefined();
  });

  it('TESTE 10 — INITIALIZEPROFILE COM VALOR VÁLIDO (French)', async () => {
    await engine.initializeProfile('user-100', {
      identity: {} as any,
      localization: {} as any,
      learning: {
        targetLanguage: 'French'
      } as any,
      educational: {} as any,
      aiPersonalization: {} as any,
      gamification: {} as any,
      subscription: {} as any,
      account: {} as any,
      childProfile: {} as any,
      accessibility: {} as any
    });

    expect(setDoc).toHaveBeenCalledTimes(1);
    const setCallArg = vi.mocked(setDoc).mock.calls[0][1] as any;
    expect(setCallArg.learning.targetLanguage).toBe('French');
    expect(setCallArg.learning.targetLanguages).toEqual(['French']);
  });

  it('TESTE 11 — UMA ÚNICA CHAMADA ATÓMICA', async () => {
    vi.clearAllMocks();
    await engine.updateLearning('user-1', {
      targetLanguage: ''
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toBe(DELETE_FIELD_SENTINEL);
    expect(updateCallArg['learning.targetLanguages']).toBe(DELETE_FIELD_SENTINEL);
  });

  it('TESTE 12 — SEM REGRESSÃO (Normalização de espaços, nativeLanguage, country, actualização English->French, determinismo)', async () => {
    // Espaços
    await engine.updateLearning('user-1', { targetLanguage: '  German  ' });
    let updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toBe('German');
    expect(updateCallArg['learning.targetLanguages']).toEqual(['German']);

    // Idioma nativo e país não inferidos em targetLanguages
    const normalized = engine.normalizeLearningDomain({ targetLanguage: 'French' });
    expect(normalized.targetLanguages).toEqual(['French']);

    // Entrada vazia directa em normalizeLearningDomain
    const normEmpty = engine.normalizeLearningDomain({ targetLanguage: '' });
    expect(normEmpty.targetLanguage).toBeUndefined();
    expect(normEmpty.targetLanguages).toBeUndefined();

    // Actualização English -> French
    vi.clearAllMocks();
    await engine.updateLearning('user-1', { targetLanguage: 'English' });
    updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguages']).toEqual(['English']);

    vi.clearAllMocks();
    await engine.updateLearning('user-1', { targetLanguage: 'French' });
    updateCallArg = vi.mocked(updateDoc).mock.calls[0][1];
    expect(updateCallArg['learning.targetLanguage']).toBe('French');
    expect(updateCallArg['learning.targetLanguages']).toEqual(['French']);

    // Determinismo
    const res1 = engine.normalizeLearningDomain({ targetLanguage: 'French' });
    const res2 = engine.normalizeLearningDomain({ targetLanguage: 'French' });
    expect(res1).toEqual(res2);
  });

  it('TESTE 13 — PRESERVAÇÃO DE LISTA MULTILINGUE', async () => {
    const normalized = engine.normalizeLearningDomain({
      targetLanguage: 'French',
      targetLanguages: ['English', 'French', 'German']
    });
    
    expect(normalized.targetLanguage).toBe('French');
    expect(normalized.targetLanguages).toEqual(['French', 'English', 'German']);
  });

  it('TESTE 14 — PERFIL ANTIGO APENAS COM TARGETLANGUAGE', async () => {
    const normalized = engine.normalizeLearningDomain({
      targetLanguage: 'French'
    });
    
    expect(normalized.targetLanguage).toBe('French');
    expect(normalized.targetLanguages).toEqual(['French']);
  });

  it('TESTE 15 — LISTA COM DUPLICADOS', async () => {
    const normalized = engine.normalizeLearningDomain({
      targetLanguage: 'French',
      targetLanguages: ['French', 'french', 'FRENCH', 'German']
    });
    
    expect(normalized.targetLanguage).toBe('French');
    expect(normalized.targetLanguages).toEqual(['French', 'German']);
  });

  it('TESTE 16 — setPrimaryTargetLanguage: MULTILINGUE SEM PERDA', async () => {
    // Mock getProfile to return a profile
    vi.spyOn(engine, 'getProfile').mockResolvedValue({
      userId: 'user-1',
      learning: {
        targetLanguage: 'English',
        targetLanguages: ['English', 'French', 'German']
      }
    } as any);
    vi.spyOn(engine, 'updateLearning').mockResolvedValue(undefined);

    await engine.setPrimaryTargetLanguage('user-1', 'French');

    expect(engine.updateLearning).toHaveBeenCalledWith('user-1', {
      targetLanguage: 'French',
      targetLanguages: ['French', 'English', 'German']
    });
  });

  it('TESTE 17 — addTargetLanguage: ADICIONAR NOVO IDIOMA', async () => {
    vi.spyOn(engine, 'getProfile').mockResolvedValue({
      userId: 'user-1',
      learning: {
        targetLanguage: 'English',
        targetLanguages: ['English', 'French']
      }
    } as any);
    vi.spyOn(engine, 'updateLearning').mockResolvedValue(undefined);

    await engine.addTargetLanguage('user-1', 'German');

    expect(engine.updateLearning).toHaveBeenCalledWith('user-1', {
      targetLanguage: 'English',
      targetLanguages: ['English', 'French', 'German']
    });
  });

  it('TESTE 18 — removeTargetLanguage: REMOVER IDIOMA SECUNDÁRIO', async () => {
    vi.spyOn(engine, 'getProfile').mockResolvedValue({
      userId: 'user-1',
      learning: {
        targetLanguage: 'English',
        targetLanguages: ['English', 'French', 'German']
      }
    } as any);
    vi.spyOn(engine, 'updateLearning').mockResolvedValue(undefined);

    await engine.removeTargetLanguage('user-1', 'French');

    expect(engine.updateLearning).toHaveBeenCalledWith('user-1', {
      targetLanguage: 'English',
      targetLanguages: ['English', 'German']
    });
  });

  it('TESTE 19 — removeTargetLanguage: REMOVER IDIOMA PRINCIPAL', async () => {
    vi.spyOn(engine, 'getProfile').mockResolvedValue({
      userId: 'user-1',
      learning: {
        targetLanguage: 'French',
        targetLanguages: ['French', 'English', 'German']
      }
    } as any);
    vi.spyOn(engine, 'updateLearning').mockResolvedValue(undefined);

    await engine.removeTargetLanguage('user-1', 'French');

    expect(engine.updateLearning).toHaveBeenCalledWith('user-1', {
      targetLanguage: 'English',
      targetLanguages: ['English', 'German']
    });
  });

  it('TESTE 20 — removeTargetLanguage: REMOVER O ÚNICO IDIOMA (ATÓMICO DELETE)', async () => {
    vi.spyOn(engine, 'getProfile').mockResolvedValue({
      userId: 'user-1',
      learning: {
        targetLanguage: 'French',
        targetLanguages: ['French']
      }
    } as any);
    vi.spyOn(engine, 'updateLearning').mockResolvedValue(undefined);

    await engine.removeTargetLanguage('user-1', 'French');

    // Triggered deleteField in updateLearning via empty string
    expect(engine.updateLearning).toHaveBeenCalledWith('user-1', {
      targetLanguage: ''
    });
  });

  describe('SmartProfileEngine - Short-Term In-Memory Cache', () => {
    it('caches profile result and avoids redundant network calls', async () => {
      const getDocModule = await import('firebase/firestore');
      vi.mocked(getDocModule.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ userId: 'user-cache-1', account: { role: { value: 'Student' } } })
      } as any);

      const p1 = await engine.getProfile('user-cache-1');
      const p2 = await engine.getProfile('user-cache-1');

      expect(p1).toEqual(p2);
      expect(getDocModule.getDoc).toHaveBeenCalledTimes(1);
    });

    it('bypasses cache when forceRefresh is true', async () => {
      const getDocModule = await import('firebase/firestore');
      vi.mocked(getDocModule.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ userId: 'user-cache-2' })
      } as any);

      await engine.getProfile('user-cache-2');
      await engine.getProfile('user-cache-2', true);

      expect(getDocModule.getDoc).toHaveBeenCalledTimes(2);
    });

    it('clears cache on updateDomain', async () => {
      const getDocModule = await import('firebase/firestore');
      vi.mocked(getDocModule.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ userId: 'user-cache-3' })
      } as any);

      await engine.getProfile('user-cache-3');
      await engine.updateDomain('user-cache-3', 'account', { dailyGoal: { value: 15 } as any });
      await engine.getProfile('user-cache-3');

      expect(getDocModule.getDoc).toHaveBeenCalledTimes(2);
    });

    it('respects setCacheTTL expiration', async () => {
      const getDocModule = await import('firebase/firestore');
      vi.mocked(getDocModule.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ userId: 'user-cache-4' })
      } as any);

      engine.setCacheTTL(10); // 10ms
      await engine.getProfile('user-cache-4');

      await new Promise(res => setTimeout(res, 20));

      await engine.getProfile('user-cache-4');
      expect(getDocModule.getDoc).toHaveBeenCalledTimes(2);
    });

    it('clears cache via clearCache method', async () => {
      const getDocModule = await import('firebase/firestore');
      vi.mocked(getDocModule.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ userId: 'user-cache-5' })
      } as any);

      await engine.getProfile('user-cache-5');
      engine.clearCache('user-cache-5');
      await engine.getProfile('user-cache-5');

      expect(getDocModule.getDoc).toHaveBeenCalledTimes(2);
    });
  });
});

