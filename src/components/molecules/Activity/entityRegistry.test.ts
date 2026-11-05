import { describe, expect, it, vi } from 'vitest';
import { AxiosClient } from '@/core/axios/verbs';
import { ENTITY_REGISTRY, labelFor, shortId } from './entityRegistry';

describe('label ladder', () => {
	it('customer prefers name then external id then short id', () => {
		expect(labelFor('customer', { id: 'cust_01HXABCDEF', name: 'Acme', external_id: 'ext' })).toBe('Acme');
		expect(labelFor('customer', { id: 'cust_01HXABCDEF', external_id: 'ext' })).toBe('ext');
		expect(labelFor('customer', { id: 'cust_01HXABCDEF' })).toBe('cust_…ABCDEF');
	});
	it('wallet falls back to currency and type, never a positional name', () => {
		expect(labelFor('wallet', { id: 'wallet_01HXABCDEF', currency: 'USD', wallet_type: 'PRE_PAID' })).toBe('USD pre paid wallet');
		expect(labelFor('wallet', { id: 'wallet_01HXABCDEF', name: 'Credits' })).toBe('Credits');
	});
	it('invoice uses invoice number', () => {
		expect(labelFor('invoice', { id: 'inv_01HXABCDEF', invoice_number: 'INV-0042' })).toBe('INV-0042');
	});
	it('shortId keeps prefix and last six', () => {
		expect(shortId('subs_01HX7KQ2M9RQ')).toBe('subs_…Q2M9RQ');
	});
});

describe('resolvers', () => {
	// The API classes read `this.baseUrl`, so a resolver that passes the method unbound throws and the ref never links.
	it.each(['customer', 'invoice', 'wallet', 'plan', 'price', 'payment'])('%s resolves through its real API call', async (type) => {
		const get = vi.spyOn(AxiosClient, 'get').mockResolvedValue({ id: `${type}_01HXABCDEF`, name: 'Named' });
		const r = await ENTITY_REGISTRY[type].resolve(`${type}_01HXABCDEF`);
		expect(r.exists).toBe(true);
		expect(get).toHaveBeenCalledTimes(1);
		expect(String(get.mock.calls[0][0])).toContain(`${type}_01HXABCDEF`);
		get.mockRestore();
	});
});

describe('routes', () => {
	it('does not link entities that have no detail page', () => {
		expect(ENTITY_REGISTRY.payment.route('payment_1')).toBeNull();
		expect(ENTITY_REGISTRY.price.route('price_1')).toBeNull();
	});
});
