import { describe, expect, it, vi } from 'vitest';
import { requireSelfBody, requireSelfParam } from './requireAuth';

function responseMock() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { response: { status } as any, status, json };
}

describe('ownership authorization middleware', () => {
  it('allows a user to access their own userId parameter', () => {
    const next = vi.fn();
    const { response } = responseMock();

    requireSelfParam({ user: { uid: 'user-1' }, params: { userId: 'user-1' } }, response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks cross-user access through a userId parameter', () => {
    const next = vi.fn();
    const { response, status, json } = responseMock();

    requireSelfParam({ user: { uid: 'user-1' }, params: { userId: 'user-2' } }, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: 'Acesso negado' });
  });

  it('allows an administrator to access another user', () => {
    const next = vi.fn();
    const { response } = responseMock();

    requireSelfParam(
      { user: { uid: 'admin-1', role: 'admin' }, params: { userId: 'user-2' } },
      response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('enforces the same ownership boundary for a userId in the body', () => {
    const next = vi.fn();
    const { response, status } = responseMock();

    requireSelfBody({ user: { uid: 'user-1' }, body: { userId: 'user-2' } }, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });

  it('fails closed when identity or addressed user is missing', () => {
    const next = vi.fn();
    const { response, status } = responseMock();

    requireSelfParam({ user: {}, params: {} }, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });
});
