import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { User } from 'lucide-react';
import { EntityRef, FormattedValue } from './formatters';
import * as registry from './entityRegistry';

const STRINGS: Record<string, string> = { 'ref.deleted': 'deleted', 'value.on': 'On', 'value.off': 'Off' };
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => STRINGS[key] ?? key }),
}));

const wrap = (ui: React.ReactNode) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
		<MemoryRouter>{ui}</MemoryRouter>
	</QueryClientProvider>
);

describe('FormattedValue', () => {
	it('renders money with sibling currency', () => {
		render(wrap(<FormattedValue value='42.5' format='money' siblings={{ currency: 'USD' }} />));
		expect(screen.getByText(/42\.50/)).toBeInTheDocument();
		expect(screen.getByText(/USD/)).toBeInTheDocument();
	});
	it('renders boolean as On/Off', () => {
		render(wrap(<FormattedValue value={true} format='boolean' />));
		expect(screen.getByText('On')).toBeInTheDocument();
	});
	it('unknown format falls back to text', () => {
		render(wrap(<FormattedValue value='x' format='wat' />));
		expect(screen.getByText('x')).toBeInTheDocument();
	});
});

describe('EntityRef', () => {
	it('links to the entity when it resolves', async () => {
		vi.spyOn(registry, 'getEntityDef').mockReturnValue({
			icon: User,
			route: (id) => `/billing/customers/${id}`,
			resolve: async () => ({ label: 'Acme', exists: true }),
		});
		render(wrap(<EntityRef type='customer' id='cust_01HXABCDEF' />));
		await waitFor(() => expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/billing/customers/cust_01HXABCDEF'));
	});
	it('shows short id and deleted chip only on a 404', async () => {
		vi.spyOn(registry, 'getEntityDef').mockReturnValue({
			icon: User,
			route: () => null,
			resolve: async () => {
				throw Object.assign(new Error('not found'), { status: 404 });
			},
		});
		render(wrap(<EntityRef type='customer' id='cust_01HXABCDEF' />));
		await waitFor(() => expect(screen.getByText('deleted')).toBeInTheDocument());
		expect(screen.getByText('cust_…ABCDEF')).toBeInTheDocument();
	});

	it('shows no deleted chip for an unknown entity type', async () => {
		vi.spyOn(registry, 'getEntityDef').mockReturnValue(undefined);
		render(wrap(<EntityRef type='mystery' id='mys_01HXABCDEF' />));
		await waitFor(() => expect(screen.getByText('mys_…ABCDEF')).toBeInTheDocument());
		expect(screen.queryByText('deleted')).not.toBeInTheDocument();
	});

	it('shows no deleted chip on a transient (non-404) error', async () => {
		vi.spyOn(registry, 'getEntityDef').mockReturnValue({
			icon: User,
			route: () => null,
			resolve: async () => {
				throw Object.assign(new Error('server error'), { status: 500 });
			},
		});
		render(wrap(<EntityRef type='customer' id='cust_01HXABCDEF' />));
		await waitFor(() => expect(screen.getByText('cust_…ABCDEF')).toBeInTheDocument());
		expect(screen.queryByText('deleted')).not.toBeInTheDocument();
	});
});
