import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen, within } from '@testing-library/react';
import ReportsApi from '@/api/ReportsApi';
import { DatasetDefinition, ReportColumn, ReportQueryRequest, ReportQueryResult } from '@/types/dto/Reports';
import { renderWithProviders } from '../reports/testUtils';
import PaymentsTab from './PaymentsTab';
import { DashboardControls } from './queries';
import ReceivablesTab from './ReceivablesTab';

const NOW = new Date('2026-10-15T12:00:00Z');
const controls = (currency = 'usd'): DashboardControls => ({
	preset: 'this_year',
	compare: 'previous_period',
	currency,
	range: '2026-01-01..2026-10-16',
	now: NOW,
});

type Col = [string, ReportColumn['role']];
const res = (cols: Col[], rows: string[][]): ReportQueryResult => ({
	columns: cols.map(([name, role]) => ({ name, role, type: role === 'dimension' ? 'string' : 'decimal' })),
	rows,
	meta: { query_source: 'test' },
});
const D = (n: string): Col => [n, 'dimension'];
const M = (n: string): Col => [n, 'metric'];

interface Opts {
	zero?: boolean;
	noMedian?: boolean;
	noPayments?: boolean;
	overdueFails?: boolean;
}

const report = (key: string, req: ReportQueryRequest, { zero, noPayments }: Opts): ReportQueryResult => {
	const v = (s: string) => (zero ? '0' : s);
	if (noPayments && key === 'days_to_pay') return res([M('days_to_pay'), M('days_to_pay_prev')], []);
	if (key === 'total_receivables') return res([D('currency'), M('total_receivables')], [['usd', v('1000')]]);
	if (key === 'receivables_aging' && req.dimensions?.length === 2)
		return res(
			[D('aging_bucket'), D('customer_id'), D('currency'), M('receivables_aging')],
			[
				['Current', 'cus_1', 'usd', '100'],
				['1-30', 'cus_1', 'usd', '200'],
				['90+', 'cus_1', 'usd', '100'],
				['31-60', 'cus_2', 'usd', '100'],
				['No due date', 'cus_2', 'usd', '50'],
			],
		);
	if (key === 'receivables_aging')
		return res(
			[D('aging_bucket'), D('currency'), M('receivables_aging')],
			[
				['Current', 'usd', v('400')],
				['1-30', 'usd', v('300')],
				['31-60', 'usd', v('100')],
				['90+', 'usd', v('100')],
				['No due date', 'usd', v('100')],
			],
		);
	if (key === 'days_to_pay') return res([M('days_to_pay'), M('days_to_pay_prev')], [['19.8', '26.6']]);
	return res([], []);
};

const dataset = (def: DatasetDefinition, { noMedian, noPayments }: Opts): ReportQueryResult => {
	const dims = def.dimensions ?? [];
	if (noPayments) {
		if (dims.includes('payment_speed')) return res([D('payment_speed'), D('currency'), M('m0')], []);
		if (dims.includes('customer')) return res([D('customer'), D('customer_label'), D('currency'), M('m0'), M('m1'), M('m2')], []);
		if (def.time.grain === 'month') return res([D('bucket'), D('currency'), M('m0'), M('m1'), M('m2')], []);
		return def.measures[0].agg === 'median' ? res([D('currency'), M('m0')], []) : res([D('currency'), M('m0'), M('m0_prev')], []);
	}
	if (def.filters?.some((f) => f.field === 'days_overdue'))
		return res(
			[D('customer'), D('customer_label'), D('currency'), M('m0'), M('m1'), M('m2')],
			[
				['cus_1', 'Northwind Labs', 'usd', '300', '3', '95'],
				['cus_2', 'Bluefin Analytics', 'usd', '100', '1', '45'],
			],
		);
	if (dims.includes('payment_speed'))
		return res(
			[D('payment_speed'), D('currency'), M('m0')],
			[
				['0-7', 'usd', '30'],
				['8-30', 'usd', '60'],
				['30+', 'usd', '30'],
				['8-30', 'eur', '999'],
			],
		);
	if (dims.includes('customer'))
		return res(
			[D('customer'), D('customer_label'), D('currency'), M('m0'), M('m1'), M('m2')],
			[
				['cus_9', 'Torrent Games', 'usd', '25.3', '27', '5000'],
				['cus_8', 'Juniper AI', 'usd', '25.2', '23', '4000'],
			],
		);
	if (def.time.grain === 'month')
		return res(
			[D('bucket'), D('currency'), M('m0'), M('m1'), M('m2')],
			[
				['2026-01-01', 'usd', '20', '15', '50'],
				['2026-02-01', 'usd', '18', '14', '70'],
			],
		);
	if (def.measures[0].agg === 'median') return res([D('currency'), M('m0')], noMedian ? [] : [['usd', '15']]);
	return res([D('currency'), M('m0'), M('m0_prev')], [['usd', '120', '100']]);
};

const mockApi = (opts: Opts = {}) => {
	const run = vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key, req) => report(key, req, opts));
	const ds = vi.spyOn(ReportsApi, 'runDataset').mockImplementation(async (def) => {
		if (opts.overdueFails && def.filters?.some((f) => f.field === 'days_overdue')) throw new Error('boom');
		return dataset(def, opts);
	});
	return { run, ds };
};

const panel = (name: string) => screen.getByRole('region', { name });
const cellsOf = (row: HTMLElement) =>
	within(row)
		.getAllByRole('cell')
		.map((c) => c.textContent);

describe('receivables tab', () => {
	afterEach(() => vi.restoreAllMocks());

	it('renders aging, overdue by customer and the overdue table', async () => {
		mockApi();
		renderWithProviders(<ReceivablesTab controls={controls()} goTo={vi.fn()} />);

		const aging = panel('Receivables aging');
		expect(await within(aging).findByText('$1,000')).toBeInTheDocument();
		expect(within(aging).getByText('$500')).toBeInTheDocument();
		expect(await within(aging).findByText('50.0% of outstanding, 2 customers')).toBeInTheDocument();
		// Current maps to Not yet due.
		expect(within(aging).getAllByText('Not yet due').length).toBeGreaterThan(0);
		expect(within(aging).queryByText('Current')).not.toBeInTheDocument();
		expect(within(aging).getByText('40.0%')).toBeInTheDocument();
		expect(within(aging).getByText(/date range and comparison don't apply/)).toBeInTheDocument();

		const byCustomer = panel('Overdue by customer');
		expect(await within(byCustomer).findByText('Northwind Labs')).toBeInTheDocument();
		expect(within(byCustomer).getByText('$300')).toBeInTheDocument();

		const table = panel('Overdue customers');
		expect(await within(table).findByText('$400')).toBeInTheDocument();
		expect(cellsOf(within(table).getByText('Northwind Labs').closest('tr')!)).toEqual([
			'Northwind Labs',
			'3',
			'$300',
			'$400',
			'Jul 12, 2026 · 95d',
			'90+ days',
		]);
		expect(cellsOf(within(table).getByText('Bluefin Analytics').closest('tr')!)).toEqual([
			'Bluefin Analytics',
			'1',
			'$100',
			'$150',
			'Aug 31, 2026 · 45d',
			'31–60 days',
		]);
	});

	it('sends point-in-time windows without compare', async () => {
		const { run, ds } = mockApi();
		renderWithProviders(<ReceivablesTab controls={controls()} goTo={vi.fn()} />);
		await within(panel('Overdue customers')).findByText('$400');

		const reports = run.mock.calls.filter(([k]) => k === 'total_receivables' || k === 'receivables_aging');
		expect(reports.length).toBeGreaterThanOrEqual(3);
		for (const [, req] of reports) {
			expect(req.range).toBe('2026-10-15..2026-10-16');
			expect(req.compare).toBeUndefined();
		}
		const byCustomer = run.mock.calls.find(([k, r]) => k === 'receivables_aging' && r.dimensions?.length === 2)![1];
		expect(byCustomer.filters).toEqual([{ field: 'customer_id', op: 'in', value: ['cus_1', 'cus_2'] }]);
		const overdue = ds.mock.calls[0][0];
		expect(overdue.time).toMatchObject({ field: 'due_date', range: '2000-01-01..2026-10-16' });
		expect(overdue.compare).toBeUndefined();
		expect(overdue.filters).toEqual(
			expect.arrayContaining([
				{ field: 'days_overdue', op: 'gt', value: ['0'] },
				{ field: 'currency', op: 'eq', value: ['usd'] },
			]),
		);
	});

	it('shows no NaN when outstanding is zero', async () => {
		mockApi({ zero: true });
		const { container } = renderWithProviders(<ReceivablesTab controls={controls()} goTo={vi.fn()} />);
		expect(await within(panel('Receivables aging')).findByText('— of outstanding, 2 customers')).toBeInTheDocument();
		fireEvent.click(within(panel('Receivables aging')).getByRole('button', { name: 'Table' }));
		expect(within(panel('Receivables aging')).getByText('Total')).toBeInTheDocument();
		expect(container.textContent).not.toMatch(/NaN|Infinity/);
	});

	it('keeps the aging panel when the overdue list fails', async () => {
		mockApi({ overdueFails: true });
		renderWithProviders(<ReceivablesTab controls={controls()} goTo={vi.fn()} />);
		const aging = panel('Receivables aging');
		expect(await within(aging).findByText('50.0% of outstanding, — customers')).toBeInTheDocument();
		expect(within(aging).getByText('$1,000')).toBeInTheDocument();
		expect(within(aging).queryByRole('alert')).not.toBeInTheDocument();
		expect(within(panel('Overdue customers')).getByRole('alert')).toBeInTheDocument();
	});

	it('waits for a currency before listing customers', () => {
		const { ds, run } = mockApi();
		renderWithProviders(<ReceivablesTab controls={controls('')} goTo={vi.fn()} />);
		expect(ds).not.toHaveBeenCalled();
		expect(run.mock.calls.some(([, r]) => r.dimensions?.length === 2)).toBe(false);
	});
});

describe('payments tab', () => {
	afterEach(() => vi.restoreAllMocks());

	it('renders every panel from responses', async () => {
		mockApi();
		renderWithProviders(<PaymentsTab controls={controls()} goTo={vi.fn()} />);

		const days = panel('Days to pay over time');
		expect(await within(days).findByText('19.8 days')).toBeInTheDocument();
		expect(within(days).getByText('15.0 days')).toBeInTheDocument();
		expect(within(days).getByText('120')).toBeInTheDocument();
		expect(within(days).getByText('+20.0%')).toBeInTheDocument();
		expect(within(days).getByText('Period average (19.8 days)')).toBeInTheDocument();
		expect(within(days).getByText(/from issue to full payment/)).toBeInTheDocument();

		const speed = panel('Payment speed');
		expect(within(speed).getByText('60 · 50.0%')).toBeInTheDocument();
		expect(within(speed).getAllByText('30 · 25.0%')).toHaveLength(2);

		const slowest = panel('Slowest payers');
		expect(within(slowest).getByText('Torrent Games')).toBeInTheDocument();
		expect(within(slowest).getByText('25.3 days')).toBeInTheDocument();

		const table = panel('Payments by customer');
		expect(cellsOf(within(table).getByText('Torrent Games').closest('tr')!)).toEqual(['Torrent Games', '27', '$5,000', '25.3 days']);
		expect(within(table).getByRole('button', { name: 'Download CSV' })).toBeEnabled();
	});

	it('shows a dash when the median is empty', async () => {
		mockApi({ noMedian: true });
		renderWithProviders(<PaymentsTab controls={controls()} goTo={vi.fn()} />);
		const days = panel('Days to pay over time');
		await within(days).findByText('19.8 days');
		expect(within(days).getByText('—')).toBeInTheDocument();
	});

	it('explains when the selected range has no paid invoices', async () => {
		mockApi({ noPayments: true });
		renderWithProviders(<PaymentsTab controls={controls()} goTo={vi.fn()} />);
		const emptyMessage = 'No paid invoices in this date range. Try selecting a longer period.';
		for (const name of ['Days to pay over time', 'Payment speed', 'Slowest payers', 'Payments by customer']) {
			expect(await within(panel(name)).findByText(emptyMessage)).toBeInTheDocument();
		}
	});

	it('scopes the payers query to paid invoices in the page currency', async () => {
		const { ds } = mockApi();
		renderWithProviders(<PaymentsTab controls={controls()} goTo={vi.fn()} />);
		await within(panel('Payments by customer')).findByText('Torrent Games');
		const payers = ds.mock.calls.find(([d]) => d.dimensions?.includes('customer'))![0];
		expect(payers).toMatchObject({ sort: [{ field: 'm0', dir: 'desc' }], time: { field: 'paid_at', range: '2026-01-01..2026-10-16' } });
		expect(payers.filters).toEqual([
			{ field: 'days_to_pay', op: 'gte', value: ['0'] },
			{ field: 'currency', op: 'eq', value: ['usd'] },
		]);
	});
});
