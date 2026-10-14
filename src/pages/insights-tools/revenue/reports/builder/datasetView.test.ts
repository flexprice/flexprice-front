import { describe, expect, it } from 'vitest';
import { mockDatasets } from '@/api/fixtures/reports';
import { ReportQueryResult } from '@/types/dto/Reports';
import { defaultDefinition } from './builderModel';
import { measureColumns, withDimLabels } from './datasetView';

const invoices = mockDatasets().items[0];

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
});
