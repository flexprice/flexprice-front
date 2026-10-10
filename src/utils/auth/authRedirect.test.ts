import { describe, it, expect, beforeEach } from 'vitest';
import { buildAuthRedirect } from './authRedirect';

describe('buildAuthRedirect', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'location', {
			value: { origin: 'https://in.flexprice.io' },
			writable: true,
		});
	});

	it('builds an absolute URL on the current origin', () => {
		expect(buildAuthRedirect('/auth/reset-password')).toBe('https://in.flexprice.io/auth/reset-password');
	});

	it('follows the origin rather than a hardcoded host, so previews and regions get their own link', () => {
		Object.defineProperty(window, 'location', {
			value: { origin: 'https://flexprice-front-git-abc123.vercel.app' },
			writable: true,
		});
		expect(buildAuthRedirect('/auth/signup/confirmation')).toBe('https://flexprice-front-git-abc123.vercel.app/auth/signup/confirmation');
	});
});
