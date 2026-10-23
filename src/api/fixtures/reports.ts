import { ReportCatalogEntry, ReportCatalogResponse, ReportColumn, ReportQueryRequest, ReportQueryResult } from '@/types/dto/Reports';

const money = (
	key: string,
	name: string,
	description: string,
	category: ReportCatalogEntry['category'],
	dims: [string, string][],
	higher = true,
): ReportCatalogEntry => ({
	key,
	name,
	description,
	category,
	kind: 'flow',
	value_type: 'money',
	improvement: higher ? 'higher' : 'lower',
	shapes: ['scalar', 'timeseries', 'breakdown'],
	default_shape: 'timeseries',
	dimensions: dims.map(([k, label]) => ({ key: k, label })),
	grains: ['day', 'week', 'month'],
	supports_compare: true,
});

const CATALOG: ReportCatalogEntry[] = [
	money('invoice_total', 'Total billing', 'Sum of finalized invoice totals in the period', 'billing', [
		['customer_id', 'Customer'],
		['invoice_type', 'Invoice type'],
	]),
	money('net_billing', 'Net billing', 'Total billing minus finalized credit notes', 'billing', []),
	{
		key: 'total_receivables',
		name: 'Total receivables',
		description: 'Outstanding amount on finalized invoices today',
		category: 'receivables',
		kind: 'snapshot',
		value_type: 'money',
		improvement: 'lower',
		shapes: ['scalar'],
		default_shape: 'scalar',
		dimensions: [],
		grains: [],
		supports_compare: false,
	},
	{
		key: 'receivables_aging',
		name: 'Receivables aging',
		description: 'Overdue amount by days past due',
		category: 'receivables',
		kind: 'snapshot',
		value_type: 'money',
		improvement: 'lower',
		shapes: ['breakdown'],
		default_shape: 'breakdown',
		dimensions: [
			{ key: 'aging_bucket', label: 'Aging bucket' },
			{ key: 'customer_id', label: 'Customer' },
		],
		grains: [],
		supports_compare: false,
	},
	{
		key: 'days_to_pay',
		name: 'Days to pay',
		description: 'Average days from issue to payment for paid invoices',
		category: 'receivables',
		kind: 'ratio',
		value_type: 'days',
		improvement: 'lower',
		shapes: ['scalar', 'timeseries'],
		default_shape: 'timeseries',
		dimensions: [],
		grains: ['week', 'month'],
		supports_compare: true,
	},
	{
		key: 'active_customers',
		name: 'Active customers',
		description: 'Customers with an active or trialing subscription',
		category: 'customers',
		kind: 'flow',
		value_type: 'count',
		improvement: 'higher',
		shapes: ['scalar', 'timeseries'],
		default_shape: 'timeseries',
		dimensions: [],
		grains: ['week', 'month'],
		supports_compare: true,
	},
	{
		key: 'arpu',
		name: 'ARPU',
		description: 'Billed revenue per billed customer',
		category: 'customers',
		kind: 'ratio',
		value_type: 'money',
		improvement: 'higher',
		shapes: ['scalar', 'timeseries'],
		default_shape: 'timeseries',
		dimensions: [],
		grains: ['month'],
		supports_compare: true,
		variant_label: 'Billed',
	},
	{
		key: 'arpu_paid',
		name: 'ARPU (paid)',
		description: 'Paid revenue per paying customer',
		category: 'customers',
		kind: 'ratio',
		value_type: 'money',
		improvement: 'higher',
		shapes: ['scalar', 'timeseries'],
		default_shape: 'timeseries',
		dimensions: [],
		grains: ['month'],
		supports_compare: true,
		variant_of: 'arpu',
		variant_label: 'Paid',
	},
	money('credit_consumption', 'Credit consumption', 'Wallet credits applied to invoices', 'credits', [['customer_id', 'Customer']]),
	money('credit_topups', 'Credit top-ups', 'Purchased, free and subscription credit grants', 'credits', [
		['transaction_reason', 'Reason'],
		['customer_id', 'Customer'],
	]),
	{
		key: 'events_volume',
		name: 'Events volume',
		description: 'Usage events ingested',
		category: 'usage',
		kind: 'flow',
		value_type: 'count',
		improvement: 'higher',
		shapes: ['scalar', 'timeseries', 'breakdown'],
		default_shape: 'timeseries',
		dimensions: [{ key: 'meter_id', label: 'Meter' }],
		grains: ['day', 'week', 'month'],
		supports_compare: true,
		max_range_days: 7,
	},
];

export const mockCatalog = (): ReportCatalogResponse => ({ items: CATALOG });

const BUCKETS = [
	'2026-05-01T00:00:00Z',
	'2026-06-01T00:00:00Z',
	'2026-07-01T00:00:00Z',
	'2026-08-01T00:00:00Z',
	'2026-09-01T00:00:00Z',
	'2026-10-01T00:00:00Z',
];
const BASE: Record<string, number> = {
	invoice_total: 412000,
	net_billing: 399000,
	total_receivables: 1214600,
	receivables_aging: 180000,
	days_to_pay: 16.4,
	active_customers: 1720,
	arpu: 263,
	arpu_paid: 241,
	credit_consumption: 52000,
	credit_topups: 61000,
	events_volume: 18400000,
};
const BREAKDOWN_LABELS: Record<string, string[]> = {
	customer_id: ['Northwind Labs', 'Bluefin Analytics', 'Corvid Systems', 'Lattice Health', 'Orbital Freight'],
	invoice_type: ['SUBSCRIPTION', 'ONE_OFF', 'CREDIT'],
	transaction_reason: ['PURCHASED_CREDIT_DIRECT', 'FREE_CREDIT_GRANT', 'SUBSCRIPTION_CREDIT_GRANT', 'PURCHASED_CREDIT_BONUS'],
	aging_bucket: ['0-30', '31-60', '61-90', '90+'],
	meter_id: ['api_calls', 'storage_gb', 'compute_minutes'],
};

const round = (n: number) => (Math.round(n * 100) / 100).toString();
const pct = (cur: number, prev: number) => (prev === 0 ? '' : (Math.round(((cur - prev) / prev) * 1000) / 10).toString());

export const mockRun = (key: string, req: ReportQueryRequest): ReportQueryResult => {
	const entry = CATALOG.find((e) => e.key === key);
	const base = BASE[key] ?? 1000;
	const compare = !!req.compare && !!entry?.supports_compare;
	const metricCols: ReportColumn[] = [{ name: key, type: 'decimal', role: 'metric' }];
	if (compare) {
		metricCols.push(
			{ name: `${key}_prev`, type: 'decimal', role: 'metric' },
			{ name: `${key}_change_pct`, type: 'decimal', role: 'metric' },
		);
	}
	const metricValues = (cur: number, prev: number): string[] => (compare ? [round(cur), round(prev), pct(cur, prev)] : [round(cur)]);
	const parsed = /^\d{4}-\d{2}-\d{2}\.\.\d{4}-\d{2}-\d{2}$/.test(req.range);
	const [from, to] = parsed ? req.range.split('..') : ['2026-05-01', '2026-11-01'];
	const meta = {
		query_source: 'mock',
		from: `${from}T00:00:00Z`,
		to: `${to}T00:00:00Z`,
		...(compare ? { prev_from: '2026-08-01T00:00:00Z', prev_to: '2026-09-01T00:00:00Z' } : {}),
	};
	const inRange = (b: string) => b.slice(0, 7) >= from.slice(0, 7) && b < to;

	if (req.shape === 'timeseries') {
		const columns: ReportColumn[] = [
			{ name: 'bucket', type: 'datetime', role: 'dimension' },
			{ name: 'currency', type: 'string', role: 'dimension' },
			...metricCols,
		];
		const rows = BUCKETS.map((b, i) => [b, 'usd', ...metricValues(base * (1 + i * 0.04), base * (0.95 + i * 0.035))]).filter((r) =>
			inRange(r[0]),
		);
		return { columns, rows, meta };
	}
	if (req.shape === 'breakdown') {
		const dim = req.dimensions?.[0] ?? entry?.dimensions[0]?.key ?? 'customer_id';
		const labels = BREAKDOWN_LABELS[dim] ?? ['a', 'b', 'c'];
		const columns: ReportColumn[] = [
			{ name: dim, type: 'string', role: 'dimension' },
			{ name: 'currency', type: 'string', role: 'dimension' },
			...metricCols,
		];
		const rows = labels.map((l, i) => [l, 'usd', ...metricValues(base / (i + 2), i === 1 ? 0 : base / (i + 2.3))]);
		return { columns, rows, meta };
	}
	const columns: ReportColumn[] = [{ name: 'currency', type: 'string', role: 'dimension' }, ...metricCols];
	return {
		columns,
		rows: [
			['usd', ...metricValues(base, base * 0.92)],
			['eur', ...metricValues(base * 0.18, base * 0.2)],
		],
		meta,
	};
};
