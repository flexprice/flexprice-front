import { describe, it, expect } from 'vitest';
import { agingBucketOf, datasetDefinition, DashboardControls, overdueOf, reportRequest, todayRange, untilTodayRange } from './queries';

const c: DashboardControls = {
	preset: 'this_year',
	compare: 'previous_year',
	currency: 'usd',
	range: '2026-01-01..2026-10-16',
	now: new Date('2026-10-15T23:30:00Z'),
};

describe('dashboard queries', () => {
	it('todayRange is the current UTC day', () => {
		expect(todayRange(c.now)).toBe('2026-10-15..2026-10-16');
	});

	it('flow reports use page range and opt-in compare', () => {
		expect(reportRequest('invoice_total', { shape: 'timeseries', grain: 'month', compare: true }, c)).toEqual({
			shape: 'timeseries',
			grain: 'month',
			range: '2026-01-01..2026-10-16',
			compare: 'previous_year',
		});
		expect(reportRequest('invoice_total', { shape: 'scalar' }, c)).toEqual({ shape: 'scalar', range: '2026-01-01..2026-10-16' });
		expect(reportRequest('events_volume', { shape: 'timeseries', range: '2026-10-09..2026-10-16' }, c).range).toBe(
			'2026-10-09..2026-10-16',
		);
	});

	it('point-in-time reports ignore range, grain and compare', () => {
		expect(
			reportRequest('receivables_aging', { shape: 'breakdown', dimensions: ['aging_bucket'], grain: 'month', compare: true }, c),
		).toEqual({ shape: 'breakdown', dimensions: ['aging_bucket'], range: '2026-10-15..2026-10-16' });
	});

	it('dataset definitions resolve range and keep caller sort/limit', () => {
		const def = datasetDefinition(
			{
				dataset: 'invoices',
				measures: [{ agg: 'avg', field: 'days_to_pay' }],
				dimensions: ['customer'],
				time: { field: 'paid_at' },
				sort: [{ field: 'm0', dir: 'asc' }],
				limit: 8,
				compare: true,
			},
			c,
		);
		expect(def).toMatchObject({
			family: 'dataset',
			time: { field: 'paid_at', range: '2026-01-01..2026-10-16' },
			sort: [{ field: 'm0', dir: 'asc' }],
			limit: 8,
			compare: 'previous_year',
		});
		expect(datasetDefinition({ dataset: 'invoices', measures: [{ agg: 'count' }], time: { field: 'paid_at' } }, c).compare).toBeUndefined();
	});

	it('overdue sums past-due buckets for the currency', () => {
		const result = {
			columns: [
				{ name: 'currency', role: 'dimension' as const, type: 'string' as const },
				{ name: 'aging_bucket', role: 'dimension' as const, type: 'string' as const },
				{ name: 'receivables_aging', role: 'metric' as const, type: 'decimal' as const },
			],
			rows: [
				['usd', 'Current', '5'],
				['usd', '1-30', '10'],
				['usd', '61-90', '2.5'],
				['usd', 'No due date', '7'],
				['eur', '90+', '99'],
			],
			meta: { query_source: 'test' },
		};
		expect(overdueOf(result, 'usd')).toBe(12.5);
		expect(overdueOf(result, 'eur')).toBe(99);
		expect(overdueOf(result, 'gbp')).toBeUndefined();
	});

	it('maps days overdue to aging buckets', () => {
		expect([0, 1, 30, 31, 60, 61, 90, 91, 400].map(agingBucketOf)).toEqual([
			'Current',
			'1-30',
			'1-30',
			'31-60',
			'31-60',
			'61-90',
			'61-90',
			'90+',
			'90+',
		]);
	});

	it('due-date window ends with today', () => {
		expect(untilTodayRange(c.now)).toBe('2000-01-01..2026-10-16');
	});
});
