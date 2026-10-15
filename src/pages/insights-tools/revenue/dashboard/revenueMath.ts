import { ReactNode } from 'react';
import { ReportGrain, ReportQueryResult } from '@/types/dto/Reports';
import { csvSafe, toCsv } from '../reports/reportCsv';
import { rowsFor } from '../reports/reportMath';

export const PALETTE = ['#2b7bd9', '#ea6a35', '#16a34a', '#9333ea', '#eab308', '#0891b2', '#94a3b8'];
export const PREVIOUS_COLOR = '#94a3b8';

export type SeriesRow = { bucket: string } & Record<string, number | string>;

const num = (v: string | undefined) => {
	const n = Number(v);
	return v !== undefined && v !== '' && Number.isFinite(n) ? n : 0;
};

const bucketKey = (v: string) => v.slice(0, 10);

// Usage capped at revenue.
export const splitRevenue = (revenue: number, usage: number) => {
	const shown = Math.max(Math.min(usage, revenue), 0);
	return { usage: shown, contract: Math.max(revenue - shown, 0) };
};

export interface SeriesSource {
	result: ReportQueryResult | undefined;
	// Column name, e.g. invoice_total_prev or m1.
	column: string;
}

// Absent columns leave fields unset.
export const mergeSeries = (sources: Record<string, SeriesSource>, currency: string): SeriesRow[] => {
	const acc = new Map<string, SeriesRow>();
	for (const [field, { result, column }] of Object.entries(sources)) {
		if (!result) continue;
		const bi = result.columns.findIndex((c) => c.name === 'bucket');
		const mi = result.columns.findIndex((c) => c.name === column);
		if (bi < 0 || mi < 0) continue;
		for (const r of rowsFor(result, currency)) {
			const b = bucketKey(r[bi]);
			const row = acc.get(b) ?? { bucket: b };
			row[field] = (Number(row[field]) || 0) + num(r[mi]);
			acc.set(b, row);
		}
	}
	return [...acc.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
};

export interface Pivot {
	rows: SeriesRow[];
	// Ordered by total, largest first.
	keys: string[];
}

export const pivotSeries = (result: ReportQueryResult | undefined, metric: string, dimension: string, currency: string): Pivot => {
	if (!result) return { rows: [], keys: [] };
	const bi = result.columns.findIndex((c) => c.name === 'bucket');
	const di = result.columns.findIndex((c) => c.name === dimension);
	const mi = result.columns.findIndex((c) => c.name === metric);
	if (bi < 0 || di < 0 || mi < 0) return { rows: [], keys: [] };
	const acc = new Map<string, SeriesRow>();
	const totals = new Map<string, number>();
	for (const r of rowsFor(result, currency)) {
		const b = bucketKey(r[bi]);
		const k = r[di];
		const v = num(r[mi]);
		const row = acc.get(b) ?? { bucket: b };
		row[k] = (Number(row[k]) || 0) + v;
		acc.set(b, row);
		totals.set(k, (totals.get(k) ?? 0) + v);
	}
	return {
		rows: [...acc.values()].sort((a, b) => a.bucket.localeCompare(b.bucket)),
		keys: [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k),
	};
};

export const OTHER_KEY = '__other__';

export const topKeys = ({ rows, keys }: Pivot, n: number): Pivot => {
	if (keys.length <= n) return { rows, keys };
	const kept = keys.slice(0, n);
	const rest = keys.slice(n);
	return {
		keys: [...kept, OTHER_KEY],
		rows: rows.map((row) => {
			const out: SeriesRow = { bucket: row.bucket };
			kept.forEach((k) => {
				if (row[k] !== undefined) out[k] = row[k];
			});
			out[OTHER_KEY] = rest.reduce((s, k) => s + (Number(row[k]) || 0), 0);
			return out;
		}),
	};
};

// Splits revenue and prev into usage/contract.
export const withContract = (rows: SeriesRow[]): SeriesRow[] =>
	rows.map((row) => {
		const cur = splitRevenue(Number(row.revenue) || 0, Number(row.usage) || 0);
		const prev = row.prev !== undefined ? splitRevenue(Number(row.prev) || 0, Number(row.usagePrev) || 0) : undefined;
		return {
			...row,
			usage: cur.usage,
			contract: cur.contract,
			...(prev ? { usagePrev: prev.usage, contractPrev: prev.contract } : {}),
		};
	});

export const sumField = (rows: SeriesRow[], field: string): number | undefined =>
	rows.some((r) => r[field] !== undefined) ? rows.reduce((s, r) => s + (Number(r[field]) || 0), 0) : undefined;

export const bucketLabel = (bucket: string, grain: ReportGrain | '' | undefined): string => {
	const d = new Date(`${bucket.slice(0, 10)}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return bucket;
	return grain === 'month'
		? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
		: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

export interface DataColumn<T> {
	key: string;
	label: string;
	numeric?: boolean;
	// Raw value, also used for CSV.
	value: (row: T) => string | number;
	render?: (row: T) => ReactNode;
}

export const tableCsv = <T>(columns: DataColumn<T>[], rows: T[], footer?: T): string =>
	toCsv([
		columns.map((c) => csvSafe(c.label)),
		...[...rows, ...(footer ? [footer] : [])].map((r) => columns.map((c) => csvSafe(String(c.value(r))))),
	]);
