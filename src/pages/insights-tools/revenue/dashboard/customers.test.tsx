import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen, within } from '@testing-library/react';
import ReportsApi from '@/api/ReportsApi';
import CustomerApi from '@/api/CustomerApi';
import { ListCustomersResponse } from '@/types/dto/Customer';
import { DatasetDefinition, ReportColumn, ReportQueryRequest, ReportQueryResult } from '@/types/dto/Reports';
import { renderWithProviders } from '../reports/testUtils';
import CustomersTab, { CUSTOMER_LIMIT } from './CustomersTab';
import { DashboardControls } from './queries';

const NOW = new Date('2026-10-15T12:00:00Z');
const controls = (compare: DashboardControls['compare'] = 'previous_period', currency = 'usd'): DashboardControls => ({
	preset: 'this_year',
	compare,
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

const withPrev = (cmp: boolean, cols: Col[], rows: string[][]) =>
	cmp
		? res(cols, rows)
		: res(
				cols.slice(0, -1),
				rows.map((r) => r.slice(0, -1)),
			);

const DEFAULT_REVENUE = [
	['cus_1', 'usd', '1000', '800'],
	['cus_2', 'usd', '300', '0'],
	['cus_3', 'usd', '50', '100'],
];

const report = (key: string, req: ReportQueryRequest, revenueRows: string[][]): ReportQueryResult => {
	const cmp = !!req.compare;
	if (key === 'invoice_total')
		return withPrev(cmp, [D('customer_id'), D('currency'), M('invoice_total'), M('invoice_total_prev')], revenueRows);
	if (key === 'arpu') return withPrev(cmp, [D('currency'), M('arpu'), M('arpu_prev')], [['usd', '450', '400']]);
	return res([], []);
};

const dataset = (def: DatasetDefinition): ReportQueryResult => {
	if (def.dataset === 'invoice_lines')
		return res(
			[D('customer'), D('customer_label'), D('currency'), M('m0')],
			[
				['cus_1', 'Northwind', 'usd', '400'],
				['cus_2', 'Bluefin', 'usd', '500'],
			],
		);
	return withPrev(!!def.compare, [D('currency'), M('m0'), M('m0_prev')], [['usd', '3', '2']]);
};

const mockApi = ({ empty = false, revenueRows = DEFAULT_REVENUE } = {}) => {
	const empt = (r: ReportQueryResult) => (empty ? { ...r, rows: [] } : r);
	const run = vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key, req) => empt(report(key, req, revenueRows)));
	const ds = vi.spyOn(ReportsApi, 'runDataset').mockImplementation(async (def) => empt(dataset(def)));
	vi.spyOn(CustomerApi, 'getCustomersByFilters').mockResolvedValue({
		items: [
			{ id: 'cus_1', name: 'Northwind Labs' },
			{ id: 'cus_2', name: 'Bluefin Analytics' },
		],
		pagination: { total: 2, limit: 2, offset: 0 },
	} as unknown as ListCustomersResponse);
	return { run, ds };
};

const panel = (name: string) => screen.getByRole('region', { name });
const render = (c = controls()) => renderWithProviders(<CustomersTab controls={c} goTo={vi.fn()} />);

describe('customers tab', () => {
	afterEach(() => vi.restoreAllMocks());

	it('renders every panel from responses', async () => {
		const { run, ds } = mockApi();
		render();

		const top = panel('Top 10 customers');
		expect(await within(top).findByText('Northwind Labs')).toBeInTheDocument();
		expect(within(top).getByText('Bluefin Analytics')).toBeInTheDocument();
		// Unnamed customer falls back to id.
		expect(within(top).getByText('cus_3')).toBeInTheDocument();
		expect(within(top).getByText('$1K')).toBeInTheDocument();
		expect(within(top).getByText('Usage revenue')).toBeInTheDocument();
		expect(within(top).getByText('Contract revenue')).toBeInTheDocument();
		expect(await within(top).findByText('+50.0%')).toBeInTheDocument();
		expect(within(top).getByText('$450')).toBeInTheDocument();
		expect(within(top).getByText('+12.5%')).toBeInTheDocument();

		const conc = panel('Revenue concentration');
		expect(within(conc).getByText('Top 1')).toBeInTheDocument();
		expect(within(conc).getByText('74%')).toBeInTheDocument();
		expect(within(conc).getAllByText('100%')).toHaveLength(3);

		const bands = panel('Customers by revenue');
		expect(within(bands).getByText('Under $20K')).toBeInTheDocument();
		expect(within(bands).getByText('$20K–$100K')).toBeInTheDocument();
		expect(within(bands).getByText('$500K+')).toBeInTheDocument();
		expect(within(bands).getByText('3')).toBeInTheDocument();

		const table = panel('All customers');
		const row1 = within(table).getByText('Northwind Labs').closest('tr')!;
		const cells = within(row1)
			.getAllByRole('cell')
			.map((c) => c.textContent);
		expect(cells).toEqual(['1', 'Northwind Labs', '$1,000', '$600', '$400', '40.0%', '74.1%', '$800', '+25.0%']);
		const row2 = within(table).getByText('Bluefin Analytics').closest('tr')!;
		expect(within(row2).getAllByRole('cell')[3].textContent).toBe('$0');
		expect(within(row2).getAllByRole('cell')[4].textContent).toBe('$300');
		expect(within(table).getByText('1–3 of 3 customers')).toBeInTheDocument();
		expect(within(table).getByRole('button', { name: 'Download CSV' })).toBeEnabled();

		const revReq = run.mock.calls.find(([k, r]) => k === 'invoice_total' && r.dimensions?.[0] === 'customer_id')![1];
		expect(revReq).toMatchObject({
			shape: 'breakdown',
			compare: 'previous_period',
			limit: CUSTOMER_LIMIT,
			sort: [{ field: 'invoice_total', dir: 'desc' }],
			filters: [{ field: 'currency', op: 'eq', value: ['usd'] }],
		});
		const usageDef = ds.mock.calls.find(([d]) => d.dataset === 'invoice_lines')![0];
		expect(usageDef.dimensions).toEqual(['customer']);
		expect(usageDef.filters).toEqual(
			expect.arrayContaining([
				{ field: 'price_type', op: 'eq', value: ['USAGE'] },
				{ field: 'invoice_status', op: 'eq', value: ['FINALIZED'] },
				{ field: 'currency', op: 'eq', value: ['usd'] },
				{ field: 'customer', op: 'in', value: ['cus_1', 'cus_2', 'cus_3'] },
			]),
		);
		expect(usageDef.time.field).toBe('billing_period');
		expect(screen.queryByText(/Based on the top/)).not.toBeInTheDocument();
	});

	it('revenue header toggles the table order', async () => {
		mockApi();
		render();
		const table = panel('All customers');
		await within(table).findByText('Northwind Labs');
		const first = () => within(table).getAllByRole('row')[1].textContent;
		expect(first()).toContain('Northwind Labs');
		const header = within(table).getByRole('button', { name: 'Revenue' });
		expect(header.closest('th')).toHaveAttribute('aria-sort', 'descending');
		fireEvent.click(header);
		expect(first()).toContain('cus_3');
		expect(header.closest('th')).toHaveAttribute('aria-sort', 'ascending');
		fireEvent.click(header);
		expect(first()).toContain('Northwind Labs');
	});

	it('skips usage when the revenue list is empty', async () => {
		const { ds } = mockApi({ empty: true });
		render();
		await screen.findAllByText('No data for this period');
		expect(ds.mock.calls.some(([d]) => d.dataset === 'invoice_lines')).toBe(false);
	});

	it('compare none hides previous and change columns and deltas', async () => {
		mockApi();
		render(controls('none'));
		const table = panel('All customers');
		expect(await within(table).findByText('Northwind Labs')).toBeInTheDocument();
		expect(within(table).queryByText('Previous period')).not.toBeInTheDocument();
		expect(within(table).queryByText('Change')).not.toBeInTheDocument();
		expect(within(panel('Top 10 customers')).queryByText('+50.0%')).not.toBeInTheDocument();
	});

	it('empty tenant shows no-data states', async () => {
		mockApi({ empty: true });
		render();
		expect(await screen.findAllByText('No data for this period')).toHaveLength(4);
	});

	it('waits for a currency before querying', () => {
		const { run, ds } = mockApi();
		render(controls('previous_period', ''));
		expect(run.mock.calls.some(([k]) => k === 'invoice_total')).toBe(false);
		expect(ds.mock.calls.some(([d]) => d.dataset === 'invoice_lines')).toBe(false);
	});

	it('pages the table and notes a capped list', async () => {
		const rows = Array.from({ length: CUSTOMER_LIMIT }, (_, i) => [`cus_x${i}`, 'usd', String(CUSTOMER_LIMIT - i), '1']);
		mockApi({ revenueRows: rows });
		render();
		const table = panel('All customers');
		expect(await within(table).findByText(`1–20 of ${CUSTOMER_LIMIT} customers`)).toBeInTheDocument();
		fireEvent.click(within(table).getByRole('button', { name: 'Next page' }));
		expect(within(table).getByText(`21–40 of ${CUSTOMER_LIMIT} customers`)).toBeInTheDocument();
		expect(within(table).getByText('cus_x20')).toBeInTheDocument();
		expect(screen.getAllByText(`Based on the top ${CUSTOMER_LIMIT} customers by revenue`)).toHaveLength(3);
	});
});
