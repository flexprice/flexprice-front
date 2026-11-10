import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	announceCheckoutReturn,
	consumeCheckoutReturnLoad,
	hasProviderReturnParams,
	subscribeToCheckoutReturn,
	CHECKOUT_RETURN_PARAM,
} from './checkoutHandoff';

const setUrl = (url: string) => window.history.replaceState(null, '', url);

describe('checkoutHandoff', () => {
	beforeEach(() => setUrl('/customer-portal'));

	it('reports a redirect landing and strips the marker', () => {
		setUrl(`/customer-portal?section=credits&${CHECKOUT_RETURN_PARAM}=1`);

		expect(consumeCheckoutReturnLoad()).toBe(true);
		// Stripped so a tab that cannot close does not hand off again on reload,
		// and so the customer is not left with our plumbing in their address bar.
		expect(window.location.search).toBe('?section=credits');
	});

	it('reports an ordinary visit and leaves the URL alone', () => {
		setUrl('/customer-portal?token=abc');

		expect(consumeCheckoutReturnLoad()).toBe(false);
		expect(window.location.search).toBe('?token=abc');
	});

	it('delivers the announcement to a subscriber', async () => {
		const onReturn = vi.fn();
		const unsubscribe = subscribeToCheckoutReturn(onReturn);

		announceCheckoutReturn();

		// BroadcastChannel delivery is asynchronous.
		await vi.waitFor(() => expect(onReturn).toHaveBeenCalled());
		unsubscribe();
	});

	// The message is only a nudge — the receiving tab asks the API what happened,
	// so nothing about the outcome may travel on it.
	it('announces no payment outcome', () => {
		const received: unknown[] = [];
		const unsubscribe = subscribeToCheckoutReturn(() => {});
		const channel = new BroadcastChannel('flexprice.portal.checkout');
		channel.addEventListener('message', (e) => received.push(e.data));

		announceCheckoutReturn();
		channel.close();
		unsubscribe();

		received.forEach((message) => expect(message).toEqual({ type: 'checkout-returned' }));
	});
});

describe('hasProviderReturnParams', () => {
	it.each([
		['razorpay_payment_id=pay_1&razorpay_signature=x'],
		['razorpay_payment_link_id=plink_1'],
		['session_id=cs_test_1'],
		['_ptxn=txn_1'],
		['id=pay_1&status=paid'],
	])('recognises %s', (query) => {
		expect(hasProviderReturnParams(new URLSearchParams(query))).toBe(true);
	});

	it.each([[''], ['section=credits'], ['id=only_an_id']])('ignores %s', (query) => {
		expect(hasProviderReturnParams(new URLSearchParams(query))).toBe(false);
	});
});
