import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enBilling from '@/i18n/locales/en/billing.json';
import { WALLET_TRANSACTION_REASON } from '@/models/Wallet';
import type { WalletTransaction } from '@/models/WalletTransaction';
import type { ReactNode } from 'react';
import WalletTransactionsTable from './WalletTransactionsTable';
import CustomerWalletTransactionsTable from './CustomerWalletTransactionsTable';

const tx = (overrides: Partial<WalletTransaction> = {}): WalletTransaction => ({
	amount: 25,
	balance_after: 100,
	balance_before: 100,
	created_at: '2026-01-01T00:00:00Z',
	description: '',
	id: 'tx_1',
	metadata: {},
	reference_id: '',
	reference_type: '',
	transaction_status: 'completed',
	type: 'credit',
	wallet_id: 'w1',
	credit_amount: 25,
	transaction_reason: WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_INVOICED,
	expiry_date: '',
	currency: 'USD',
	...overrides,
});

const withI18n = (ui: ReactNode) => {
	const instance = createInstance();
	instance.init({ lng: 'en', fallbackLng: 'en', ns: ['billing'], defaultNS: 'billing', resources: { en: { billing: enBilling } } });
	return <I18nextProvider i18n={instance}>{ui}</I18nextProvider>;
};

describe('WalletTransactionsTable', () => {
	it('renders a real translated transaction-reason label through a host i18next instance', () => {
		const instance = createInstance();
		instance.init({ lng: 'en', fallbackLng: 'en', ns: ['billing'], defaultNS: 'billing', resources: { en: { billing: enBilling } } });
		render(
			<I18nextProvider i18n={instance}>
				<WalletTransactionsTable
					data={[
						{
							amount: 100,
							balance_after: 200,
							balance_before: 100,
							created_at: '2026-01-01T00:00:00Z',
							description: '',
							id: 'tx_1',
							metadata: {},
							reference_id: '',
							reference_type: '',
							transaction_status: 'completed',
							type: 'credit',
							wallet_id: 'w1',
							credit_amount: 100,
							transaction_reason: WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT,
							expiry_date: '',
						},
					]}
				/>
			</I18nextProvider>,
		);
		expect(screen.getByText('Free Credits Added')).toBeInTheDocument();
	});

	it("colors a pending transaction amber (regression test: this table must match CustomerWalletTransactionsTable's coloring)", () => {
		const { container } = render(
			<WalletTransactionsTable
				data={[
					{
						amount: 50,
						balance_after: 150,
						balance_before: 100,
						created_at: '2026-01-01T00:00:00Z',
						description: '',
						id: 'tx_pending',
						metadata: {},
						reference_id: '',
						reference_type: '',
						transaction_status: 'pending',
						type: 'credit',
						wallet_id: 'w1',
						credit_amount: 50,
						transaction_reason: WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT,
						expiry_date: '',
						currency: 'USD',
					},
				]}
			/>,
		);
		expect(container.querySelector('.text-accent-yellow-brand')).not.toBeNull();
	});

	it('colors a completed credit transaction teal, not amber', () => {
		const { container } = render(
			<WalletTransactionsTable
				data={[
					{
						amount: 50,
						balance_after: 150,
						balance_before: 100,
						created_at: '2026-01-01T00:00:00Z',
						description: '',
						id: 'tx_completed',
						metadata: {},
						reference_id: '',
						reference_type: '',
						transaction_status: 'completed',
						type: 'credit',
						wallet_id: 'w1',
						credit_amount: 50,
						transaction_reason: WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT,
						expiry_date: '',
						currency: 'USD',
					},
				]}
			/>,
		);
		expect(container.querySelector('.text-accent-yellow-brand')).toBeNull();
		expect(container.querySelector('.text-accent-teal-brand')).not.toBeNull();
	});

	// A failed top-up used to render exactly like a completed one — teal, with a leading
	// "+" — because only `pending` was special-cased. The wallet balance excluded it, so
	// the row claimed credits the customer never received.
	describe('failed transactions', () => {
		it('never colours a failed credit as money that arrived', () => {
			const { container } = render(withI18n(<WalletTransactionsTable data={[tx({ id: 'tx_failed', transaction_status: 'failed' })]} />));

			expect(container.querySelector('.text-accent-teal-brand')).toBeNull();
			expect(container.querySelector('.text-accent-yellow-brand')).toBeNull();
			// Struck through as well as muted: colour is the one cue a red/green colourblind
			// reader cannot use, and this is the row where that matters most.
			expect(container.querySelectorAll('.line-through.text-content-muted').length).toBe(2);
		});

		it('keeps pending amber and completed teal, so the three statuses stay distinct', () => {
			const { container, rerender } = render(withI18n(<WalletTransactionsTable data={[tx({ transaction_status: 'pending' })]} />));
			expect(container.querySelector('.text-accent-yellow-brand')).not.toBeNull();
			expect(container.querySelector('.line-through')).toBeNull();

			rerender(withI18n(<WalletTransactionsTable data={[tx({ transaction_status: 'completed' })]} />));
			expect(container.querySelector('.text-accent-teal-brand')).not.toBeNull();
			expect(container.querySelector('.line-through')).toBeNull();
		});

		// All three wallet tables duplicated the same colour expression; the fix is shared,
		// so the admin table must not drift back.
		it('applies the same treatment in the admin customer table', () => {
			const { container } = render(withI18n(<CustomerWalletTransactionsTable data={[tx({ transaction_status: 'failed' })]} />));

			expect(container.querySelector('.text-accent-teal-brand')).toBeNull();
			expect(container.querySelector('.line-through')).not.toBeNull();
		});
	});
});
