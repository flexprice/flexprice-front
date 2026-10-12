import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import { mockCatalog, mockRun } from '@/api/fixtures/reports';
import ReportTable from './ReportTable';
import { chartSupported } from './ReportChart';
import { renderWithProviders } from './testUtils';

const entry = (k: string) => mockCatalog().items.find((e) => e.key === k)!;

describe('ReportTable', () => {
	it('shows previous and change columns plus a total row for flow reports', () => {
		const e = entry('invoice_total');
		const res = mockRun('invoice_total', { shape: 'timeseries', range: 'x', grain: 'month', compare: 'previous_period' });
		renderWithProviders(<ReportTable entry={e} result={res} currency='usd' />);
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
		renderWithProviders(<ReportTable entry={e} result={res} currency='usd' />);
		expect(screen.getByText('New')).toBeInTheDocument();
	});

	it('only shows the selected currency', () => {
		const e = entry('invoice_total');
		const res = mockRun('invoice_total', { shape: 'scalar', range: 'x' });
		renderWithProviders(<ReportTable entry={e} result={res} currency='eur' />);
		expect(screen.queryByText('USD')).not.toBeInTheDocument();
	});
});

describe('chartSupported', () => {
	it('is false for histogram results', () => {
		const e = { ...entry('invoice_total'), default_shape: 'histogram' as const, shapes: ['histogram' as const] };
		expect(chartSupported(e, { columns: [], rows: [], meta: { query_source: 'x' } })).toBe(false);
	});
});
