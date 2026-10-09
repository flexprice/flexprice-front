import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ActivityApi from '@/api/ActivityApi';
import CustomerApi from '@/api/CustomerApi';
import WalletApi from '@/api/WalletApi';
import InvoiceApi from '@/api/InvoiceApi';
import CustomerActivityTab from './CustomerActivityTab';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) => (typeof opts?.defaultValue === 'string' ? opts.defaultValue : key),
	}),
}));

const wrap = (ui: React.ReactNode) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
		<MemoryRouter initialEntries={['/billing/customers/cust_1/activity']}>
			<Routes>
				<Route path='/billing/customers/:id/activity' element={ui} />
			</Routes>
		</MemoryRouter>
	</QueryClientProvider>
);

describe('CustomerActivityTab', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.spyOn(CustomerApi, 'getCustomerSubscriptions').mockResolvedValue({ items: [], pagination: {} } as never);
		vi.spyOn(WalletApi, 'getCustomerWallets').mockResolvedValue([]);
		vi.spyOn(InvoiceApi, 'listInvoices').mockResolvedValue({ items: [] } as never);
		vi.spyOn(CustomerApi, 'getCustomerById').mockResolvedValue({ id: 'cust_1', name: 'Acme' } as never);
	});

	it('defaults to the customer roll-up scope', async () => {
		const list = vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [], has_more: false });
		render(wrap(<CustomerActivityTab />));
		await waitFor(() => expect(list).toHaveBeenCalled());
		expect(list.mock.calls[0][0]).toEqual(expect.objectContaining({ customer_id: 'cust_1' }));
		expect(list.mock.calls[0][0].entity_type).toBeUndefined();
	});

	it("offers one entity-type filter and does not load the customer's records for it", async () => {
		vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [], has_more: false });
		render(wrap(<CustomerActivityTab />));
		expect(await screen.findByText('filters.allTypes')).toBeInTheDocument();
		expect(screen.getByText('tab.title')).toBeInTheDocument();
		expect(CustomerApi.getCustomerSubscriptions).not.toHaveBeenCalled();
		expect(WalletApi.getCustomerWallets).not.toHaveBeenCalled();
		expect(InvoiceApi.listInvoices).not.toHaveBeenCalled();
	});
});
