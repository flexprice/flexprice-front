import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from './Logger';

describe('logger.error', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('logs the Error message/stack instead of "{}"', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		logger.error(new SyntaxError('Unexpected token u in JSON at position 0'));

		const logged = spy.mock.calls[0][0] as string;
		expect(logged).toContain('Unexpected token u in JSON at position 0');
		expect(logged).not.toContain('{}');
	});

	it('still JSON-stringifies plain objects', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		logger.error({ code: 'NOT_FOUND' });

		const logged = spy.mock.calls[0][0] as string;
		expect(logged).toContain('"code": "NOT_FOUND"');
	});
});
