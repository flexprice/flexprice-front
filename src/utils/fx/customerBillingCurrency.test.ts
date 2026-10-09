import { describe, expect, it } from 'vitest';
import { BILLING_CURRENCY_NONE, billingCurrencyPayload } from './customerBillingCurrency';

describe('billingCurrencyPayload', () => {
	it('create with a currency sends it lowercase', () => {
		expect(billingCurrencyPayload(undefined, 'INR', false)).toEqual({ billing_currency: 'inr' });
	});
	it('create with None omits the key', () => {
		expect(billingCurrencyPayload(undefined, BILLING_CURRENCY_NONE, false)).toEqual({});
		expect(billingCurrencyPayload(undefined, undefined, false)).toEqual({});
	});
	it('edit clearing a set currency sends an empty string', () => {
		expect(billingCurrencyPayload('inr', BILLING_CURRENCY_NONE, true)).toEqual({ billing_currency: '' });
	});
	it('edit that had none and still has none omits the key', () => {
		expect(billingCurrencyPayload(undefined, undefined, true)).toEqual({});
	});
	it('edit keeping a currency resends it', () => {
		expect(billingCurrencyPayload('inr', 'inr', true)).toEqual({ billing_currency: 'inr' });
	});
});
