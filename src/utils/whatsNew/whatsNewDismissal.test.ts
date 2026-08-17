import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WHATS_NEW_DISMISSALS_STORAGE_KEY, WHATS_NEW_RELEASE_ID, hasSeenWhatsNew, markWhatsNewSeen } from './whatsNewDismissal';

describe('whatsNewDismissal', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('tracks dismissal per user and release', () => {
		expect(hasSeenWhatsNew('user-a')).toBe(false);
		markWhatsNewSeen('user-a');
		expect(hasSeenWhatsNew('user-a')).toBe(true);
		expect(hasSeenWhatsNew('user-b')).toBe(false);
	});

	it('persists release id in storage', () => {
		markWhatsNewSeen('user-a');
		const raw = localStorage.getItem(WHATS_NEW_DISMISSALS_STORAGE_KEY);
		expect(raw).toContain(WHATS_NEW_RELEASE_ID);
	});
});
