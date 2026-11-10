import { describe, expect, it } from 'vitest';
import en from '@/i18n/locales/en/customer-portal.json';

/**
 * The return pages show without a portal session, so they cannot know how the
 * payment ended. Claiming success for a payment that failed is worse than an
 * error, and claiming failure for one that went through makes customers pay twice.
 */
describe('checkout return copy', () => {
	const { wrapper } = en;

	it('never claims success on the success route', () => {
		const copy = `${wrapper.checkoutReturnTitle} ${wrapper.checkoutReturnDescription}`.toLowerCase();
		['successful', 'succeeded', ' paid', 'complete', 'all set', 'charged'].forEach((word) => expect(copy).not.toContain(word));
	});

	it('never claims failure on the failure route', () => {
		const copy = `${wrapper.checkoutReturnFailedTitle} ${wrapper.checkoutReturnFailedDescription}`.toLowerCase();
		['failed', 'declined', 'was not charged', 'nothing was charged'].forEach((word) => expect(copy).not.toContain(word));
	});
});
