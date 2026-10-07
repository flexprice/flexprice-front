import { describe, it, expect, beforeEach } from 'vitest';
import { initRecoveryLanding, isPasswordRecoveryLanding, resetRecoveryLandingForTests } from './recoveryLanding';

function setHash(hash: string) {
	Object.defineProperty(window, 'location', {
		value: { hash },
		writable: true,
	});
}

describe('recoveryLanding', () => {
	beforeEach(() => {
		resetRecoveryLandingForTests();
	});

	it('is false before init runs', () => {
		expect(isPasswordRecoveryLanding()).toBe(false);
	});

	it('recognises a GoTrue recovery fragment', () => {
		setHash('#access_token=abc&refresh_token=def&type=recovery');
		initRecoveryLanding();
		expect(isPasswordRecoveryLanding()).toBe(true);
	});

	it('ignores a fragment for any other flow', () => {
		setHash('#access_token=abc&type=signup');
		initRecoveryLanding();
		expect(isPasswordRecoveryLanding()).toBe(false);
	});

	it('ignores an empty fragment', () => {
		setHash('');
		initRecoveryLanding();
		expect(isPasswordRecoveryLanding()).toBe(false);
	});

	// The whole point of capturing at load: supabase-js strips the fragment once it
	// has read it, and the answer must survive that.
	it('keeps reporting true after the fragment is stripped', () => {
		setHash('#access_token=abc&type=recovery');
		initRecoveryLanding();
		setHash('');
		expect(isPasswordRecoveryLanding()).toBe(true);
	});
});
