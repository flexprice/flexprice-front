import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { formatAmount } from './WalletTransactionList';

describe('WalletTransactionList formatAmount', () => {
	it('colors a failed credit transaction red, not teal (this page renders it in production via PaymentPage)', () => {
		const { container } = render(formatAmount({ type: 'credit', amount: 50, currency: 'USD', status: 'failed', creditsSuffix: 'credits' }));
		expect(container.querySelector('.text-danger')).not.toBeNull();
		expect(container.querySelector('.text-accent-teal-brand')).toBeNull();
	});

	it('colors a completed credit transaction teal, not red', () => {
		const { container } = render(
			formatAmount({ type: 'credit', amount: 50, currency: 'USD', status: 'completed', creditsSuffix: 'credits' }),
		);
		expect(container.querySelector('.text-accent-teal-brand')).not.toBeNull();
		expect(container.querySelector('.text-danger')).toBeNull();
	});
});
