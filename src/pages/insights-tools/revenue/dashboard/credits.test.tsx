import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import ReportsApi from '@/api/ReportsApi';
import { ReportColumn, ReportQueryRequest, ReportQueryResult } from '@/types/dto/Reports';
import { renderWithProviders } from '../reports/testUtils';
import CreditsTab from './CreditsTab';
import { DashboardControls } from './queries';

const NOW = new Date('2026-10-15T12:00:00Z');
const controls: DashboardControls = {
	preset: 'this_year',
	compare: 'previous_period',
	currency: 'usd',
	range: '2026-01-01..2026-10-16',
	now: NOW,
};

type Col = [string, ReportColumn['role']];
const res = (cols: Col[], rows: string[][]): ReportQueryResult => ({
	columns: cols.map(([name, role]) => ({ name, role, type: role === 'dimension' ? 'string' : 'decimal' })),
	rows,
	meta: { query_source: 'test' },
});
const D = (n: string): Col => [n, 'dimension'];
const M = (n: string): Col => [n, 'metric'];

const report = (key: string, req: ReportQueryRequest): ReportQueryResult => {
	if (key === 'credit_topups' && req.shape === 'breakdown')
		return res(
			[D('transaction_reason'), D('currency'), M('credit_topups')],
			[
				['PURCHASED_CREDIT_DIRECT', 'usd', '3000'],
				['PURCHASED_CREDIT_INVOICED', 'usd', '2000'],
				['SUBSCRIPTION_CREDIT_GRANT', 'usd', '3000'],
				['FREE_CREDIT_GRANT', 'usd', '1500'],
				['PURCHASED_CREDIT_BONUS', 'usd', '500'],
				['PURCHASED_CREDIT_DIRECT', 'eur', '99999'],
			],
		);
	if (key === 'credit_topups')
		return res(
			[D('bucket'), D('currency'), M('credit_topups')],
			[
				['2026-01-01T00:00:00Z', 'usd', '6000'],
				['2026-02-01T00:00:00Z', 'usd', '4000'],
			],
		);
	if (key === 'credit_consumption')
		return res(
			[D('bucket'), D('credit_type'), D('currency'), M('credit_consumption')],
			[
				['2026-01-01T00:00:00Z', 'paid', 'usd', '1500'],
				['2026-01-01T00:00:00Z', 'free', 'usd', '1000'],
				['2026-02-01T00:00:00Z', 'paid', 'usd', '3500'],
				['2026-02-01T00:00:00Z', 'free', 'usd', '1500'],
			],
		);
	if (key === 'events_volume')
		return res(
			[D('bucket'), M('events_volume')],
			[
				['2026-10-09T00:00:00Z', '3000000'],
				['2026-10-10T00:00:00Z', '4000000'],
			],
		);
	return res([], []);
};

const counts = res(
	[D('transaction_reason'), D('currency'), M('m0')],
	[
		['PURCHASED_CREDIT_DIRECT', 'usd', '3'],
		['PURCHASED_CREDIT_INVOICED', 'usd', '2'],
		['SUBSCRIPTION_CREDIT_GRANT', 'usd', '1'],
		['FREE_CREDIT_GRANT', 'usd', '4'],
		['PURCHASED_CREDIT_BONUS', 'usd', '1'],
	],
);

const mockApi = (empty = false) => {
	const run = vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key, req) => {
		const r = report(key, req);
		return empty ? { ...r, rows: [] } : r;
	});
	const ds = vi.spyOn(ReportsApi, 'runDataset').mockImplementation(async () => (empty ? { ...counts, rows: [] } : counts));
	return { run, ds };
};

const panel = (name: string) => screen.getByRole('region', { name });

describe('credits tab', () => {
	afterEach(() => vi.restoreAllMocks());

	it('renders every panel from responses', async () => {
		mockApi();
		renderWithProviders(<CreditsTab controls={controls} goTo={vi.fn()} />);

		const flow = await screen.findByRole('region', { name: 'Credit consumption vs. top-ups' });
		expect(await within(flow).findByText('10,000')).toBeInTheDocument();
		expect(within(flow).getByText('7,500')).toBeInTheDocument();
		expect(within(flow).getByText('+2,500')).toBeInTheDocument();
		expect(within(flow).queryByText('$10,000')).not.toBeInTheDocument();

		const reasons = panel('Top-ups by reason');
		await waitFor(() => expect(within(reasons).getByText('11')).toBeInTheDocument());
		expect(within(reasons).getByText('10,000')).toBeInTheDocument();
		expect(within(reasons).getByText('50.0%')).toBeInTheDocument();
		expect(within(reasons).getByText('5K · 5 top-ups')).toBeInTheDocument();
		expect(within(reasons).getByText('500 · 1 top-up')).toBeInTheDocument();
		expect(within(reasons).getAllByText('Subscription grant').length).toBeGreaterThan(0);

		const events = panel('Events volume');
		expect(within(events).getByText('Last 7 days')).toBeInTheDocument();
		await waitFor(() => expect(within(events).getByText('7M')).toBeInTheDocument());
		expect(within(events).getByText('1M')).toBeInTheDocument();
	});

	it('sends the expected requests', async () => {
		const { run, ds } = mockApi();
		renderWithProviders(<CreditsTab controls={controls} goTo={vi.fn()} />);
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith('events_volume', { shape: 'timeseries', grain: 'day', range: '2026-10-08..2026-10-15' }),
		);
		expect(run).toHaveBeenCalledWith('credit_topups', { shape: 'timeseries', grain: 'month', range: '2026-01-01..2026-10-16' });
		expect(run).toHaveBeenCalledWith('credit_consumption', {
			shape: 'timeseries',
			grain: 'month',
			dimensions: ['credit_type'],
			range: '2026-01-01..2026-10-16',
		});
		expect(run).toHaveBeenCalledWith('credit_topups', {
			shape: 'breakdown',
			dimensions: ['transaction_reason'],
			range: '2026-01-01..2026-10-16',
		});
		expect(ds).toHaveBeenCalledWith(
			expect.objectContaining({
				dataset: 'wallet_transactions',
				measures: [{ agg: 'count' }],
				dimensions: ['transaction_reason', 'currency'],
				filters: expect.arrayContaining([
					{ field: 'type', op: 'eq', value: ['credit'] },
					{ field: 'transaction_status', op: 'eq', value: ['completed'] },
				]),
				time: expect.objectContaining({ field: 'created_at', range: '2026-01-01..2026-10-16' }),
			}),
		);

		const flow = panel('Credit consumption vs. top-ups');
		fireEvent.click(within(flow).getByRole('button', { name: 'Day' }));
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith('credit_consumption', {
				shape: 'timeseries',
				grain: 'day',
				dimensions: ['credit_type'],
				range: '2026-01-01..2026-10-16',
			}),
		);
	});

	it('table view has a total row and CSV', async () => {
		mockApi();
		renderWithProviders(<CreditsTab controls={controls} goTo={vi.fn()} />);
		const flow = await screen.findByRole('region', { name: 'Credit consumption vs. top-ups' });
		await within(flow).findByText('+2,500');
		fireEvent.click(within(flow).getByRole('button', { name: 'Table' }));
		const total = within(flow).getByText('Total').closest('tr')!;
		expect(within(total).getByText('10,000')).toBeInTheDocument();
		expect(within(total).getByText('+2,500')).toBeInTheDocument();
		expect(within(flow).getByText('-1,000')).toBeInTheDocument();
		expect(within(flow).getByRole('button', { name: /download csv/i })).toBeEnabled();
	});

	it('shows empty states with no data', async () => {
		mockApi(true);
		renderWithProviders(<CreditsTab controls={controls} goTo={vi.fn()} />);
		await waitFor(() => expect(screen.getAllByText('No data for this period').length).toBe(3));
	});
});
