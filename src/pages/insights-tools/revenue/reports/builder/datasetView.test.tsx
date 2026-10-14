import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { mockDatasets } from '@/api/fixtures/reports';
import { ReportQueryResult } from '@/types/dto/Reports';
import ReportTable from '../ReportTable';
import { renderWithProviders } from '../testUtils';
import { defaultDefinition } from './builderModel';
import { datasetEntry, measureColumns, withDimLabels } from './datasetView';

const [invoices, usage] = mockDatasets().items;

describe('datasetView', () => {
	it('swaps ids for labels and drops label columns', () => {
		const result: ReportQueryResult = {
			columns: [
				{ name: 'customer_id', type: 'string', role: 'dimension' },
				{ name: 'customer_id_label', type: 'string', role: 'dimension' },
				{ name: 'm0', type: 'decimal', role: 'metric' },
			],
			rows: [
				['c1', 'Acme', '3'],
				['c2', '', '4'],
			],
			meta: { query_source: 'test' },
		};
		const out = withDimLabels(result);
		expect(out.columns.map((c) => c.name)).toEqual(['customer_id', 'm0']);
		expect(out.rows).toEqual([
			['Acme', '3'],
			['c2', '4'],
		]);
	});

	it('labels measures from the result and marks money sums', () => {
		const def = { ...defaultDefinition(invoices), measures: [{ agg: 'count' as const }, { agg: 'sum' as const, field: 'total' }] };
		const result = { columns: [], rows: [], meta: { query_source: 'test', measure_labels: { m1: 'Sum of Total' } } };
		expect(measureColumns(invoices, def, result, (k) => k)).toEqual([
			{ key: 'm0', label: 'builder.agg.count', valueType: 'count' },
			{ key: 'm1', label: 'Sum of Total', valueType: 'money' },
		]);
	});

	it('renders an average of quantity with decimals', () => {
		const def = {
			...defaultDefinition(usage),
			time: { ...defaultDefinition(usage).time, grain: '' as const },
			measures: [{ agg: 'avg' as const, field: 'qty_total' }],
		};
		const result: ReportQueryResult = {
			columns: [
				{ name: 'meter_id', type: 'string', role: 'dimension' },
				{ name: 'm0', type: 'decimal', role: 'metric' },
			],
			rows: [['api_calls', '2.4']],
			meta: { query_source: 'test' },
		};
		const measures = measureColumns(usage, def, result, (k) => k);
		expect(measures[0].valueType).toBe('number');
		renderWithProviders(
			<ReportTable entry={datasetEntry(usage, def, measures)} result={result} currency='' now={new Date()} measures={measures} />,
		);
		expect(screen.getByText('2.4')).toBeInTheDocument();
	});
});
