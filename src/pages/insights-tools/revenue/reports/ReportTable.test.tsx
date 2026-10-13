import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import { mockCatalog, mockRun } from '@/api/fixtures/reports';
import ReportTable from './ReportTable';
import { chartPoints, chartSupported, IN_PROGRESS_OPACITY } from './ReportChart';
import KpiRibbon from './KpiRibbon';
import { renderWithProviders } from './testUtils';

const NOW = new Date(Date.UTC(2026, 9, 12, 15));
const entry = (k: string) => mockCatalog().items.find((e) => e.key === k)!;

describe('ReportTable', () => {
	it('shows previous and change columns plus a total row for flow reports', () => {
		const e = entry('invoice_total');
		const res = mockRun('invoice_total', { shape: 'timeseries', range: 'x', grain: 'month', compare: 'previous_period' });
		renderWithProviders(<ReportTable entry={e} result={res} currency='usd' now={NOW} />);
		expect(screen.getByRole('columnheader', { name: 'Previous' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Δ%' })).toBeInTheDocument();
		const rows = screen.getAllByRole('row');
		expect(within(rows[rows.length - 1]).getByText('Total')).toBeInTheDocument();
	});

	it('shows New when the previous value is zero', () => {
		const e = entry('credit_topups');
		const res = mockRun('credit_topups', {
			shape: 'breakdown',
			range: 'x',
			dimensions: ['transaction_reason'],
			compare: 'previous_period',
		});
		renderWithProviders(<ReportTable entry={e} result={res} currency='usd' now={NOW} />);
		expect(screen.getByText('New')).toBeInTheDocument();
	});

	it('defaults to the first currency and totals only its rows', () => {
		const e = entry('invoice_total');
		const res = {
			columns: [
				{ name: 'bucket', type: 'datetime', role: 'dimension' },
				{ name: 'currency', type: 'string', role: 'dimension' },
				{ name: 'invoice_total', type: 'decimal', role: 'metric' },
			],
			rows: [
				['2026-01-01T00:00:00Z', 'usd', '100'],
				['2026-02-01T00:00:00Z', 'usd', '50'],
				['2026-01-01T00:00:00Z', 'eur', '7000'],
				['2026-02-01T00:00:00Z', 'eur', '8000'],
			],
			meta: { query_source: 'x' },
		} as unknown as Parameters<typeof ReportTable>[0]['result'];
		renderWithProviders(<ReportTable entry={e} result={res} currency='' now={NOW} />);
		const rows = screen.getAllByRole('row');
		expect(rows).toHaveLength(4);
		expect(within(rows[3]).getByText('$150')).toBeInTheDocument();
		expect(screen.queryByText(/7,000|8,000/)).not.toBeInTheDocument();
	});
});

describe('chartSupported', () => {
	it('is false for histogram results', () => {
		const e = { ...entry('invoice_total'), default_shape: 'histogram' as const, shapes: ['histogram' as const] };
		expect(chartSupported(e, { columns: [], rows: [], meta: { query_source: 'x' } })).toBe(false);
	});
});

const monthly = {
	columns: [
		{ name: 'bucket', type: 'datetime', role: 'dimension' },
		{ name: 'invoice_total', type: 'decimal', role: 'metric' },
	],
	rows: [
		['2026-09-01T00:00:00Z', '100'],
		['2026-10-01T00:00:00Z', '0'],
	],
	meta: { query_source: 'x' },
} as unknown as Parameters<typeof ReportTable>[0]['result'];

describe('in-progress periods', () => {
	it('badges only the open bucket in the table', () => {
		renderWithProviders(<ReportTable entry={entry('invoice_total')} result={monthly} currency='' grain='month' now={NOW} />);
		const rows = screen.getAllByRole('row');
		expect(within(rows[1]).queryByText('In progress')).not.toBeInTheDocument();
		expect(within(rows[2]).getByText('In progress')).toBeInTheDocument();
	});

	it('adds no badge without a grain', () => {
		renderWithProviders(<ReportTable entry={entry('invoice_total')} result={monthly} currency='' now={NOW} />);
		expect(screen.queryByText('In progress')).not.toBeInTheDocument();
	});

	it('flags the open bucket for the chart', () => {
		const pts = chartPoints(monthly, 'invoice_total', '', 'month', NOW);
		expect(pts.map((p) => p.inProgress)).toEqual([false, true]);
		expect(IN_PROGRESS_OPACITY).toBeLessThan(1);
	});

	it('shows To date on period-to-date KPI tiles', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'true');
		renderWithProviders(<KpiRibbon entries={mockCatalog().items} now={NOW} />);
		expect((await screen.findAllByText('To date')).length).toBeGreaterThan(0);
		vi.unstubAllEnvs();
	});
});
