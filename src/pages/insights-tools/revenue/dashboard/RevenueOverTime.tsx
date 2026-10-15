import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries } from '@tanstack/react-query';
import { Segmented } from '../reports/ReportControlsBar';
import { csvFilename, downloadCsv } from '../reports/reportCsv';
import { formatCompactMoney, formatValue } from '../reports/reportMath';
import DataTable from './DataTable';
import Panel from './Panel';
import { DashboardControls, DashboardGrain, GROUP_BYS, GroupBy, INVOICE_TYPES, revenueQueries } from './queries';
import {
	bucketLabel,
	DataColumn,
	mergeSeries,
	OTHER_KEY,
	PALETTE,
	pivotSeries,
	PREVIOUS_COLOR,
	SeriesRow,
	sumField,
	tableCsv,
	topKeys,
	withContract,
} from './revenueMath';
import SeriesChart, { ChartSeries } from './SeriesChart';
import { StatRow } from './Stat';
import { useCustomerNames } from './useCustomerNames';

const R = 'insightsTools.revenue.dashboard.revenue';
const RP = 'insightsTools.revenue.reports';

const USAGE_COLOR = PALETTE[0];
const CONTRACT_COLOR = PALETTE[1];

interface Props {
	controls: DashboardControls;
	// Full controls on the Revenue tab.
	full?: boolean;
	onViewReport?: () => void;
}

const RevenueOverTime = ({ controls, full = false, onViewReport }: Props) => {
	const { t } = useTranslation('settings');
	const [grainPick, setGrain] = useState<DashboardGrain>('month');
	const [view, setView] = useState<'chart' | 'table'>('chart');
	const [groupPick, setGroupBy] = useState<GroupBy>('revenue_type');
	const grain = full ? grainPick : 'month';
	const groupBy = full ? groupPick : 'revenue_type';
	const { currency } = controls;
	const [revenue, usage, grouped] = useQueries({ queries: revenueQueries(controls, grain, groupBy) });

	const base = withContract(
		mergeSeries(
			{
				revenue: { result: revenue.data, column: 'invoice_total' },
				prev: { result: revenue.data, column: 'invoice_total_prev' },
				usage: { result: usage.data, column: 'm0' },
				usagePrev: { result: usage.data, column: 'm0_prev' },
			},
			currency,
		),
	);
	const pivot =
		groupBy === 'invoice_type'
			? pivotSeries(grouped.data, 'invoice_total', 'invoice_type', currency)
			: topKeys(pivotSeries(grouped.data, 'invoice_total', 'customer_id', currency), 5);
	const names = useCustomerNames(groupBy === 'customer' ? pivot.keys : []);

	const money = (v: number) => formatValue(v, 'money', currency);
	const compact = (v: number) => formatCompactMoney(v, currency);
	const keyLabel = (k: string) => {
		if (k === OTHER_KEY) return t(`${R}.other`);
		if (groupBy === 'customer') return names[k] ?? k;
		return (INVOICE_TYPES as readonly string[]).includes(k) ? t(`${R}.invoiceTypes.${k}`) : k;
	};

	let data: SeriesRow[] = base;
	let bars: { key: string; label: string; color: string }[];
	if (groupBy === 'revenue_type') {
		bars = [
			{ key: 'usage', label: t(`${R}.usage`), color: USAGE_COLOR },
			{ key: 'contract', label: t(`${R}.contract`), color: CONTRACT_COLOR },
		];
	} else if (groupBy === 'none') {
		bars = [{ key: 'revenue', label: t(`${R}.revenue`), color: USAGE_COLOR }];
	} else {
		const byBucket = new Map(pivot.rows.map((r) => [r.bucket, r]));
		data = base.map((b) => ({
			...byBucket.get(b.bucket),
			bucket: b.bucket,
			revenue: b.revenue,
			...(b.prev !== undefined ? { prev: b.prev } : {}),
		}));
		bars = pivot.keys.map((k, i) => ({ key: k, label: keyLabel(k), color: PALETTE[i % PALETTE.length] }));
	}

	const total = sumField(base, 'revenue');
	const totalPrev = sumField(base, 'prev');
	const hasPrev = totalPrev !== undefined;
	const series: ChartSeries[] = [
		...bars.map((b) => ({ ...b, total: compact(sumField(data, b.key) ?? 0) })),
		...(hasPrev ? [{ key: 'prev', label: t(`${R}.previous`), color: PREVIOUS_COLOR, kind: 'line' as const, dashed: true }] : []),
	];

	const stats = [
		{ label: t(`${R}.total`), value: total !== undefined ? money(total) : '—', current: total, prev: totalPrev },
		...(full
			? [
					{
						label: t(`${R}.usage`),
						value: money(sumField(base, 'usage') ?? 0),
						current: sumField(base, 'usage'),
						prev: sumField(base, 'usagePrev'),
					},
					{
						label: t(`${R}.contract`),
						value: money(sumField(base, 'contract') ?? 0),
						current: sumField(base, 'contract'),
						prev: sumField(base, 'contractPrev'),
					},
				]
			: []),
	];

	const xLabel = (b: string) => bucketLabel(b, grain);
	const columns: DataColumn<SeriesRow>[] = [
		{ key: 'bucket', label: t(`${R}.period`), value: (r) => r.bucket, render: (r) => xLabel(r.bucket) },
		...bars.map((b) => ({
			key: b.key,
			label: b.label,
			numeric: true,
			value: (r: SeriesRow) => Number(r[b.key]) || 0,
			render: (r: SeriesRow) => money(Number(r[b.key]) || 0),
		})),
		...(groupBy === 'none'
			? []
			: [
					{
						key: 'revenue',
						label: t(`${R}.total`),
						numeric: true,
						value: (r: SeriesRow) => Number(r.revenue) || 0,
						render: (r: SeriesRow) => money(Number(r.revenue) || 0),
					},
				]),
		...(hasPrev
			? [
					{
						key: 'prev',
						label: t(`${R}.previous`),
						numeric: true,
						value: (r: SeriesRow) => Number(r.prev) || 0,
						render: (r: SeriesRow) => money(Number(r.prev) || 0),
					},
				]
			: []),
	];
	const footer: SeriesRow = Object.fromEntries([
		['bucket', t(`${RP}.total`)],
		...columns.slice(1).map((c) => [c.key, sumField(data, c.key) ?? 0]),
	]) as SeriesRow;

	const actions = full && (
		<>
			<Segmented
				label={t(`${RP}.grain`)}
				labelPosition='none'
				value={grain}
				options={(['day', 'month'] as const).map((g) => ({ value: g, label: t(`${RP}.grains.${g}`) }))}
				onPick={(v) => setGrain(v as DashboardGrain)}
			/>
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
		</>
	);

	return (
		<Panel
			title={t(`${R}.overTime`)}
			definition={t(`${R}.overTimeDef`)}
			onViewReport={onViewReport}
			actions={actions}
			onDownloadCsv={
				full && view === 'table'
					? () => downloadCsv(csvFilename('revenue_over_time', controls.range), tableCsv(columns, data, footer))
					: undefined
			}
			loading={revenue.isLoading || usage.isLoading || grouped.isLoading}
			error={revenue.isError || usage.isError || grouped.isError}
			empty={base.length === 0}>
			<StatRow stats={stats} />
			{full && (
				<Segmented
					label={t(`${R}.groupBy`)}
					labelPosition='start'
					value={groupBy}
					options={GROUP_BYS.map((g) => ({ value: g, label: t(`${R}.groupBys.${g}`) }))}
					onPick={(v) => setGroupBy(v as GroupBy)}
				/>
			)}
			{view === 'table' && full ? (
				<DataTable columns={columns} rows={data} rowKey={(r) => r.bucket} footer={footer} />
			) : (
				<SeriesChart data={data} series={series} xLabel={xLabel} format={compact} stacked />
			)}
		</Panel>
	);
};

export default RevenueOverTime;
