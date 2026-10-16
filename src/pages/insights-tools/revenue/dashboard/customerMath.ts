import { ReportQueryResult } from '@/types/dto/Reports';
import { metricIndexes, rowsFor } from '../reports/reportMath';
import { splitRevenue } from './revenueMath';

export interface CustomerRow {
	id: string;
	revenue: number;
	usage: number;
	contract: number;
	prev?: number;
}

export const CONCENTRATION_TOPS = [1, 5, 10, 20] as const;
export const BAND_EDGES = [20_000, 100_000, 500_000] as const;

const num = (v: string | undefined) => {
	const n = Number(v);
	return v !== undefined && v !== '' && Number.isFinite(n) ? n : 0;
};

// Revenue rows joined with usage.
export const customerRows = (
	revenue: ReportQueryResult | undefined,
	usage: ReportQueryResult | undefined,
	currency: string,
): CustomerRow[] => {
	if (!revenue) return [];
	const ci = revenue.columns.findIndex((c) => c.name === 'customer_id');
	const idx = metricIndexes(revenue, 'invoice_total');
	if (ci < 0 || idx.current < 0) return [];
	const used = new Map<string, number>();
	if (usage) {
		const ui = usage.columns.findIndex((c) => c.name === 'customer');
		const mi = usage.columns.findIndex((c) => c.name === 'm0');
		if (ui >= 0 && mi >= 0) for (const r of rowsFor(usage, currency)) used.set(r[ui], (used.get(r[ui]) ?? 0) + num(r[mi]));
	}
	return rowsFor(revenue, currency)
		.map((r) => {
			const rev = num(r[idx.current]);
			return {
				id: r[ci],
				revenue: rev,
				...splitRevenue(rev, used.get(r[ci]) ?? 0),
				...(idx.prev >= 0 ? { prev: num(r[idx.prev]) } : {}),
			};
		})
		.sort((a, b) => b.revenue - a.revenue);
};

// Share of total from top N.
export const concentration = (rows: Pick<CustomerRow, 'revenue'>[]) => {
	const sorted = rows.map((r) => r.revenue).sort((a, b) => b - a);
	const total = sorted.reduce((s, v) => s + v, 0);
	return CONCENTRATION_TOPS.map((n) => {
		const top = sorted.slice(0, n).reduce((s, v) => s + v, 0);
		return { n, share: total > 0 ? (top / total) * 100 : 0 };
	});
};

// Counts per band; edges inclusive.
export const bands = (rows: Pick<CustomerRow, 'revenue'>[]): number[] => {
	const counts = new Array<number>(BAND_EDGES.length + 1).fill(0);
	for (const { revenue } of rows) counts[BAND_EDGES.filter((e) => revenue >= e).length]++;
	return counts;
};
