import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import ChangesTable from './ChangesTable';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (typeof o?.defaultValue === 'string' ? o.defaultValue : k) }),
}));

const wrap = (ui: React.ReactNode) => (
	<QueryClientProvider client={new QueryClient()}>
		<MemoryRouter>{ui}</MemoryRouter>
	</QueryClientProvider>
);

describe('ChangesTable', () => {
	// Razorpay ids start with `pay_`, the same prefix as Flexprice payments, so the API tags them as payment refs.
	it('shows a gateway id as plain text, never as a Flexprice reference', () => {
		render(
			wrap(
				<ChangesTable
					changes={{ gateway_payment_id: { from: null, to: 'pay_Rz1234567890ab', label: 'Gateway payment id', format: 'ref:payment' } }}
				/>,
			),
		);
		expect(screen.getByText('pay_Rz1234567890ab')).toBeInTheDocument();
		expect(screen.queryByText('deleted')).not.toBeInTheDocument();
	});
});
