import { getCurrencySymbol } from '@/utils';
import {
	ReportCatalogEntry,
	ReportCompare,
	ReportFilter,
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
	filters: ReportFilter[];
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, day = 1) => new Date(Date.UTC(y, m, day));

export const rangeForPreset = (preset: RangePreset, now: Date): string => {
	const y = now.getUTCFullYear();
	const m = now.getUTCMonth();
	const d = now.getUTCDate();
	const today = utc(y, m, d);
	// Through yesterday; today if period starts today.
	const toDate = (start: Date) => `${ymd(start)}..${ymd(start < today ? today : utc(y, m, d + 1))}`;
	switch (preset) {
		case 'last_7_days':
			return toDate(utc(y, m, d - 7));
		case 'last_30_days':
			return toDate(utc(y, m, d - 30));
		case 'last_90_days':
			return toDate(utc(y, m, d - 90));
		case 'this_month':
			return toDate(utc(y, m));
		case 'last_month':
			return `${ymd(utc(y, m - 1))}..${ymd(utc(y, m))}`;
		case 'this_quarter':
			return toDate(utc(y, Math.floor(m / 3) * 3));
		case 'this_year':
			return toDate(utc(y, 0));
	}
};

// Worst-case span in days per preset.
export const PRESET_MAX_DAYS: Record<RangePreset, number> = {
	last_7_days: 7,
	last_30_days: 30,
	last_90_days: 90,
	this_month: 31,
	last_month: 31,
	this_quarter: 92,
	this_year: 366,
};

export const presetAllowed = (source: { max_range_days?: number }, preset: RangePreset): boolean =>
	!source.max_range_days || PRESET_MAX_DAYS[preset] <= source.max_range_days;

const defaultPreset = (entry: ReportCatalogEntry): RangePreset =>
	(['last_90_days', 'last_30_days', 'last_7_days'] as const).find((p) => presetAllowed(entry, p)) ?? 'last_7_days';

export const defaultControls = (entry: ReportCatalogEntry): ReportControls => ({
	preset: defaultPreset(entry),
	grain: entry.grains.includes('month') ? 'month' : (entry.grains[0] ?? ''),
	currency: '',
	groupBy: entry.default_shape === 'breakdown' ? (entry.dimensions[0]?.key ?? '') : '',
	compare: entry.supports_compare ? 'previous_period' : 'none',
	view: 'chart',
	filters: [],
});

export const controlsForEntry = (entry: ReportCatalogEntry, prev: ReportControls): ReportControls => {
	const base = defaultControls(entry);
	return {
		...base,
		preset: presetAllowed(entry, prev.preset) ? prev.preset : base.preset,
		currency: prev.currency,
		view: prev.view,
		compare: entry.supports_compare ? prev.compare : 'none',
		grain: prev.grain && entry.grains.includes(prev.grain) ? prev.grain : base.grain,
		groupBy: entry.dimensions.some((d) => d.key === prev.groupBy) ? prev.groupBy : base.groupBy,
		filters: prev.filters.filter((f) => entry.dimensions.some((d) => d.key === f.field)),
	};
};

export const buildRequest = (entry: ReportCatalogEntry, c: ReportControls, now: Date): ReportQueryRequest => {
	const snapshot = entry.kind === 'snapshot';
	const groupBy = entry.dimensions.some((d) => d.key === c.groupBy) ? c.groupBy : '';
	const shape = groupBy && entry.shapes.includes('breakdown') ? 'breakdown' : entry.default_shape;
	const req: ReportQueryRequest = { shape, range: rangeForPreset(c.preset, now) };
	if (shape === 'breakdown' && entry.dimensions.length) req.dimensions = [groupBy || entry.dimensions[0].key];
	if (shape === 'timeseries' && !snapshot && c.grain) req.grain = c.grain;
	if (!snapshot && entry.supports_compare && c.compare !== 'none') req.compare = c.compare;
	const filters = c.filters.filter((f) => entry.dimensions.some((d) => d.key === f.field));
	if (filters.length) req.filters = filters;
	return req;
};

export type DeltaTone = 'success' | 'failed' | 'default' | 'info';
export interface DeltaDisplay {
	label: string;
	tone: DeltaTone;
	kind: 'pct' | 'new' | 'flat-zero';
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
	if (!Number.isFinite(cur) || !Number.isFinite(p)) return null;
	if (p === 0 && cur === 0) return { label: '—', tone: 'default', kind: 'flat-zero' };
	if (p === 0) return { label: 'New', tone: 'info', kind: 'new' };
	const pct = changePct !== undefined && changePct !== '' ? Number(changePct) : ((cur - p) / p) * 100;
	if (!Number.isFinite(pct)) return null;
	const rounded = Number(pct.toFixed(1)) + 0;
	const label = `${rounded >= 0 ? '+' : ''}${rounded.toFixed(1)}%`;
	if (Math.abs(pct) < 0.5) return { label, tone: 'default', kind: 'pct' };
	const good = higherIsBetter ? cur > p : cur < p;
	return { label, tone: good ? 'success' : 'failed', kind: 'pct' };
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

export const rowsFor = (result: ReportQueryResult, currency: string) => {
	const ci = currencyIndex(result);
	if (ci < 0) return result.rows;
	const chosen = currency || currenciesOf(result)[0];
	return result.rows.filter((r) => r[ci] === chosen);
};

const finite = (v: string | undefined) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const toSeries = (result: ReportQueryResult, key: string, currency: string) => {
	const { current, prev } = metricIndexes(result, key);
	const labelIdx = result.columns.findIndex((c) => c.role === 'dimension' && c.name !== 'currency');
	return rowsFor(result, currency).map((r) => ({
		label: labelIdx >= 0 ? r[labelIdx] : '',
		current: finite(r[current]),
		...(prev >= 0 ? { prev: finite(r[prev]) } : {}),
	}));
};

export const totalsFor = (result: ReportQueryResult, key: string, currency: string) => {
	const series = toSeries(result, key, currency);
	const current = series.reduce((s, p) => s + p.current, 0);
	const hasPrev = series.some((p) => p.prev !== undefined);
	return hasPrev ? { current, prev: series.reduce((s, p) => s + (p.prev ?? 0), 0) } : { current };
};

export const inclusiveEnd = (iso: string): string => {
	const d = new Date(iso);
	d.setUTCDate(d.getUTCDate() - 1);
	return ymd(d);
};

export const isBucketInProgress = (bucketIso: string, grain: ReportGrain | '' | undefined, now: Date): boolean => {
	if (!grain) return false;
	const start = new Date(bucketIso);
	if (Number.isNaN(start.getTime())) return false;
	const y = start.getUTCFullYear();
	const m = start.getUTCMonth();
	const d = start.getUTCDate();
	const end = grain === 'month' ? Date.UTC(y, m + 1, d) : Date.UTC(y, m, d + (grain === 'week' ? 7 : 1));
	return end > now.getTime();
};

const TO_DATE_PRESETS: RangePreset[] = ['this_month', 'this_quarter', 'this_year'];
export const isToDatePreset = (preset: RangePreset): boolean => TO_DATE_PRESETS.includes(preset);

// Builder measures add plain decimal numbers.
export type ValueFormat = ReportValueType | 'number';

export const formatValue = (
	value: number,
	valueType: ValueFormat,
	currency: string,
	daysLabel: (v: string) => string = (v) => `${v} days`,
): string => {
	if (valueType === 'days') return daysLabel(value.toFixed(1));
	if (valueType === 'count') return Math.round(value).toLocaleString('en-US');
	if (valueType === 'number') return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
	const sign = value < 0 ? '-' : '';
	return `${sign}${getCurrencySymbol(currency.toUpperCase())}${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

export const formatCompactMoney = (value: number, currency: string): string => {
	const sign = value < 0 ? '-' : '';
	const n = Math.abs(value).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });
	return `${sign}${getCurrencySymbol(currency.toUpperCase())}${n}`;
};
