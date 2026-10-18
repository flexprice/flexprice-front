import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import ReportsApi from '@/api/ReportsApi';
import { DatasetDefinition, ReportColumn, ReportQueryResult } from '@/types/dto/Reports';
import { renderWithProviders } from '../reports/testUtils';
import RevenueDashboard from './RevenueDashboard';

const NOW = new Date('2026-10-15T12:00:00Z');

const res = (cols: [string, ReportColumn['role']][], rows: string[][]): ReportQueryResult => ({
	columns: cols.map(([name, role]) => ({ name, role, type: role === 'dimension' ? 'string' : 'decimal' })),
	rows,
	meta: { query_source: 'test' },
});

const withCompare = (key: string, dims: string[], rows: string[][]) =>
	res(
		[
			...dims.map((d) => [d, 'dimension'] as [string, 'dimension']),
			[key, 'metric'],
			[`${key}_prev`, 'metric'],
			[`${key}_change_pct`, 'metric'],
		],
		rows,
	);

const FULL: Record<string, ReportQueryResult> = {
	invoice_total: withCompare(
		'invoice_total',
		['currency'],
		[
			['usd', '4829711', '3700000', '30.5'],
			['eur', '1000', '800', '25'],
		],
	),
	arpu: withCompare('arpu', ['currency'], [['usd', '120743', '107000', '12.8']]),
	total_receivables: res(
		[
			['currency', 'dimension'],
			['total_receivables', 'metric'],
		],
		[['usd', '1000']],
	),
	receivables_aging: res(
		[
			['currency', 'dimension'],
			['aging_bucket', 'dimension'],
			['receivables_aging', 'metric'],
		],
		[
			['usd', 'Current', '400'],
			['usd', '1-30', '300'],
			['usd', '90+', '100'],
			['usd', 'No due date', '200'],
		],
	),
	days_to_pay: withCompare('days_to_pay', [], [['19.8', '26.6', '-25.5']]),
	credit_topups: res(
		[
			['bucket', 'dimension'],
			['currency', 'dimension'],
			['credit_topups', 'metric'],
		],
		[
			['2026-01-01T00:00:00Z', 'usd', '6000'],
			['2026-01-01T00:00:00Z', 'eur', '100'],
		],
	),
};

const CREDIT_KEYS = ['credit_topups', 'credit_consumption', 'events_volume'];

const datasetResult = (def: DatasetDefinition, empty: boolean) =>
	def.measures[0].agg === 'median'
		? res(
				[
					['currency', 'dimension'],
					['m0', 'metric'],
				],
				empty
					? []
					: [
							['eur', '30'],
							['usd', '15'],
						],
			)
		: res(
				[
					['currency', 'dimension'],
					['m0', 'metric'],
				],
				empty ? [] : [['usd', '40']],
			);

const mockApi = (empty = false) => {
	const run = vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key) => {
		const r = FULL[key] ?? res([], []);
		return empty ? { ...r, rows: [] } : r;
	});
	const ds = vi.spyOn(ReportsApi, 'runDataset').mockImplementation(async (def) => datasetResult(def, empty));
	return { run, ds };
};

const card = (label: string) =>
	screen
		.getAllByText(label)
		.map((el) => el.parentElement as HTMLElement)
		.find((el) => el.querySelector('.text-2xl'))!;

describe('RevenueDashboard', () => {
	beforeEach(() => {
		window.history.replaceState(null, '', '/reporting');
		Element.prototype.scrollIntoView = vi.fn();
	});
	afterEach(() => vi.restoreAllMocks());

	it('renders the four KPI cards from responses', async () => {
		mockApi();
		renderWithProviders(<RevenueDashboard now={NOW} />);
		fireEvent.keyDown(screen.getByLabelText('Compare'), { key: 'Enter' });
		fireEvent.click(await screen.findByRole('option', { name: 'Previous period' }));
		expect(await screen.findByText('$4,829,711')).toBeInTheDocument();
		expect(within(card('Revenue')).getByText('+30.5%')).toBeInTheDocument();
		expect(screen.getByText('Previous: $3.7M')).toBeInTheDocument();
		expect(await screen.findByText('$120,743')).toBeInTheDocument();
		expect(await screen.findByText('40 billed customers')).toBeInTheDocument();
		await waitFor(() => expect(within(card('Outstanding')).getByText('$1,000')).toBeInTheDocument());
		await waitFor(() => expect(within(card('Overdue')).getByText('$400')).toBeInTheDocument());
		expect(screen.getByText('40.0% of outstanding')).toBeInTheDocument();
		expect(screen.queryByText('Avg. days to pay')).not.toBeInTheDocument();
	});

	it('currency select is disabled until currencies load', async () => {
		mockApi();
		renderWithProviders(<RevenueDashboard now={NOW} />);
		expect(screen.getByLabelText('Currency')).toBeDisabled();
		await waitFor(() => expect(screen.getByLabelText('Currency')).toBeEnabled());
	});

	it('selects a currency from receivables when no revenue', async () => {
		mockApi();
		vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key) =>
			key === 'invoice_total' ? { ...FULL.invoice_total, rows: [] } : (FULL[key] ?? res([], [])),
		);
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await waitFor(() => expect(screen.getByLabelText('Currency')).toBeEnabled());
		await waitFor(() => expect(within(card('Outstanding')).getByText('$1,000')).toBeInTheDocument());
	});

	it('shows the previous revenue line only with compare', async () => {
		mockApi();
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await screen.findByText('$4,829,711');
		expect(screen.queryByText(/^Previous:/)).not.toBeInTheDocument();
		fireEvent.keyDown(screen.getByLabelText('Compare'), { key: 'Enter' });
		fireEvent.click(await screen.findByRole('option', { name: 'Previous period' }));
		await screen.findByText('Previous: $3.7M');
	});

	it('shows dashes when there is no data', async () => {
		mockApi(true);
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await waitFor(() => expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(6));
		expect(screen.queryByText(/% of outstanding/)).not.toBeInTheDocument();
	});

	it('compacts large KPI amounts and keeps the exact value on hover', async () => {
		mockApi();
		vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key) =>
			key === 'total_receivables' ? { ...FULL.total_receivables, rows: [['usd', '103277993.97']] } : (FULL[key] ?? res([], [])),
		);
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await waitFor(() => expect(within(card('Outstanding')).getByText('$103.3M')).toHaveAttribute('title', '$103,277,993.97'));
	});

	it('guards overdue share when outstanding is zero', async () => {
		mockApi();
		vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key) =>
			key === 'total_receivables' ? { ...FULL.total_receivables, rows: [['usd', '0']] } : (FULL[key] ?? res([], [])),
		);
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await waitFor(() => expect(within(card('Overdue')).getByText('$400')).toBeInTheDocument());
		expect(screen.queryByText(/% of outstanding/)).not.toBeInTheDocument();
	});

	it('controls change request params; point-in-time ignores them', async () => {
		const { run, ds } = mockApi();
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await waitFor(() => expect(run).toHaveBeenCalledWith('invoice_total', { shape: 'scalar', range: '2026-07-17..2026-10-15' }));
		expect(run.mock.calls.filter(([k]) => k === 'invoice_total').every(([, r]) => !('compare' in r))).toBe(true);
		expect(run).toHaveBeenCalledWith('total_receivables', { shape: 'scalar', range: '2026-10-15..2026-10-16' });
		expect(ds).toHaveBeenCalledWith(
			expect.objectContaining({
				measures: [{ agg: 'median', field: 'days_to_pay' }],
				time: { field: 'paid_at', range: '2026-07-17..2026-10-15' },
			}),
		);

		fireEvent.keyDown(screen.getByLabelText('Date range'), { key: 'Enter' });
		fireEvent.click(await screen.findByRole('option', { name: 'Last month' }));
		await waitFor(() => expect(run).toHaveBeenCalledWith('invoice_total', { shape: 'scalar', range: '2026-09-01..2026-10-01' }));

		fireEvent.keyDown(screen.getByLabelText('Compare'), { key: 'Enter' });
		fireEvent.click(await screen.findByRole('option', { name: 'Previous period' }));
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith('arpu', { shape: 'scalar', range: '2026-09-01..2026-10-01', compare: 'previous_period' }),
		);
		const receivableRanges = run.mock.calls.filter(([k]) => k === 'total_receivables').map(([, r]) => r.range);
		expect(new Set(receivableRanges)).toEqual(new Set(['2026-10-15..2026-10-16']));
	});

	it('opens the tab from the hash and writes it back', async () => {
		mockApi();
		window.history.replaceState(null, '', '/reporting#receivables');
		renderWithProviders(<RevenueDashboard now={NOW} />);
		expect(screen.getByRole('tab', { name: 'Receivables' })).toHaveAttribute('aria-selected', 'true');
		fireEvent.mouseDown(screen.getByRole('tab', { name: 'Payments' }));
		expect(screen.getByRole('tab', { name: 'Payments' })).toHaveAttribute('aria-selected', 'true');
		expect(window.location.hash).toBe('#payments');
	});

	it('only the active tab fetches', async () => {
		const { run, ds } = mockApi();
		window.history.replaceState(null, '', '/reporting#receivables');
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await waitFor(() => expect(ds).toHaveBeenCalledWith(expect.objectContaining({ time: expect.objectContaining({ field: 'due_date' }) })));
		expect(run.mock.calls.filter(([k]) => CREDIT_KEYS.includes(k))).toEqual([]);
		expect(run.mock.calls.filter(([k, r]) => k === 'invoice_total' && r.shape !== 'scalar')).toEqual([]);
		expect(ds.mock.calls.filter(([d]) => d.dataset === 'wallet_transactions')).toEqual([]);

		fireEvent.mouseDown(screen.getByRole('tab', { name: 'Credits & usage' }));
		await waitFor(() => expect(run).toHaveBeenCalledWith('events_volume', expect.anything()));
		expect(ds).toHaveBeenCalledWith(expect.objectContaining({ dataset: 'wallet_transactions' }));
		expect(ds.mock.calls.filter(([d]) => d.dimensions?.includes('customer') && d.time.field === 'paid_at')).toEqual([]);
		expect(run.mock.calls.filter(([k, r]) => k === 'invoice_total' && r.shape !== 'scalar')).toEqual([]);
	});

	it('switching currency changes money and credit panels', async () => {
		mockApi();
		window.history.replaceState(null, '', '/reporting#credits');
		renderWithProviders(<RevenueDashboard now={NOW} />);
		const flow = await screen.findByRole('region', { name: 'Credit consumption vs. top-ups' });
		expect(await within(flow).findByText('+6,000')).toBeInTheDocument();
		expect(within(card('Revenue')).getByText('$4,829,711')).toBeInTheDocument();
		fireEvent.keyDown(screen.getByLabelText('Currency'), { key: 'Enter' });
		fireEvent.click(await screen.findByRole('option', { name: 'EUR' }));
		expect(await within(flow).findByText('+100')).toBeInTheDocument();
		expect(within(flow).queryByText('+6,000')).not.toBeInTheDocument();
		await waitFor(() => expect(within(card('Revenue')).queryByText('$4,829,711')).not.toBeInTheDocument());
		expect(within(card('Revenue')).getByText(/1,000/)).toBeInTheDocument();
	});

	it('defaults to overview on an unknown hash', () => {
		mockApi();
		window.history.replaceState(null, '', '/reporting#nope');
		renderWithProviders(<RevenueDashboard now={NOW} />);
		expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
	});
});
