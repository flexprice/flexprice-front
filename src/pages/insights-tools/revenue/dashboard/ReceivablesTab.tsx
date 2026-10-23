import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Segmented } from '../reports/ReportControlsBar';
import { csvFilename, downloadCsv } from '../reports/reportCsv';
import { formatCompactMoney, formatValue } from '../reports/reportMath';
import { CUSTOMER_LIMIT } from './CustomersTab';
import DataTable from './DataTable';
import Panel from './Panel';
import {
	AGING_BUCKETS,
	agingBucketOf,
	agingQ,
	DashboardControls,
	DashboardTabProps,
	datasetQ,
	numOf,
	outstandingQ,
	OVERDUE_BUCKETS,
	overdueOf,
	recordsOf,
	reportQ,
	scalarOf,
	sumWhere,
	todayRange,
	untilTodayRange,
} from './queries';
import RankedBars from './RankedBars';
import { DataColumn, tableCsv } from './revenueMath';
import { SeriesLegend } from './SeriesChart';
import { StatRow } from './Stat';

const RC = 'insightsTools.revenue.dashboard.receivables';
const RP = 'insightsTools.revenue.reports';
const O = 'insightsTools.revenue.dashboard.overview';
const K = 'insightsTools.revenue.dashboard.kpi';

type AgingBucket = (typeof AGING_BUCKETS)[number];

const AGING_COLORS: Record<AgingBucket, string> = {
	Current: '#cbd5e1',
	'1-30': '#f87171',
	'31-60': '#ef4444',
	'61-90': '#b91c1c',
	'90+': '#7f1d1d',
	'No due date': '#e5e7eb',
};

export interface OverdueCustomer {
	id: string;
	name: string;
	invoices: number;
	amount: number;
	days: number;
	// Sum of every aging bucket.
	outstanding?: number;
	buckets: Partial<Record<AgingBucket, number>>;
}

const useOverdueCustomers = (controls: DashboardControls) => {
	const { currency } = controls;
	const overdue = useQuery({
		...datasetQ(
			{
				dataset: 'invoices',
				measures: [{ agg: 'sum', field: 'amount_remaining' }, { agg: 'count' }, { agg: 'max', field: 'days_overdue' }],
				dimensions: ['customer'],
				filters: [
					{ field: 'days_overdue', op: 'gt' as const, value: ['0'] },
					{ field: 'currency', op: 'eq' as const, value: [currency] },
				],
				time: { field: 'due_date', range: untilTodayRange(controls.now) },
				sort: [{ field: 'm0', dir: 'desc' }],
				limit: CUSTOMER_LIMIT,
			},
			controls,
		),
		enabled: !!currency,
	});
	const base = recordsOf(overdue.data, currency).filter((r) => r.customer);
	const ids = base.map((r) => r.customer);
	// Buckets only for the listed customers.
	const aging = useQuery({
		...reportQ(
			'receivables_aging',
			{
				shape: 'breakdown',
				dimensions: ['aging_bucket', 'customer_id'],
				filters: [{ field: 'customer_id', op: 'in' as const, value: ids }],
			},
			controls,
		),
		enabled: overdue.isSuccess && ids.length > 0,
	});
	const buckets = new Map<string, Partial<Record<AgingBucket, number>>>();
	for (const r of recordsOf(aging.data, currency)) {
		const b = r.aging_bucket as AgingBucket;
		if (!AGING_BUCKETS.includes(b)) continue;
		const acc = buckets.get(r.customer_id) ?? {};
		acc[b] = (acc[b] ?? 0) + (numOf(r.receivables_aging) ?? 0);
		buckets.set(r.customer_id, acc);
	}
	const rows: OverdueCustomer[] = base.map((r) => {
		const own = buckets.get(r.customer);
		return {
			id: r.customer,
			name: r.customer_label || r.customer,
			amount: numOf(r.m0) ?? 0,
			invoices: numOf(r.m1) ?? 0,
			days: numOf(r.m2) ?? 0,
			outstanding: own ? Object.values(own).reduce((s, v) => s + v, 0) : undefined,
			buckets: own ?? {},
		};
	});
	return {
		rows,
		loading: overdue.isLoading || aging.isLoading,
		error: overdue.isError || aging.isError,
	};
};

type OverdueData = ReturnType<typeof useOverdueCustomers>;

interface BucketRow {
	bucket: string;
	label: string;
	amount: number;
	share: number;
}

export const AgingPanel = ({ controls, data }: { controls: DashboardControls; data: OverdueData }) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const [view, setView] = useState<'chart' | 'table'>('chart');
	const [outstanding, aging] = useQueries({ queries: [outstandingQ(controls), agingQ(controls)] });
	const out = numOf(scalarOf(outstanding.data, 'total_receivables', currency)?.current);
	const overdue = overdueOf(aging.data, currency);
	const hasRows = sumWhere(aging.data, 'receivables_aging', currency, 'aging_bucket', AGING_BUCKETS) !== undefined;
	const amounts = AGING_BUCKETS.map((b) => sumWhere(aging.data, 'receivables_aging', currency, 'aging_bucket', [b]) ?? 0);
	const total = amounts.reduce((s, v) => s + v, 0);
	const rows: BucketRow[] = AGING_BUCKETS.map((b, i) => ({
		bucket: b,
		label: t(`${O}.agingBuckets.${b}`),
		amount: amounts[i],
		share: total > 0 ? (amounts[i] / total) * 100 : 0,
	}));
	const money = (v: number | undefined) => (v !== undefined ? formatValue(v, 'money', currency) : '—');
	const pct = overdue !== undefined && out ? `${((overdue / out) * 100).toFixed(1)}%` : '—';
	const columns: DataColumn<BucketRow>[] = [
		{ key: 'bucket', label: t(`${RC}.bucket`), value: (r) => r.label },
		{ key: 'amount', label: t(`${RC}.amount`), numeric: true, value: (r) => r.amount, render: (r) => money(r.amount) },
		{ key: 'share', label: t(`${RC}.share`), numeric: true, value: (r) => r.share.toFixed(1), render: (r) => `${r.share.toFixed(1)}%` },
	];
	const footer: BucketRow = { bucket: 'total', label: t(`${RP}.total`), amount: total, share: total > 0 ? 100 : 0 };
	return (
		<Panel
			title={t(`${O}.aging`)}
			definition={t(`${RC}.agingDef`)}
			pointInTime
			actions={
				<Segmented
					label={t(`${RP}.view`)}
					labelPosition='none'
					value={view}
					options={[
						{ value: 'chart', label: t(`${RP}.chart`) },
						{ value: 'table', label: t(`${RP}.table`) },
					]}
					onPick={(v) => setView(v as 'chart' | 'table')}
				/>
			}
			onDownloadCsv={
				view === 'table'
					? () => downloadCsv(csvFilename('receivables_aging', todayRange(controls.now)), tableCsv(columns, rows, footer))
					: undefined
			}
			loading={outstanding.isLoading || aging.isLoading}
			error={outstanding.isError || aging.isError}
			empty={!hasRows}>
			<StatRow
				stats={[
					{ label: t(`${K}.outstanding`), value: money(out) },
					{
						label: t(`${K}.overdue`),
						value: money(overdue),
						note:
							data.loading || data.error
								? t(`${RC}.overdueNoteUnknown`, { pct })
								: t(`${RC}.overdueNote`, { pct, count: data.rows.length }),
					},
					{ label: t(`${O}.agingBuckets.Current`), value: money(amounts[0]) },
					{ label: t(`${O}.agingBuckets.No due date`), value: money(amounts[AGING_BUCKETS.length - 1]) },
				]}
			/>
			{view === 'chart' ? (
				<>
					<RankedBars
						items={rows.map((r) => ({ key: r.bucket, label: r.label, value: r.amount, color: AGING_COLORS[r.bucket as AgingBucket] }))}
						format={(v) => formatCompactMoney(v, currency)}
						vertical
					/>
					<SeriesLegend
						series={rows.map((r) => ({
							key: r.bucket,
							label: r.label,
							color: AGING_COLORS[r.bucket as AgingBucket],
							total: `${r.share.toFixed(1)}%`,
						}))}
					/>
				</>
			) : (
				<DataTable columns={columns} rows={rows} rowKey={(r) => r.bucket} footer={footer} />
			)}
			<p className='text-xs text-content-zinc-tertiary'>{t(`${RC}.pointInTimeNote`)}</p>
		</Panel>
	);
};

const overdueOfRow = (r: OverdueCustomer) => OVERDUE_BUCKETS.reduce((s, b) => s + (r.buckets[b] ?? 0), 0);

export const OverdueByCustomer = ({ controls, data }: { controls: DashboardControls; data: OverdueData }) => {
	const { t } = useTranslation('settings');
	const items = data.rows
		.map((r) => ({ key: r.id, label: r.name, value: overdueOfRow(r), parts: OVERDUE_BUCKETS.map((b) => r.buckets[b] ?? 0) }))
		.filter((i) => i.value > 0)
		.sort((a, b) => b.value - a.value)
		.slice(0, 8);
	return (
		<Panel
			title={t(`${RC}.byCustomer`)}
			definition={t(`${RC}.byCustomerDef`)}
			pointInTime
			loading={data.loading}
			error={data.error}
			empty={items.length === 0}>
			<RankedBars
				items={items}
				colors={OVERDUE_BUCKETS.map((b) => AGING_COLORS[b])}
				format={(v) => formatCompactMoney(v, controls.currency)}
			/>
			<SeriesLegend series={OVERDUE_BUCKETS.map((b) => ({ key: b, label: t(`${O}.agingBuckets.${b}`), color: AGING_COLORS[b] }))} />
		</Panel>
	);
};

export const OverdueCustomers = ({ controls, data }: { controls: DashboardControls; data: OverdueData }) => {
	const { t } = useTranslation('settings');
	const { currency, now } = controls;
	const money = (v: number) => formatValue(v, 'money', currency);
	const oldest = (r: OverdueCustomer) =>
		t(`${RC}.oldestDueValue`, {
			date: new Date(now.getTime() - r.days * 86_400_000).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				timeZone: 'UTC',
			}),
			days: r.days,
		});
	const columns: DataColumn<OverdueCustomer>[] = [
		{ key: 'customer', label: t(`${RC}.customer`), value: (r) => r.name },
		{ key: 'invoices', label: t(`${RC}.invoices`), numeric: true, value: (r) => r.invoices },
		{ key: 'amount', label: t(`${RC}.overdueAmount`), numeric: true, value: (r) => r.amount, render: (r) => money(r.amount) },
		{
			key: 'outstanding',
			label: t(`${K}.outstanding`),
			numeric: true,
			value: (r) => r.outstanding ?? '',
			render: (r) => (r.outstanding !== undefined ? money(r.outstanding) : '—'),
		},
		{ key: 'oldest', label: t(`${RC}.oldestDue`), value: oldest },
		{ key: 'aging', label: t(`${RC}.agingColumn`), value: (r) => t(`${O}.agingBuckets.${agingBucketOf(r.days)}`) },
	];
	return (
		<Panel
			title={t(`${RC}.customers`)}
			definition={t(`${RC}.customersDef`)}
			pointInTime
			onDownloadCsv={() => downloadCsv(csvFilename('overdue_customers', todayRange(now)), tableCsv(columns, data.rows))}
			csvDisabled={data.rows.length === 0}
			loading={data.loading}
			error={data.error}
			empty={data.rows.length === 0}>
			<div className='max-h-[36rem] overflow-y-auto'>
				<DataTable columns={columns} rows={data.rows} rowKey={(r) => r.id} />
			</div>
		</Panel>
	);
};

const ReceivablesTab = ({ controls }: DashboardTabProps) => {
	const data = useOverdueCustomers(controls);
	return (
		<div className='flex flex-col gap-6'>
			<AgingPanel controls={controls} data={data} />
			<OverdueByCustomer controls={controls} data={data} />
			<OverdueCustomers controls={controls} data={data} />
		</div>
	);
};

export default ReceivablesTab;
