import { describe, it, expect, vi } from 'vitest';
import { ClassroomRepository } from '../../infrastructure/repositories/ClassroomRepository';
import { getDoc, doc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
  doc: vi.fn(),
  getFirestore: vi.fn(),
  enableIndexedDbPersistence: vi.fn().mockResolvedValue(undefined),
}));

describe('ClassroomRepository', () => {
  it('should fetch a classroom session', async () => {
    const mockDb = {} as any;
    const repository = new ClassroomRepository(mockDb);
    
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ 
        name: 'Class 1', 
        tenantId: 't1',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'u1',
        updatedBy: 'u1',
        status: 'active',
        version: 1,
        audit: []
      }),
      id: 'c1'
    });

    const result = await repository.fetchSession('t1', 'c1');
    expect(result.isRight()).toBe(true);
  });
});
