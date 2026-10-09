import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import ActivityFilterBar from './ActivityFilterBar';
import { defaultFilters } from './filterState';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (typeof o?.defaultValue === 'string' ? o.defaultValue : k) }),
}));

const wrap = (ui: React.ReactNode) => (
	<QueryClientProvider client={new QueryClient()}>
		<MemoryRouter>{ui}</MemoryRouter>
	</QueryClientProvider>
);

describe('ActivityFilterBar', () => {
	it('shows the five pills and Clear, with no query-builder chrome', () => {
		render(wrap(<ActivityFilterBar value={defaultFilters()} onChange={vi.fn()} onClear={vi.fn()} />));
		for (const k of ['filters.entityType', 'filters.entity', 'filters.actor', 'filters.action', 'filters.date', 'filters.clear']) {
			expect(screen.getByText(k)).toBeInTheDocument();
		}
		expect(screen.queryByText(/^where$/i)).not.toBeInTheDocument();
	});
	it('disables the entity pill until a type is picked', () => {
		render(wrap(<ActivityFilterBar value={defaultFilters()} onChange={vi.fn()} onClear={vi.fn()} />));
		expect(screen.getByPlaceholderText('filters.pickTypeFirst')).toBeDisabled();
	});
	it('shows a removable customer chip when seeded from the URL', () => {
		const onChange = vi.fn();
		render(wrap(<ActivityFilterBar value={defaultFilters({ customerId: 'cust_01HX4497MN00' })} onChange={onChange} onClear={vi.fn()} />));
		screen.getByRole('button', { name: 'filters.removeCustomer' }).click();
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ customerId: '' }));
	});
	it('shows the default last-30-days range instead of the empty placeholder', () => {
		render(wrap(<ActivityFilterBar value={defaultFilters()} onChange={vi.fn()} onClear={vi.fn()} />));
		expect(screen.queryByText('Select Range')).not.toBeInTheDocument();
	});
});
