import { DatasetDefinition, ReportCompare, ReportGrain, ReportQueryRequest, ReportQueryResult } from '@/types/dto/Reports';
import { resolveDefinition } from '../reports/builder/builderModel';
import { metricIndexes, RangePreset, rowsFor } from '../reports/reportMath';
import { datasetRunOptions, reportRunOptions } from '../reports/useReports';

export const DASHBOARD_PRESETS = [
	'this_month',
	'last_month',
	'this_quarter',
	'this_year',
	'last_30_days',
	'last_90_days',
] as const satisfies readonly RangePreset[];
export type DashboardPreset = (typeof DASHBOARD_PRESETS)[number];

export type DashboardCompare = ReportCompare | 'none';
export const DASHBOARD_COMPARES: DashboardCompare[] = ['previous_period', 'previous_year', 'none'];

export const DASHBOARD_TABS = ['overview', 'revenue', 'customers', 'receivables', 'payments', 'credits'] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];

export interface DashboardControls {
	preset: DashboardPreset;
	compare: DashboardCompare;
	// Resolved: picked if present, else first.
	currency: string;
	range: string;
	now: Date;
}

export interface DashboardTabProps {
	controls: DashboardControls;
	goTo: (tab: DashboardTab) => void;
}

export const POINT_IN_TIME_REPORTS: ReadonlySet<string> = new Set(['total_receivables', 'receivables_aging']);

export const OVERDUE_BUCKETS = ['1-30', '31-60', '61-90', '90+'] as const;

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export const todayRange = (now: Date): string => {
	const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	const end = new Date(start);
	end.setUTCDate(end.getUTCDate() + 1);
	return `${ymd(start)}..${ymd(end)}`;
};

export type ReportOpts = Omit<ReportQueryRequest, 'range' | 'compare' | 'currency'> & {
	// Opt in to the page compare.
	compare?: boolean;
	range?: string;
};

export const reportRequest = (key: string, opts: ReportOpts, c: DashboardControls): ReportQueryRequest => {
	const { compare, range, grain, ...rest } = opts;
	if (POINT_IN_TIME_REPORTS.has(key)) return { ...rest, range: todayRange(c.now) };
	return {
		...rest,
		range: range ?? c.range,
		...(grain ? { grain } : {}),
		...(compare && c.compare !== 'none' ? { compare: c.compare } : {}),
	};
};

export const reportQ = (key: string, opts: ReportOpts, c: DashboardControls) => reportRunOptions(key, reportRequest(key, opts, c));

export type DatasetSpec = Omit<DatasetDefinition, 'family' | 'time' | 'compare'> & {
	time: { field: string; grain?: ReportGrain | ''; range?: string };
	compare?: boolean;
};

export const datasetDefinition = (spec: DatasetSpec, c: DashboardControls): DatasetDefinition => {
	const { compare, sort, limit, time, ...rest } = spec;
	const resolved = resolveDefinition(
		{
			...rest,
			family: 'dataset',
			time: { ...time, range: time.range ?? c.range },
			...(compare && c.compare !== 'none' ? { compare: c.compare } : {}),
		},
		c.now,
	);
	return { ...resolved, ...(sort ? { sort } : {}), ...(limit ? { limit } : {}) };
};

export const datasetQ = (spec: DatasetSpec, c: DashboardControls) => datasetRunOptions(datasetDefinition(spec, c));

export interface ScalarValue {
	current: string;
	prev?: string;
	pct?: string;
}

// Metric: report key or m0.
export const scalarOf = (result: ReportQueryResult | undefined, metric: string, currency: string): ScalarValue | undefined => {
	if (!result) return undefined;
	const row = rowsFor(result, currency)[0];
	const { current, prev, pct } = metricIndexes(result, metric);
	if (!row || current < 0) return undefined;
	return {
		current: row[current],
		...(prev >= 0 ? { prev: row[prev] } : {}),
		...(pct >= 0 ? { pct: row[pct] } : {}),
	};
};

export const sumWhere = (
	result: ReportQueryResult | undefined,
	metric: string,
	currency: string,
	dimension: string,
	values: readonly string[],
): number | undefined => {
	if (!result) return undefined;
	const di = result.columns.findIndex((col) => col.name === dimension);
	const mi = result.columns.findIndex((col) => col.name === metric);
	const rows = rowsFor(result, currency);
	if (di < 0 || mi < 0 || !rows.length) return undefined;
	return rows.filter((r) => values.includes(r[di])).reduce((s, r) => s + (Number(r[mi]) || 0), 0);
};

export const overdueOf = (result: ReportQueryResult | undefined, currency: string) =>
	sumWhere(result, 'receivables_aging', currency, 'aging_bucket', OVERDUE_BUCKETS);

export const currencyOf = (picked: string, currencies: string[]): string => (currencies.includes(picked) ? picked : (currencies[0] ?? ''));
