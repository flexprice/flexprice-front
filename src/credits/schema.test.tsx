// src/credits/schema.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeCreditBalanceData, normalizeCreditTransactions } from './schema';

describe('normalizeCreditBalanceData', () => {
	it('coerces valid input through unchanged', () => {
		const input = { id: 'w1', name: 'Main', status: 'active' as const, creditBalance: 100, balance: 50, currency: 'USD' };
		expect(normalizeCreditBalanceData(input)).toEqual(input);
	});

	it('falls back an invalid status to active', () => {
		const result = normalizeCreditBalanceData({
			id: 'w1',
			name: 'X',
			status: 'bogus',
			creditBalance: 1,
			balance: 1,
			currency: 'USD',
		});
		expect(result.status).toBe('active');
	});

	it('coerces malformed numeric fields to 0 instead of throwing', () => {
		const result = normalizeCreditBalanceData({
			id: 'w1',
			name: 'X',
			status: 'active',
			creditBalance: 'oops',
			balance: null,
			currency: 'USD',
		});
		expect(result.creditBalance).toBe(0);
		expect(result.balance).toBe(0);
	});

	it('repairs a missing id to empty string rather than throwing (single-object path never drops)', () => {
		const result = normalizeCreditBalanceData({ name: 'X', status: 'active', creditBalance: 1, balance: 1, currency: 'USD' });
		expect(result.id).toBe('');
	});
});

describe('normalizeCreditTransactions', () => {
	it('coerces valid input through unchanged', () => {
		const input = [{ id: 't1', type: 'credit' as const, amount: 10, creditAmount: 10, reason: 'X', createdAt: '2026-01-01' }];
		expect(normalizeCreditTransactions(input)).toEqual(input);
	});

	it('normalizes a null currency to undefined, not the string "null"', () => {
		const result = normalizeCreditTransactions([
			{ id: 't1', type: 'credit', amount: 1, creditAmount: 1, reason: 'X', createdAt: '', currency: null },
		]);
		expect(result[0].currency).toBeUndefined();
	});

	it('falls back an invalid type to credit', () => {
		const result = normalizeCreditTransactions([{ id: 't1', type: 'bogus', amount: 1, creditAmount: 1, reason: 'X', createdAt: '' }]);
		expect(result[0].type).toBe('credit');
	});
});
