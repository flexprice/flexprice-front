import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ActivityApi from '@/api/ActivityApi';
import ActivityList from './ActivityList';
import { ActivityItem } from '@/types/dto/ActivityLog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) => (typeof opts?.defaultValue === 'string' ? opts.defaultValue : key),
	}),
}));

const mk = (id: string, day: string): ActivityItem => ({
	id,
	entity_type: 'customer',
	entity_id: 'cust_1',
	entity_label: 'Acme',
	action: 'customer.updated',
	actor: { type: 'user', id: 'u', label: 'Alice' },
	source: 'dashboard',
	occurred_at: `${day}T10:00:00Z`,
	display: {
		summary: `row ${id}`,
		entity_label: 'Acme',
		parts: { actor: 'Alice', verb: 'updated', entity_type: 'customer', entity: 'Acme' },
	},
});

const wrap = (ui: React.ReactNode) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
		<MemoryRouter>{ui}</MemoryRouter>
	</QueryClientProvider>
);

describe('ActivityList', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('groups rows by day and appends on load more', async () => {
		const list = vi
			.spyOn(ActivityApi, 'list')
			.mockResolvedValueOnce({ items: [mk('a', '2026-10-03'), mk('b', '2026-10-02')], next_cursor: 'c1', has_more: true })
			.mockResolvedValueOnce({ items: [mk('c', '2026-10-01')], has_more: false });
		render(wrap(<ActivityList scope={{ kind: 'customer', customerId: 'cust_1' }} pageSize={2} />));
		const rows = () => screen.getAllByText('Alice updated customer Acme');
		await waitFor(() => expect(rows()).toHaveLength(2));
		expect(screen.getAllByTestId('activity-day')).toHaveLength(2);
		screen.getByRole('button', { name: /list.loadMore/i }).click();
		await waitFor(() => expect(rows()).toHaveLength(3));
		expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ customer_id: 'cust_1', cursor: 'c1', limit: 2 }));
	});

	it('uses distinct query keys per scope', async () => {
		const list = vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [], has_more: false });
		render(
			wrap(
				<>
					<ActivityList scope={{ kind: 'entity', entityType: 'wallet', entityId: 'wallet_1' }} />
					<ActivityList scope={{ kind: 'entity', entityType: 'wallet', entityId: 'wallet_2' }} />
				</>,
			),
		);
		await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
		expect(list.mock.calls.map((c) => c[0].entity_id).sort()).toEqual(['wallet_1', 'wallet_2']);
	});

	it('shows the empty message when there are no rows', async () => {
		vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [], has_more: false });
		render(wrap(<ActivityList scope={{ kind: 'all' }} emptyMessage='Nothing yet' />));
		await waitFor(() => expect(screen.getByText('Nothing yet')).toBeInTheDocument());
	});

	it('closes the sheet and removes the activity param', async () => {
		vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [mk('a', '2026-10-03')], has_more: false });
		let search = '';
		const Spy = () => {
			search = useLocation().search;
			return null;
		};
		render(
			<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
				<MemoryRouter initialEntries={['/activity?activity=a&customer_id=cust_1']}>
					<ActivityList scope={{ kind: 'all' }} />
					<Spy />
				</MemoryRouter>
			</QueryClientProvider>,
		);
		await screen.findByRole('dialog');
		await userEvent.setup().click(screen.getByRole('button', { name: /close/i }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(search).toBe('?customer_id=cust_1');
	});
});
