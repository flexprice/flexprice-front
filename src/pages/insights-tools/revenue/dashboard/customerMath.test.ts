import { describe, expect, it } from 'vitest';
import { ReportColumn, ReportQueryResult } from '@/types/dto/Reports';
import { bands, concentration, customerRows } from './customerMath';

const r = (revenue: number) => ({ revenue });

const res = (cols: [string, ReportColumn['role']][], rows: string[][]): ReportQueryResult => ({
	columns: cols.map(([name, role]) => ({ name, role, type: role === 'dimension' ? 'string' : 'decimal' })),
	rows,
	meta: { query_source: 'test' },
});

describe('concentration', () => {
	it('shares of top 1/5/10/20 from unsorted rows', () => {
		const rows = [10, 50, 20, 20].map(r);
		expect(concentration(rows)).toEqual([
			{ n: 1, share: 50 },
			{ n: 5, share: 100 },
			{ n: 10, share: 100 },
			{ n: 20, share: 100 },
		]);
	});

	it('zero total or no rows gives 0%, never NaN', () => {
		for (const rows of [[], [r(0), r(0)]]) {
			for (const c of concentration(rows)) {
				expect(c.share).toBe(0);
				expect(Number.isNaN(c.share)).toBe(false);
			}
		}
	});

	it('top 10 of 30 equal customers is a third', () => {
		const rows = Array.from({ length: 30 }, () => r(100));
		expect(concentration(rows)[2].share).toBeCloseTo(33.333, 2);
	});
});

describe('bands', () => {
	it('counts by lower-bound edges', () => {
		expect(bands([0, 19_999.99, 20_000, 99_999, 100_000, 499_999, 500_000, 2_000_000].map(r))).toEqual([2, 2, 2, 2]);
	});

	it('empty rows give zero counts', () => {
		expect(bands([])).toEqual([0, 0, 0, 0]);
	});
});

describe('customerRows', () => {
	const revenue = res(
		[
			['customer_id', 'dimension'],
			['currency', 'dimension'],
			['invoice_total', 'metric'],
			['invoice_total_prev', 'metric'],
		],
		[
			['cus_2', 'usd', '300', '100'],
			['cus_1', 'usd', '1000', ''],
			['cus_3', 'eur', '9000', '0'],
		],
	);
	const usage = res(
		[
			['customer', 'dimension'],
			['customer_label', 'dimension'],
			['currency', 'dimension'],
			['m0', 'metric'],
		],
		[
			['cus_1', 'A', 'usd', '400'],
			['cus_2', 'B', 'usd', '500'],
		],
	);

	it('joins usage, caps it at revenue and sorts desc', () => {
		expect(customerRows(revenue, usage, 'usd')).toEqual([
			{ id: 'cus_1', revenue: 1000, usage: 400, contract: 600, prev: 0 },
			{ id: 'cus_2', revenue: 300, usage: 300, contract: 0, prev: 100 },
		]);
	});

	it('missing usage means all contract; no prev column means no prev', () => {
		const noPrev = res(
			revenue.columns.slice(0, 3).map((c) => [c.name, c.role]),
			[['cus_1', 'usd', '50']],
		);
		expect(customerRows(noPrev, undefined, 'usd')).toEqual([{ id: 'cus_1', revenue: 50, usage: 0, contract: 50 }]);
	});
});
