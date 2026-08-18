import { describe, it, expect, vi } from 'vitest';
import { Logger } from './Logger';

describe('Logger', () => {
  it('should mask sensitive data', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const logger = new Logger('test-module');
    
    logger.info('Test message', 'test-op', { password: 'secretpassword' });
    
    const loggedOutput = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(loggedOutput.context.password).toBe('***MASKED***');
    
    consoleSpy.mockRestore();
  });
});
