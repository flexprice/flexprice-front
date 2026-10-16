import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import ReportsApi from '@/api/ReportsApi';
import CustomerApi from '@/api/CustomerApi';
import { ListCustomersResponse } from '@/types/dto/Customer';
import { DatasetDefinition, ReportColumn, ReportQueryRequest, ReportQueryResult } from '@/types/dto/Reports';
import { renderWithProviders } from '../reports/testUtils';
import OverviewTab from './OverviewTab';
import { DashboardControls } from './queries';
import RevenueTab from './RevenueTab';

const NOW = new Date('2026-10-15T12:00:00Z');
const controls = (compare: DashboardControls['compare'] = 'previous_period'): DashboardControls => ({
	preset: 'this_year',
	compare,
	currency: 'usd',
	range: '2026-01-01..2026-10-16',
	now: NOW,
});

type Col = [string, ReportColumn['role']];
const res = (cols: Col[], rows: string[][]): ReportQueryResult => ({
	columns: cols.map(([name, role]) => ({ name, role, type: role === 'dimension' ? 'string' : 'decimal' })),
	rows,
	meta: { query_source: 'test' },
});

// Drop prev columns without compare.
const compared = (cols: Col[], rows: string[][], compare: boolean) => {
	const keep = cols.map((c, i) => [c, i] as const).filter(([[n]]) => compare || !/_prev$|_change_pct$/.test(n));
	return res(
		keep.map(([c]) => c),
		rows.map((r) => keep.map(([, i]) => r[i])),
	);
};

const D = (n: string): Col => [n, 'dimension'];
const M = (n: string): Col => [n, 'metric'];
const IT = ['invoice_total', 'invoice_total_prev'].map(M);

const report = (key: string, req: ReportQueryRequest): ReportQueryResult => {
	const cmp = !!req.compare;
	const dim = req.dimensions?.[0];
	if (key === 'invoice_total' && req.shape === 'timeseries' && !dim)
		return compared(
			[D('bucket'), D('currency'), ...IT],
			[
				['2026-01-01T00:00:00Z', 'usd', '1000', '800'],
				['2026-02-01T00:00:00Z', 'usd', '500', '400'],
			],
			cmp,
		);
	if (key === 'invoice_total' && req.shape === 'timeseries')
		return res(
			[D('bucket'), D(dim!), D('currency'), M('invoice_total')],
			[
				['2026-01-01T00:00:00Z', dim === 'invoice_type' ? 'SUBSCRIPTION' : 'cus_1', 'usd', '1000'],
				['2026-02-01T00:00:00Z', dim === 'invoice_type' ? 'ONE_OFF' : 'cus_2', 'usd', '500'],
			],
		);
	if (key === 'invoice_total' && dim === 'invoice_type')
		return compared(
			[D('invoice_type'), D('currency'), ...IT],
			[
				['SUBSCRIPTION', 'usd', '900', '700'],
				['CREDIT', 'usd', '600', '500'],
			],
			cmp,
		);
	if (key === 'invoice_total' && dim === 'customer_id')
		return res(
			[D('customer_id'), D('currency'), M('invoice_total')],
			[
				['cus_1', 'usd', '1200'],
				['cus_2', 'usd', '300'],
			],
		);
	if (key === 'total_receivables') return res([D('currency'), M('total_receivables')], [['usd', '1000']]);
	if (key === 'receivables_aging')
		return res(
			[D('currency'), D('aging_bucket'), M('receivables_aging')],
			[
				['usd', 'Current', '600'],
				['usd', '1-30', '400'],
			],
		);
	if (key === 'days_to_pay') return compared([D('currency'), M('days_to_pay'), M('days_to_pay_prev')], [['usd', '19.8', '20']], cmp);
	if (key === 'credit_topups') return res([D('bucket'), D('currency'), M('credit_topups')], [['2026-01-01T00:00:00Z', 'usd', '8900000']]);
	if (key === 'credit_consumption')
		return res(
			[D('bucket'), D('credit_type'), D('currency'), M('credit_consumption')],
			[['2026-01-01T00:00:00Z', 'paid', 'usd', '6800000']],
		);
	return res([], []);
};

const dataset = (def: DatasetDefinition): ReportQueryResult => {
	if (def.dataset === 'invoice_lines')
		return compared(
			[D('bucket'), D('currency'), M('m0'), M('m0_prev')],
			[
				['2026-01-01T00:00:00Z', 'usd', '300', '200'],
				['2026-02-01T00:00:00Z', 'usd', '700', '100'],
			],
			!!def.compare,
		);
	if (def.time.grain) return res([D('bucket'), D('currency'), M('m0'), M('m1')], [['2026-01-01T00:00:00Z', 'usd', '20', '14']]);
	return res([D('currency'), M('m0')], [['usd', '15']]);
};

const mockApi = (empty = false) => {
	const empt = (r: ReportQueryResult) => (empty ? { ...r, rows: [] } : r);
	const run = vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key, req) => empt(report(key, req)));
	const ds = vi.spyOn(ReportsApi, 'runDataset').mockImplementation(async (def) => empt(dataset(def)));
	const cust = vi.spyOn(CustomerApi, 'getCustomersByFilters').mockResolvedValue({
		items: [
			{ id: 'cus_1', name: 'Northwind Labs' },
			{ id: 'cus_2', name: 'Bluefin Analytics' },
		],
		pagination: { total: 2, limit: 2, offset: 0 },
	} as unknown as ListCustomersResponse);
	return { run, ds, cust };
};

const panel = (name: string) => screen.getByRole('region', { name });

describe('dashboard tabs', () => {
	afterEach(() => vi.restoreAllMocks());

	it('overview renders every card from responses', async () => {
		mockApi();
		const goTo = vi.fn();
		renderWithProviders(<OverviewTab controls={controls()} goTo={goTo} />);

		const rev = await screen.findByRole('region', { name: 'Revenue over time' });
		expect(await within(rev).findByText('$1,500')).toBeInTheDocument();
		expect(within(rev).getByText('+25.0%')).toBeInTheDocument();
		expect(within(rev).getByText('$800')).toBeInTheDocument();
		expect(within(rev).getByText('$700')).toBeInTheDocument();
		expect(within(rev).getByText('Previous period')).toBeInTheDocument();

		const aging = panel('Receivables aging');
		expect(await within(aging).findByText('Not yet due')).toBeInTheDocument();
		expect(within(aging).getByText('$600')).toBeInTheDocument();
		expect(within(aging).getByText('$400 · 40.0%')).toBeInTheDocument();

		const dtp = panel('Days to pay over time');
		expect(await within(dtp).findByText('19.8 days')).toBeInTheDocument();
		expect(within(dtp).getByText('15.0 days')).toBeInTheDocument();

		const top = panel('Top 5 customers');
		expect(await within(top).findByText('Northwind Labs')).toBeInTheDocument();
		expect(within(top).getByText('$1.2K')).toBeInTheDocument();

		const credits = panel('Credit consumption vs. top-ups');
		expect(await within(credits).findByText('8.9M')).toBeInTheDocument();
		expect(within(credits).getByText('6.8M')).toBeInTheDocument();

		fireEvent.click(within(top).getByRole('button', { name: /View report/ }));
		expect(goTo).toHaveBeenCalledWith('customers');
	});

	it('top customers asks for the top 5 in the page currency', async () => {
		const { run } = mockApi();
		renderWithProviders(<OverviewTab controls={controls()} goTo={vi.fn()} />);
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith(
				'invoice_total',
				expect.objectContaining({
					shape: 'breakdown',
					dimensions: ['customer_id'],
					limit: 5,
					sort: [{ field: 'invoice_total', dir: 'desc' }],
					filters: [{ field: 'currency', op: 'eq', value: ['usd'] }],
				}),
			),
		);
	});

	it('revenue tab caps usage at revenue in the table view', async () => {
		const { ds } = mockApi();
		renderWithProviders(<RevenueTab controls={controls()} goTo={vi.fn()} />);
		const rev = await screen.findByRole('region', { name: 'Revenue over time' });
		await within(rev).findByText('$1,500');
		expect(ds).toHaveBeenCalledWith(
			expect.objectContaining({
				dataset: 'invoice_lines',
				measures: [{ agg: 'sum', field: 'amount' }],
				filters: [
					{ field: 'price_type', op: 'eq', value: ['USAGE'] },
					{ field: 'invoice_status', op: 'eq', value: ['FINALIZED'] },
				],
				time: expect.objectContaining({ field: 'billing_period', grain: 'month' }),
			}),
		);
		fireEvent.click(within(rev).getByRole('button', { name: 'Table' }));
		const feb = within(rev).getByText('Feb 2026').closest('tr')!;
		expect(
			within(feb)
				.getAllByRole('cell')
				.map((c) => c.textContent),
		).toEqual(['Feb 2026', '$500', '$0', '$500', '$400']);
		const total = within(rev).getByText('Total').closest('tr')!;
		expect(
			within(total)
				.getAllByRole('cell')
				.map((c) => c.textContent),
		).toEqual(['Total', '$800', '$700', '$1,500', '$1,200']);
	});

	it('group-by switch changes the request', async () => {
		const { run, cust } = mockApi();
		renderWithProviders(<RevenueTab controls={controls()} goTo={vi.fn()} />);
		const rev = await screen.findByRole('region', { name: 'Revenue over time' });
		fireEvent.click(await within(rev).findByRole('button', { name: 'Invoice type' }));
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith('invoice_total', expect.objectContaining({ shape: 'timeseries', dimensions: ['invoice_type'] })),
		);
		expect(await within(rev).findByText('Subscription')).toBeInTheDocument();

		fireEvent.click(within(rev).getByRole('button', { name: 'Customer' }));
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith('invoice_total', expect.objectContaining({ shape: 'timeseries', dimensions: ['customer_id'] })),
		);
		expect(await within(rev).findByText('Bluefin Analytics')).toBeInTheDocument();
		expect(cust).toHaveBeenCalledWith(expect.objectContaining({ customer_ids: ['cus_1', 'cus_2'] }));

		fireEvent.click(within(rev).getByRole('button', { name: 'Day' }));
		await waitFor(() => expect(run).toHaveBeenCalledWith('invoice_total', expect.objectContaining({ grain: 'day' })));
	});

	it('breakdown table shows share, previous and change with a total row', async () => {
		mockApi();
		renderWithProviders(<RevenueTab controls={controls()} goTo={vi.fn()} />);
		const table = await screen.findByRole('region', { name: 'Revenue breakdown' });
		const sub = (await within(table).findByText('Subscription')).closest('tr')!;
		expect(
			within(sub)
				.getAllByRole('cell')
				.map((c) => c.textContent),
		).toEqual(['Subscription', '60.0%', '$900', '$700', '+28.6%']);
		expect(within(table).getByText('Credit purchase')).toBeInTheDocument();
		const total = within(table).getByText('Total').closest('tr')!;
		expect(
			within(total)
				.getAllByRole('cell')
				.map((c) => c.textContent),
		).toEqual(['Total', '100.0%', '$1,500', '$1,200', '+25.0%']);
	});

	it('compare none hides previous line and columns', async () => {
		mockApi();
		renderWithProviders(<RevenueTab controls={controls('none')} goTo={vi.fn()} />);
		const table = await screen.findByRole('region', { name: 'Revenue breakdown' });
		await within(table).findByText('Subscription');
		expect(within(table).queryByText('Previous period')).not.toBeInTheDocument();
		expect(within(table).queryByText('Change')).not.toBeInTheDocument();
		const rev = panel('Revenue over time');
		await within(rev).findByText('$1,500');
		expect(within(rev).queryByText('Previous period')).not.toBeInTheDocument();
		expect(within(rev).queryByText('+25.0%')).not.toBeInTheDocument();
	});

	it('top customers waits for a resolved currency', async () => {
		const { run } = mockApi();
		renderWithProviders(<OverviewTab controls={{ ...controls(), currency: '' }} goTo={vi.fn()} />);
		await waitFor(() => expect(run).toHaveBeenCalledWith('credit_topups', expect.anything()));
		expect(run.mock.calls.some(([k, r]) => k === 'invoice_total' && r.dimensions?.[0] === 'customer_id')).toBe(false);
	});

	it('failed queries show an error instead of empty', async () => {
		mockApi();
		vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key, req) => {
			if (key === 'receivables_aging') throw new Error('boom');
			return report(key, req);
		});
		renderWithProviders(<OverviewTab controls={controls()} goTo={vi.fn()} />);
		const aging = panel('Receivables aging');
		expect(await within(aging).findByRole('alert')).toHaveTextContent('Could not load this report');
		expect(within(aging).queryByText('No data for this period')).not.toBeInTheDocument();
	});

	it('empty data shows the empty state', async () => {
		mockApi(true);
		renderWithProviders(<OverviewTab controls={controls()} goTo={vi.fn()} />);
		await waitFor(() => expect(screen.getAllByText('No data for this period')).toHaveLength(5));
	});
});
