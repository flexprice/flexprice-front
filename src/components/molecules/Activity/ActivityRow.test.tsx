import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import ActivityRow from './ActivityRow';
import useEntityRef from '@/hooks/useEntityRef';
import { ActivityItem } from '@/types/dto/ActivityLog';

vi.mock('@/hooks/useEntityRef', () => ({ default: vi.fn(() => ({ data: undefined, isLoading: true })) }));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) => {
			if (key === 'row.changes') return opts?.count === 1 ? '1 change' : `${opts?.count} changes`;
			if (key === 'row.created') return 'Created';
			if (key === 'row.deleted') return 'Deleted';
			if (typeof opts?.defaultValue === 'string')
				return opts.defaultValue.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(opts[k] ?? ''));
			return key;
		},
	}),
}));

const wrap = (ui: React.ReactNode) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
		<MemoryRouter>{ui}</MemoryRouter>
	</QueryClientProvider>
);

const item: ActivityItem = {
	id: 'act_1',
	entity_type: 'subscription',
	entity_id: 'subs_01HXABCDEF',
	entity_label: 'growth-acme',
	action: 'subscription.paused',
	actor: { type: 'user', id: 'user_1', label: 'Alice' },
	source: 'dashboard',
	occurred_at: '2026-10-03T09:00:00Z',
	changes: { subscription_status: { from: 'active', to: 'paused', label: 'Status', format: 'enum' } },
	display: {
		summary: 'Alice paused growth-acme',
		entity_label: 'growth-acme',
		parts: { actor: 'Alice', verb: 'paused', entity_type: 'subscription', entity: 'growth-acme' },
	},
};

describe('ActivityRow', () => {
	it('calls onOpen with the id on click', () => {
		const onOpen = vi.fn();
		render(wrap(<ActivityRow item={item} onOpen={onOpen} />));
		screen.getByRole('button', { name: /Alice paused subscription growth-acme/ }).click();
		expect(onOpen).toHaveBeenCalledWith('act_1');
	});

	it('shows the short id, not the raw id, when the label is the id', () => {
		const raw = {
			...item,
			entity_id: 'subs_01HX7KQ2M9RQ',
			entity_label: 'subs_01HX7KQ2M9RQ',
			display: { ...item.display, parts: { ...item.display.parts, entity: 'subs_01HX7KQ2M9RQ' } },
		};
		render(wrap(<ActivityRow item={raw} onOpen={vi.fn()} />));
		expect(screen.getAllByText(/subs_…Q2M9RQ/).length).toBeGreaterThan(0);
		expect(screen.queryByText(/subs_01HX7KQ2M9RQ/)).not.toBeInTheDocument();
	});

	it('shows the summary and a change count, never an inline diff', () => {
		render(wrap(<ActivityRow item={item} onOpen={vi.fn()} />));
		expect(screen.getByText('Alice paused subscription growth-acme')).toBeInTheDocument();
		expect(screen.getByText('1 change')).toBeInTheDocument();
		expect(screen.queryByText('→')).not.toBeInTheDocument();
	});
	it('pluralises the change count', () => {
		const many = {
			...item,
			changes: {
				a: { from: 1, to: 2, label: 'A', format: 'text' },
				b: { from: 1, to: 2, label: 'B', format: 'text' },
			},
		};
		render(wrap(<ActivityRow item={many} onOpen={vi.fn()} />));
		expect(screen.getByText('2 changes')).toBeInTheDocument();
	});
	it('counts a redacted change without showing values', () => {
		render(
			wrap(<ActivityRow item={{ ...item, changes: { tax_id: { redacted: true, label: 'Tax id', format: 'text' } } }} onOpen={vi.fn()} />),
		);
		expect(screen.getByText('1 change')).toBeInTheDocument();
	});
	it('says Created or Deleted for those rows', () => {
		const created = { ...item, action: 'subscription.created', changes: undefined, snapshot: { name: 'x' } };
		const { unmount } = render(wrap(<ActivityRow item={created} onOpen={vi.fn()} />));
		expect(screen.getByText('Created')).toBeInTheDocument();
		unmount();
		render(wrap(<ActivityRow item={{ ...item, action: 'subscription.deleted', changes: undefined }} onOpen={vi.fn()} />));
		expect(screen.getByText('Deleted')).toBeInTheDocument();
	});

	it('never looks up related records: the list stays free of per-row requests', () => {
		vi.mocked(useEntityRef).mockClear();
		const rich = {
			...item,
			entity_type: 'price',
			entity_id: 'price_01HX7KQ2M9RQ',
			entity_label: 'price_01HX7KQ2M9RQ',
			customer_id: 'cust_01HXAAAAAAAA',
			snapshot: { entity_type: 'PLAN', entity_id: 'plan_01HX7KQ2M9RQ' },
			display: { ...item.display, parts: { ...item.display.parts, entity: 'price_01HX7KQ2M9RQ' } },
		};
		render(wrap(<ActivityRow item={rich} onOpen={vi.fn()} />));
		expect(useEntityRef).not.toHaveBeenCalled();
		expect(screen.queryByText(/cust_…/)).not.toBeInTheDocument();
		expect(screen.queryByText(/plan_…/)).not.toBeInTheDocument();
	});
});
