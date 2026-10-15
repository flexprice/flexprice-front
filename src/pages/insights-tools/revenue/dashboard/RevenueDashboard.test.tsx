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
	invoice_total: withCompare('invoice_total', ['currency'], [['usd', '4829711', '3700000', '30.5']]),
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
};

const datasetResult = (def: DatasetDefinition, empty: boolean) =>
	def.measures[0].agg === 'median'
		? res([['m0', 'metric']], empty ? [] : [['15']])
		: res(
				[
					['currency', 'dimension'],
					['m0', 'metric'],
				],
				empty ? [] : [['usd', '40']],
			);

const mockApi = (empty = false) => {
	const run = vi
		.spyOn(ReportsApi, 'runReport')
		.mockImplementation(async (key) => (empty ? { ...FULL[key], rows: [] } : FULL[key]) ?? res([], []));
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
		window.history.replaceState(null, '', '/revenue');
		Element.prototype.scrollIntoView = vi.fn();
	});
	afterEach(() => vi.restoreAllMocks());

	it('renders the five KPI cards from responses', async () => {
		mockApi();
		renderWithProviders(<RevenueDashboard now={NOW} />);
		expect(await screen.findByText('$4,829,711')).toBeInTheDocument();
		expect(within(card('Revenue')).getByText('+30.5%')).toBeInTheDocument();
		expect(screen.getByText('Previous: $3.7M')).toBeInTheDocument();
		expect(await screen.findByText('$120,743')).toBeInTheDocument();
		expect(await screen.findByText('40 billed customers')).toBeInTheDocument();
		expect(await screen.findByText('$1,000')).toBeInTheDocument();
		expect(await screen.findByText('$400')).toBeInTheDocument();
		expect(screen.getByText('40.0% of outstanding')).toBeInTheDocument();
		expect(await screen.findByText('19.8 days')).toBeInTheDocument();
		expect(await screen.findByText('Median 15.0d')).toBeInTheDocument();
	});

	it('days to pay going down is good', async () => {
		mockApi();
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await screen.findByText('19.8 days');
		const chip = within(card('Avg. days to pay')).getByText('-25.5%');
		expect(chip.closest('[style]')?.getAttribute('style')).toContain('success');
	});

	it('shows dashes when there is no data', async () => {
		mockApi(true);
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await waitFor(() => expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(9));
		expect(screen.queryByText(/% of outstanding/)).not.toBeInTheDocument();
	});

	it('guards overdue share when outstanding is zero', async () => {
		mockApi();
		vi.spyOn(ReportsApi, 'runReport').mockImplementation(async (key) =>
			key === 'total_receivables' ? { ...FULL.total_receivables, rows: [['usd', '0']] } : FULL[key],
		);
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await screen.findByText('$400');
		expect(screen.queryByText(/% of outstanding/)).not.toBeInTheDocument();
	});

	it('controls change request params; point-in-time ignores them', async () => {
		const { run, ds } = mockApi();
		renderWithProviders(<RevenueDashboard now={NOW} />);
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith('invoice_total', { shape: 'scalar', range: '2026-01-01..2026-10-16', compare: 'previous_period' }),
		);
		expect(run).toHaveBeenCalledWith('total_receivables', { shape: 'scalar', range: '2026-10-15..2026-10-16' });
		expect(ds).toHaveBeenCalledWith(
			expect.objectContaining({
				measures: [{ agg: 'median', field: 'days_to_pay' }],
				time: { field: 'paid_at', range: '2026-01-01..2026-10-16' },
			}),
		);

		fireEvent.keyDown(screen.getByLabelText('Date range'), { key: 'Enter' });
		fireEvent.click(await screen.findByRole('option', { name: 'Last month' }));
		await waitFor(() =>
			expect(run).toHaveBeenCalledWith('invoice_total', { shape: 'scalar', range: '2026-09-01..2026-10-01', compare: 'previous_period' }),
		);

		fireEvent.keyDown(screen.getByLabelText('Compare'), { key: 'Enter' });
		fireEvent.click(await screen.findByRole('option', { name: 'No comparison' }));
		await waitFor(() => expect(run).toHaveBeenCalledWith('arpu', { shape: 'scalar', range: '2026-09-01..2026-10-01' }));
		const receivableRanges = run.mock.calls.filter(([k]) => k === 'total_receivables').map(([, r]) => r.range);
		expect(new Set(receivableRanges)).toEqual(new Set(['2026-10-15..2026-10-16']));
	});

	it('opens the tab from the hash and writes it back', async () => {
		mockApi();
		window.history.replaceState(null, '', '/revenue#receivables');
		renderWithProviders(<RevenueDashboard now={NOW} />);
		expect(screen.getByRole('tab', { name: 'Receivables' })).toHaveAttribute('aria-selected', 'true');
		fireEvent.mouseDown(screen.getByRole('tab', { name: 'Payments' }));
		expect(screen.getByRole('tab', { name: 'Payments' })).toHaveAttribute('aria-selected', 'true');
		expect(window.location.hash).toBe('#payments');
	});

	it('defaults to overview on an unknown hash', () => {
		mockApi();
		window.history.replaceState(null, '', '/revenue#nope');
		renderWithProviders(<RevenueDashboard now={NOW} />);
		expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
	});
});
