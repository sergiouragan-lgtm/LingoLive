import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('mobile FCM device registrations remain private and constrained', () => {
  const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8');
  const block = rules.match(/match \/devices\/\{deviceId\} \{[\s\S]*?\n\s*\}/)?.[0] ?? '';

  it('requires ownership and verified email for token writes', () => {
    expect(block).toContain('isEmailVerified() && isOwner(userId)');
  });

  it('allows only token registration fields with bounded token size', () => {
    expect(block).toContain("hasOnly(['token', 'platform', 'enabled', 'updatedAt'])");
    expect(block).toContain('incoming().token.size() <= 4096');
    expect(block).toContain("incoming().platform == 'flutter'");
  });

  it('does not grant cross-user deletion', () => {
    expect(block).toContain('allow delete: if isSignedIn() && isOwner(userId)');
  });
});

describe('mobile school access trusts custom claims only', () => {
  const route = readFileSync(join(process.cwd(), 'server/routes/school.routes.ts'), 'utf8');
  it('requires an institutional role plus claimed tenant identifier', () => {
    expect(route).toContain('req.user?.role');
    expect(route).toContain('req.user?.schoolId');
    expect(route).toContain('req.user?.tenantId');
    expect(route).not.toMatch(/mobile-context[\s\S]{0,1000}collection\(["']users["']\)/);
  });
});
