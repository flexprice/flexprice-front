import { describe, it, expect } from 'vitest';
import { ReportCatalogEntry, ReportQueryResult } from '@/types/dto/Reports';
import { csvFilename, reportRowsCsv, summaryCsv, toCsv } from './reportCsv';

const NOW = new Date(Date.UTC(2026, 9, 12, 15, 0, 0));

const entry = {
	key: 'invoice_total',
	name: 'Total billing',
	kind: 'flow',
	value_type: 'money',
	dimensions: [{ key: 'customer_id', label: 'Customer' }],
} as unknown as ReportCatalogEntry;

const series: ReportQueryResult = {
	columns: [
		{ name: 'bucket', type: 'datetime', role: 'dimension' },
		{ name: 'currency', type: 'string', role: 'dimension' },
		{ name: 'invoice_total', type: 'decimal', role: 'metric' },
		{ name: 'invoice_total_prev', type: 'decimal', role: 'metric' },
	],
	rows: [
		['2026-09-01T00:00:00Z', 'usd', '150', '100'],
		['2026-10-01T00:00:00Z', 'usd', '40', '0'],
		['2026-10-01T00:00:00Z', 'eur', '10', ''],
	],
	meta: {},
} as unknown as ReportQueryResult;

describe('reportCsv', () => {
	it('exports every currency with raw values, change and progress', () => {
		expect(reportRowsCsv(entry, series, 'month', NOW).split('\r\n')).toEqual([
			'period,currency,invoice_total,previous,change_pct,in_progress',
			'2026-09-01,usd,150,100,50.00,false',
			'2026-10-01,usd,40,0,,true',
			'2026-10-01,eur,10,,,true',
		]);
	});

	it('omits compare and progress columns when absent', () => {
		const breakdown = {
			columns: [
				{ name: 'customer_id', type: 'string', role: 'dimension' },
				{ name: 'invoice_total', type: 'decimal', role: 'metric' },
			],
			rows: [['=HYPERLINK("x")', '-5']],
			meta: {},
		} as unknown as ReportQueryResult;
		expect(reportRowsCsv(entry, breakdown, '', NOW).split('\r\n')).toEqual(['customer_id,invoice_total', `"'=HYPERLINK(""x"")",-5`]);
	});

	it('builds summary rows per tile and currency', () => {
		const scalar = {
			columns: [
				{ name: 'currency', type: 'string', role: 'dimension' },
				{ name: 'invoice_total', type: 'decimal', role: 'metric' },
				{ name: 'invoice_total_prev', type: 'decimal', role: 'metric' },
				{ name: 'invoice_total_change_pct', type: 'decimal', role: 'metric' },
			],
			rows: [['usd', '200', '100', '100']],
			meta: {},
		} as unknown as ReportQueryResult;
		expect(
			summaryCsv(
				[
					{ entry, data: scalar },
					{ entry, data: undefined },
				],
				'2026-10-01..2026-10-13',
			).split('\r\n'),
		).toEqual(['report,from,to,currency,value,previous,change_pct', 'invoice_total,2026-10-01,2026-10-12,usd,200,100,100']);
	});

	it('quotes cells and names files by inclusive range', () => {
		expect(toCsv([['a,b', 'c"d']])).toBe('"a,b","c""d"');
		expect(csvFilename('invoice_total', '2026-10-01..2026-10-13')).toBe('invoice_total_2026-10-01_2026-10-12.csv');
	});

	it('writes one labelled column group per measure', () => {
		const result: ReportQueryResult = {
			columns: [
				{ name: 'customer_id', type: 'string', role: 'dimension' },
				{ name: 'customer_id_label', type: 'string', role: 'dimension' },
				{ name: 'm0', type: 'decimal', role: 'metric' },
				{ name: 'm1', type: 'decimal', role: 'metric' },
				{ name: 'm1_prev', type: 'decimal', role: 'metric' },
			],
			rows: [['c1', 'Acme', '3', '10', '5']],
			meta: { query_source: 'test' },
		};
		const measures = [
			{ key: 'm0', label: 'Count' },
			{ key: 'm1', label: 'Sum of Total' },
		];
		expect(reportRowsCsv(entry, result, '', NOW, measures).split('\r\n')).toEqual([
			'customer_id,customer_id_label,Count,Count previous,Count change_pct,Sum of Total,Sum of Total previous,Sum of Total change_pct',
			'c1,Acme,3,,,10,5,100.00',
		]);
	});
});
