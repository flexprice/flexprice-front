import { describe, it, expect } from 'vitest';
import { getWalletTransactionAmountColorClass } from './walletTransactionColor';

describe('getWalletTransactionAmountColorClass', () => {
	it('colors a failed credit transaction danger, not the credit-success teal', () => {
		expect(getWalletTransactionAmountColorClass('credit', 'failed')).toBe('text-danger');
	});

	it('colors a failed debit transaction danger too', () => {
		expect(getWalletTransactionAmountColorClass('debit', 'failed')).toBe('text-danger');
	});

	it('is case-insensitive on status', () => {
		expect(getWalletTransactionAmountColorClass('credit', 'FAILED')).toBe('text-danger');
	});

	it('colors a pending transaction amber', () => {
		expect(getWalletTransactionAmountColorClass('credit', 'pending')).toBe('text-accent-yellow-brand');
	});

	it('colors a completed credit transaction teal', () => {
		expect(getWalletTransactionAmountColorClass('credit', 'completed')).toBe('text-accent-teal-brand');
	});

	it('colors a completed debit transaction the neutral tone', () => {
		expect(getWalletTransactionAmountColorClass('debit', 'completed')).toBe('text-content-zinc-bold');
	});

	it('falls back to type-based color when status is missing', () => {
		expect(getWalletTransactionAmountColorClass('credit', undefined)).toBe('text-accent-teal-brand');
	});
});
