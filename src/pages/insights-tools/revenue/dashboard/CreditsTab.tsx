import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Segmented } from '../reports/ReportControlsBar';
import { csvFilename, downloadCsv } from '../reports/reportCsv';
import { rangeForPreset } from '../reports/reportMath';
import DataTable from './DataTable';
import Panel from './Panel';
import { DashboardControls, DashboardGrain, DashboardTabProps, datasetQ, numOf, recordsOf, reportQ } from './queries';
import RankedBars from './RankedBars';
import { bucketLabel, DataColumn, mergeSeries, PALETTE, SeriesRow, sumField, tableCsv } from './revenueMath';
import SeriesChart, { SeriesLegend } from './SeriesChart';
import { StatRow } from './Stat';

const C = 'insightsTools.revenue.dashboard.credits';
const O = 'insightsTools.revenue.dashboard.overview';
const RP = 'insightsTools.revenue.reports';

const CONSUMED_COLOR = PALETTE[0];
const TOPPED_UP_COLOR = PALETTE[2];

const TOPUP_REASONS = {
	purchased: ['PURCHASED_CREDIT_DIRECT', 'PURCHASED_CREDIT_INVOICED'],
	subscription: ['SUBSCRIPTION_CREDIT_GRANT'],
	free: ['FREE_CREDIT_GRANT'],
	bonus: ['PURCHASED_CREDIT_BONUS'],
} as const;
type ReasonGroup = keyof typeof TOPUP_REASONS;
const REASON_GROUPS = Object.keys(TOPUP_REASONS) as ReasonGroup[];
const REASON_COLORS = [PALETTE[0], PALETTE[2], PALETTE[3], PALETTE[4]];
const ALL_REASONS = REASON_GROUPS.flatMap((g) => [...TOPUP_REASONS[g]]);

const EVENT_DAYS = 7;

const full = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });
const compact = (v: number) => v.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const signed = (v: number) => `${v > 0 ? '+' : ''}${full(v)}`;

export const CreditFlow = ({ controls }: { controls: DashboardControls }) => {
	const { t } = useTranslation('settings');
	const [grain, setGrain] = useState<DashboardGrain>('month');
	const [view, setView] = useState<'chart' | 'table'>('chart');
	const [topups, consumption] = useQueries({
		queries: [
			reportQ('credit_topups', { shape: 'timeseries', grain }, controls),
			reportQ('credit_consumption', { shape: 'timeseries', grain, dimensions: ['credit_type'] }, controls),
		],
	});
	const topupRows = mergeSeries({ topups: { result: topups.data, column: 'credit_topups' } }, controls.currency);
	const creditRows = recordsOf(consumption.data, controls.currency);
	const consumptionByBucket = new Map<string, { free: number; paid: number }>();
	for (const row of creditRows) {
		const bucket = row.bucket ?? '';
		const type = row.credit_type ?? '';
		const value = numOf(row.credit_consumption) ?? 0;
		const current = consumptionByBucket.get(bucket) ?? { free: 0, paid: 0 };
		if (type === 'paid') current.paid += value;
		else if (type === 'free') current.free += value;
		consumptionByBucket.set(bucket, current);
	}
	const topupByBucket = new Map(topupRows.map((row) => [row.bucket, Number(row.topups) || 0]));
	const buckets = new Set([...topupByBucket.keys(), ...consumptionByBucket.keys()]);
	const data = [...buckets].sort().map((bucket) => {
		const split = consumptionByBucket.get(bucket) ?? { free: 0, paid: 0 };
		const consumed = split.free + split.paid;
		const toppedUp = topupByBucket.get(bucket) ?? 0;
		return { bucket, topups: toppedUp, consumed, free: split.free, paid: split.paid, net: toppedUp - consumed };
	});
	const toppedUp = sumField(data, 'topups');
	const consumed = sumField(data, 'consumed');
	const free = sumField(data, 'free');
	const paid = sumField(data, 'paid');
	const net = toppedUp !== undefined || consumed !== undefined ? (toppedUp ?? 0) - (consumed ?? 0) : undefined;
	const xLabel = (b: string) => bucketLabel(b, grain);
	const cell = (key: string) => (r: SeriesRow) => Number(r[key]) || 0;
	const columns: DataColumn<SeriesRow>[] = [
		{ key: 'bucket', label: t(`${C}.period`), value: (r) => r.bucket, render: (r) => xLabel(r.bucket) },
		{ key: 'topups', label: t(`${O}.toppedUp`), numeric: true, value: cell('topups'), render: (r) => full(cell('topups')(r)) },
		{ key: 'consumed', label: t(`${O}.consumed`), numeric: true, value: cell('consumed'), render: (r) => full(cell('consumed')(r)) },
		{ key: 'free', label: t(`${C}.free`), numeric: true, value: cell('free'), render: (r) => full(cell('free')(r)) },
		{ key: 'paid', label: t(`${C}.paid`), numeric: true, value: cell('paid'), render: (r) => full(cell('paid')(r)) },
		{ key: 'net', label: t(`${C}.net`), numeric: true, value: cell('net'), render: (r) => signed(cell('net')(r)) },
	];
	const footer = { bucket: t(`${RP}.total`), topups: toppedUp ?? 0, consumed: consumed ?? 0, net: net ?? 0 };
	return (
		<Panel
			title={t(`${O}.credits`)}
			definition={t(`${C}.flowDef`)}
			actions={
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
			}
			onDownloadCsv={
				view === 'table' ? () => downloadCsv(csvFilename('credit_flow', controls.range), tableCsv(columns, data, footer)) : undefined
			}
			loading={topups.isLoading || consumption.isLoading}
			error={topups.isError || consumption.isError}
			empty={data.length === 0}>
			<StatRow
				stats={[
					{ label: t(`${O}.toppedUp`), value: toppedUp !== undefined ? full(toppedUp) : '—' },
					{ label: t(`${O}.consumed`), value: consumed !== undefined ? full(consumed) : '—' },
					{ label: t(`${C}.free`), value: free !== undefined ? full(free) : '—' },
					{ label: t(`${C}.paid`), value: paid !== undefined ? full(paid) : '—' },
					{ label: t(`${C}.net`), value: net !== undefined ? signed(net) : '—' },
				]}
			/>
			{view === 'table' ? (
				<DataTable columns={columns} rows={data} rowKey={(r) => r.bucket} footer={footer} />
			) : (
				<SeriesChart
					data={data}
					series={[
						{ key: 'free', label: t(`${C}.free`), color: PALETTE[4], total: compact(free ?? 0) },
						{ key: 'paid', label: t(`${C}.paid`), color: CONSUMED_COLOR, total: compact(paid ?? 0) },
						{ key: 'topups', label: t(`${O}.toppedUp`), color: TOPPED_UP_COLOR, total: compact(toppedUp ?? 0) },
					]}
					xLabel={xLabel}
					format={compact}
				/>
			)}
		</Panel>
	);
};

export const TopupsByReason = ({ controls }: { controls: DashboardControls }) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const [credits, counts] = useQueries({
		queries: [
			reportQ('credit_topups', { shape: 'breakdown', dimensions: ['transaction_reason'] }, controls),
			// Report has no count measure.
			datasetQ(
				{
					dataset: 'wallet_transactions',
					measures: [{ agg: 'count' }],
					dimensions: ['transaction_reason', 'currency'],
					filters: [
						{ field: 'type', op: 'eq' as const, value: ['credit'] },
						{ field: 'transaction_status', op: 'eq' as const, value: ['completed'] },
						{ field: 'transaction_reason', op: 'in' as const, value: ALL_REASONS },
					],
					time: { field: 'created_at' },
				},
				controls,
			),
		],
	});
	const creditRows = recordsOf(credits.data, currency);
	const countRows = recordsOf(counts.data, currency);
	const sum = (rows: Record<string, string>[], col: string, reasons: readonly string[]) =>
		rows.filter((r) => reasons.includes(r.transaction_reason)).reduce((s, r) => s + (numOf(r[col]) ?? 0), 0);
	const groups = REASON_GROUPS.map((g, i) => ({
		key: g,
		label: t(`${C}.reasons.${g}`),
		color: REASON_COLORS[i],
		credits: sum(creditRows, 'credit_topups', TOPUP_REASONS[g]),
		count: sum(countRows, 'm0', TOPUP_REASONS[g]),
	}));
	const total = groups.reduce((s, g) => s + g.credits, 0);
	const totalCount = groups.reduce((s, g) => s + g.count, 0);
	const share = (v: number) => `${total > 0 ? ((v / total) * 100).toFixed(1) : '0.0'}%`;
	return (
		<Panel
			title={t(`${C}.byReason`)}
			definition={t(`${C}.byReasonDef`)}
			loading={credits.isLoading || counts.isLoading}
			error={credits.isError || counts.isError}
			empty={creditRows.length === 0}>
			<StatRow
				stats={[
					{ label: t(`${C}.credits`), value: full(total) },
					{ label: t(`${C}.topups`), value: full(totalCount) },
				]}
			/>
			<RankedBars items={groups.map((g) => ({ key: g.key, label: g.label, value: g.credits, color: g.color }))} format={share} vertical />
			<SeriesLegend
				series={groups.map((g) => ({
					key: g.key,
					label: g.label,
					color: g.color,
					total: t(`${C}.reasonTotal`, { credits: compact(g.credits), count: g.count, formatted: full(g.count) }),
				}))}
			/>
		</Panel>
	);
};

export const EventsVolume = ({ controls }: { controls: DashboardControls }) => {
	const { t } = useTranslation('settings');
	const q = useQuery(
		reportQ('events_volume', { shape: 'timeseries', grain: 'day', range: rangeForPreset('last_7_days', controls.now) }, controls),
	);
	const data = mergeSeries({ events: { result: q.data, column: 'events_volume' } }, '');
	const total = sumField(data, 'events');
	return (
		<Panel
			title={t(`${C}.events`)}
			definition={t(`${C}.eventsDef`)}
			actions={<span className='text-xs text-content-zinc-tertiary'>{t(`${C}.last7Days`)}</span>}
			loading={q.isLoading}
			error={q.isError}
			empty={data.length === 0}>
			<StatRow
				stats={[
					{ label: t(`${C}.totalEvents`), value: total !== undefined ? compact(total) : '—' },
					{ label: t(`${C}.dailyAverage`), value: total !== undefined ? compact(total / EVENT_DAYS) : '—' },
				]}
			/>
			<SeriesChart
				data={data}
				series={[{ key: 'events', label: t(`${C}.events`), color: PALETTE[0] }]}
				xLabel={(b) => bucketLabel(b, 'day')}
				format={compact}
				height={220}
			/>
		</Panel>
	);
};

const CreditsTab = ({ controls }: DashboardTabProps) => (
	<div className='flex flex-col gap-6'>
		<CreditFlow controls={controls} />
		<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
			<TopupsByReason controls={controls} />
			<EventsVolume controls={controls} />
		</div>
	</div>
);

export default CreditsTab;
