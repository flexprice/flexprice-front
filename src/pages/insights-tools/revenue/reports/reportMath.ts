import { getCurrencySymbol } from '@/utils';
import {
	ReportCatalogEntry,
	ReportCompare,
	ReportGrain,
	ReportQueryRequest,
	ReportQueryResult,
	ReportValueType,
} from '@/types/dto/Reports';

export type RangePreset = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year';
export const RANGE_PRESETS: RangePreset[] = [
	'last_7_days',
	'last_30_days',
	'last_90_days',
	'this_month',
	'last_month',
	'this_quarter',
	'this_year',
];

export interface ReportControls {
	preset: RangePreset;
	grain: ReportGrain | '';
	currency: string;
	groupBy: string;
	compare: ReportCompare | 'none';
	view: 'chart' | 'table';
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, day = 1) => new Date(Date.UTC(y, m, day));

export const rangeForPreset = (preset: RangePreset, now: Date): string => {
	const y = now.getUTCFullYear();
	const m = now.getUTCMonth();
	const tomorrow = utc(y, m, now.getUTCDate() + 1);
	const daysBack = (n: number) => `${ymd(utc(y, m, now.getUTCDate() + 1 - n))}..${ymd(tomorrow)}`;
	switch (preset) {
		case 'last_7_days':
			return daysBack(7);
		case 'last_30_days':
			return daysBack(30);
		case 'last_90_days':
			return daysBack(90);
		case 'this_month':
			return `${ymd(utc(y, m))}..${ymd(utc(y, m + 1))}`;
		case 'last_month':
			return `${ymd(utc(y, m - 1))}..${ymd(utc(y, m))}`;
		case 'this_quarter': {
			const q = Math.floor(m / 3) * 3;
			return `${ymd(utc(y, q))}..${ymd(utc(y, q + 3))}`;
		}
		case 'this_year':
			return `${ymd(utc(y, 0))}..${ymd(utc(y + 1, 0))}`;
	}
};

export const defaultControls = (entry: ReportCatalogEntry): ReportControls => ({
	preset: 'last_90_days',
	grain: entry.grains.includes('month') ? 'month' : (entry.grains[0] ?? ''),
	currency: '',
	groupBy: entry.default_shape === 'breakdown' ? (entry.dimensions[0]?.key ?? '') : '',
	compare: entry.supports_compare ? 'previous_period' : 'none',
	view: 'chart',
});

export const controlsForEntry = (entry: ReportCatalogEntry, prev: ReportControls): ReportControls => {
	const base = defaultControls(entry);
	return {
		...base,
		preset: prev.preset,
		currency: prev.currency,
		view: prev.view,
		compare: entry.supports_compare ? (prev.compare === 'none' ? base.compare : prev.compare) : 'none',
		grain: prev.grain && entry.grains.includes(prev.grain) ? prev.grain : base.grain,
		groupBy: entry.dimensions.some((d) => d.key === prev.groupBy) ? prev.groupBy : base.groupBy,
	};
};

export const buildRequest = (entry: ReportCatalogEntry, c: ReportControls, now: Date): ReportQueryRequest => {
	const snapshot = entry.kind === 'snapshot';
	const groupBy = entry.dimensions.some((d) => d.key === c.groupBy) ? c.groupBy : '';
	const shape = groupBy && entry.shapes.includes('breakdown') ? 'breakdown' : entry.default_shape;
	const req: ReportQueryRequest = { shape, range: rangeForPreset(c.preset, now) };
	if (shape === 'breakdown' && entry.dimensions.length) req.dimensions = [groupBy || entry.dimensions[0].key];
	if (shape === 'timeseries' && !snapshot && c.grain) req.grain = c.grain;
	if (c.currency) req.currency = c.currency;
	if (!snapshot && entry.supports_compare && c.compare !== 'none') req.compare = c.compare;
	return req;
};

export type DeltaTone = 'success' | 'failed' | 'default' | 'info';
export interface DeltaDisplay {
	label: string;
	tone: DeltaTone;
}

export const deltaDisplay = (
	current: string | undefined,
	prev: string | undefined,
	changePct: string | undefined,
	higherIsBetter: boolean,
): DeltaDisplay | null => {
	if (prev === undefined || prev === '') return null;
	const cur = Number(current ?? 0);
	const p = Number(prev);
	if (p === 0 && cur === 0) return { label: '—', tone: 'default' };
	if (p === 0) return { label: 'New', tone: 'info' };
	const pct = changePct !== undefined && changePct !== '' ? Number(changePct) : ((cur - p) / p) * 100;
	const label = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
	if (Math.abs(pct) < 0.5) return { label, tone: 'default' };
	const good = higherIsBetter ? pct > 0 : pct < 0;
	return { label, tone: good ? 'success' : 'failed' };
};

export const metricIndexes = (result: ReportQueryResult, key: string) => {
	const idx = (name: string) => result.columns.findIndex((c) => c.name === name);
	return { current: idx(key), prev: idx(`${key}_prev`), pct: idx(`${key}_change_pct`) };
};

const currencyIndex = (result: ReportQueryResult) => result.columns.findIndex((c) => c.name === 'currency');

export const currenciesOf = (result: ReportQueryResult): string[] => {
	const ci = currencyIndex(result);
	if (ci < 0) return [];
	return [...new Set(result.rows.map((r) => r[ci]))];
};

const rowsFor = (result: ReportQueryResult, currency: string) => {
	const ci = currencyIndex(result);
	if (ci < 0) return result.rows;
	const chosen = currency || currenciesOf(result)[0];
	return result.rows.filter((r) => r[ci] === chosen);
};

export const toSeries = (result: ReportQueryResult, key: string, currency: string) => {
	const { current, prev } = metricIndexes(result, key);
	const labelIdx = result.columns.findIndex((c) => c.role === 'dimension' && c.name !== 'currency');
	return rowsFor(result, currency).map((r) => ({
		label: labelIdx >= 0 ? r[labelIdx] : '',
		current: Number(r[current] ?? 0),
		...(prev >= 0 ? { prev: Number(r[prev] ?? 0) } : {}),
	}));
};

export const totalsFor = (result: ReportQueryResult, key: string, currency: string) => {
	const series = toSeries(result, key, currency);
	const current = series.reduce((s, p) => s + p.current, 0);
	const hasPrev = series.some((p) => p.prev !== undefined);
	return hasPrev ? { current, prev: series.reduce((s, p) => s + (p.prev ?? 0), 0) } : { current };
};

export const formatValue = (value: number, valueType: ReportValueType, currency: string): string => {
	if (valueType === 'days') return `${value.toFixed(1)} days`;
	if (valueType === 'count') return Math.round(value).toLocaleString('en-US');
	return `${getCurrencySymbol(currency.toUpperCase())}${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};
