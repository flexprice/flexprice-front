import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ActivityApi from '@/api/ActivityApi';
import ActivityDetailSheet from './ActivityDetailSheet';
import { ActivityItem } from '@/types/dto/ActivityLog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) =>
			typeof opts?.defaultValue === 'string' ? opts.defaultValue.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(opts[k] ?? '')) : key,
	}),
}));

const item: ActivityItem = {
	id: 'act_9',
	entity_type: 'subscription',
	entity_id: 'subs_01HXABCDEF',
	entity_label: 'growth-acme',
	action: 'subscription.plan_changed',
	actor: { type: 'api_key', id: 'secret_1', label: 'Billing Sync', user_id: 'user_2' },
	source: 'api',
	customer_id: 'cust_01HXABCDEF',
	request_id: 'req_1',
	occurred_at: '2026-10-03T05:12:17Z',
	changes: { plan_id: { from: 'plan_01A', to: 'plan_01B', label: 'Plan', format: 'ref:plan' } },
	metadata: { proration_amount: { value: '42.5', label: 'Proration amount', format: 'money' } },
	display: {
		summary: 'Billing Sync changed the plan on growth-acme',
		entity_label: 'growth-acme',
		parts: { actor: 'Billing Sync', verb: 'plan_changed', entity_type: 'subscription', entity: 'growth-acme' },
	},
};

const wrap = (ui: React.ReactNode) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
		<MemoryRouter>{ui}</MemoryRouter>
	</QueryClientProvider>
);

describe('ActivityDetailSheet', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('renders the five sections from a loaded item and queries related changes by request id', async () => {
		const get = vi.spyOn(ActivityApi, 'get');
		const list = vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [], has_more: false });
		render(wrap(<ActivityDetailSheet open id='act_9' onClose={vi.fn()} loaded={[item]} />));
		expect(screen.getByText('Billing Sync plan changed subscription growth-acme')).toBeInTheDocument();
		expect(screen.getByText('Billing Sync')).toBeInTheDocument();
		expect(screen.getByText('req_1')).toBeInTheDocument();
		expect(screen.getByText('Plan')).toBeInTheDocument();
		expect(screen.getByText('Proration amount')).toBeInTheDocument();
		await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ request_id: 'req_1' })));
		expect(get).not.toHaveBeenCalled();
	});

	it('fetches by id when the item is not in the loaded page', async () => {
		const get = vi.spyOn(ActivityApi, 'get').mockResolvedValue(item);
		vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [], has_more: false });
		render(wrap(<ActivityDetailSheet open id='act_9' onClose={vi.fn()} loaded={[]} />));
		await waitFor(() => expect(screen.getByText('Billing Sync plan changed subscription growth-acme')).toBeInTheDocument());
		expect(get).toHaveBeenCalledWith('act_9');
	});

	it('fetches by id when not loaded and shows retention message on 404', async () => {
		vi.spyOn(ActivityApi, 'get').mockRejectedValue({ response: { status: 404 } });
		render(wrap(<ActivityDetailSheet open id='act_old' onClose={vi.fn()} />));
		await waitFor(() => expect(screen.getByText(/older than the retention window/i)).toBeInTheDocument());
	});

	it('treats the shared axios client 404 rejection shape as past retention', async () => {
		const err = Object.assign(new Error('Not Found (404)'), { status: 404 });
		vi.spyOn(ActivityApi, 'get').mockRejectedValue(err);
		render(wrap(<ActivityDetailSheet open id='act_old' onClose={vi.fn()} />));
		await waitFor(() => expect(screen.getByText(/older than the retention window/i)).toBeInTheDocument());
	});

	it('shows the generic error for non-404 failures', async () => {
		vi.spyOn(ActivityApi, 'get').mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }));
		render(wrap(<ActivityDetailSheet open id='act_x' onClose={vi.fn()} />));
		await waitFor(() => expect(screen.getByText('list.error')).toBeInTheDocument());
		expect(screen.queryByText(/older than the retention window/i)).not.toBeInTheDocument();
	});

	it('shows the eyebrow with the short activity id and an entity row in Context', async () => {
		const long: ActivityItem = { ...item, id: 'act_01HXB0000004F', entity_id: 'subs_01HX7KQ2M9RQ' };
		vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [], has_more: false });
		render(wrap(<ActivityDetailSheet open id='act_01HXB0000004F' onClose={vi.fn()} loaded={[long]} />));
		expect(await screen.findByText(/act_…00004F/)).toBeInTheDocument();
		expect(screen.getByText('Context')).toBeInTheDocument();
		expect(screen.getAllByText(/subs_…Q2M9RQ/).length).toBeGreaterThan(0);
	});

	it('lists the owning plan in Context for a price', async () => {
		const price: ActivityItem = {
			...item,
			id: 'act_p1',
			entity_type: 'price',
			entity_id: 'price_01HXABCDEF',
			action: 'price.created',
			changes: undefined,
			snapshot: { entity_type: 'PLAN', entity_id: 'plan_01HX7KQ2M9RQ' },
			display: {
				...item.display,
				parts: { ...item.display.parts, verb: 'created', entity_type: 'price', entity: 'Storage' },
			},
		};
		vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [], has_more: false });
		render(wrap(<ActivityDetailSheet open id='act_p1' onClose={vi.fn()} loaded={[price]} />));
		expect((await screen.findAllByText(/plan_…Q2M9RQ/)).length).toBeGreaterThan(0);
		expect(screen.queryByText(/plan_01HX7KQ2M9RQ/)).not.toBeInTheDocument();
	});

	it('keeps the eyebrow and title in a fixed header, with only the body scrolling', async () => {
		vi.spyOn(ActivityApi, 'list').mockResolvedValue({ items: [], has_more: false });
		render(wrap(<ActivityDetailSheet open id='act_9' onClose={vi.fn()} loaded={[item]} />));
		const title = await screen.findByText('Billing Sync plan changed subscription growth-acme');
		const body = screen.getByTestId('activity-sheet-body');
		expect(body.className).toMatch(/overflow-y-auto/);
		expect(body).not.toContainElement(title);
		expect(body).not.toContainElement(screen.getByText(/Activity · act_9/));
		expect(body).toContainElement(screen.getByText('Who'));
	});
});
