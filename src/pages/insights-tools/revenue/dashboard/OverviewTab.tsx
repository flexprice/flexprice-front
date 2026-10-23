import { useTranslation } from 'react-i18next';
import { useQueries, useQuery } from '@tanstack/react-query';
import { formatCompactMoney, formatValue, rowsFor } from '../reports/reportMath';
import Panel from './Panel';
import {
	AGING_BUCKETS,
	agingQ,
	DashboardControls,
	DashboardTabProps,
	datasetQ,
	daysToPayQ,
	medianDaysQ,
	outstandingQ,
	overdueOf,
	reportQ,
	scalarOf,
} from './queries';
import RankedBars from './RankedBars';
import { bucketLabel, mergeSeries, PALETTE, sumField } from './revenueMath';
import RevenueOverTime from './RevenueOverTime';
import SeriesChart from './SeriesChart';
import { StatRow } from './Stat';
import { useCustomerNames } from './useCustomerNames';

const O = 'insightsTools.revenue.dashboard.overview';
const K = 'insightsTools.revenue.dashboard.kpi';

const num = (v: string | undefined) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);

interface CardProps {
	controls: DashboardControls;
	onViewReport: () => void;
}

export const AgingCard = ({ controls, onViewReport }: CardProps) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const [outstanding, aging] = useQueries({ queries: [outstandingQ(controls), agingQ(controls)] });
	const out = num(scalarOf(outstanding.data, 'total_receivables', currency)?.current);
	const overdue = overdueOf(aging.data, currency);
	const result = aging.data;
	const bi = result ? result.columns.findIndex((c) => c.name === 'aging_bucket') : -1;
	const mi = result ? result.columns.findIndex((c) => c.name === 'receivables_aging') : -1;
	const rows = result && bi >= 0 && mi >= 0 ? rowsFor(result, currency) : [];
	const items = AGING_BUCKETS.map((b) => ({
		key: b,
		label: t(`${O}.agingBuckets.${b}`),
		value: rows.filter((r) => r[bi] === b).reduce((s, r) => s + (num(r[mi]) ?? 0), 0),
	}));
	const money = (v: number | undefined) => (v !== undefined ? formatValue(v, 'money', currency) : '—');
	return (
		<Panel
			title={t(`${O}.aging`)}
			definition={t(`${O}.agingDef`)}
			pointInTime
			onViewReport={onViewReport}
			loading={aging.isLoading || outstanding.isLoading}
			error={aging.isError || outstanding.isError}
			empty={rows.length === 0}>
			<StatRow
				stats={[
					{ label: t(`${K}.outstanding`), value: money(out) },
					{
						label: t(`${K}.overdue`),
						value: `${money(overdue)}${overdue !== undefined && out ? ` · ${((overdue / out) * 100).toFixed(1)}%` : ''}`,
					},
				]}
			/>
			<RankedBars items={items} format={(v) => formatCompactMoney(v, currency)} vertical />
		</Panel>
	);
};

export const DaysToPayCard = ({ controls, onViewReport }: CardProps) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const [avg, median, series] = useQueries({
		queries: [
			daysToPayQ(controls),
			medianDaysQ(controls),
			datasetQ(
				{
					dataset: 'invoices',
					measures: [
						{ agg: 'avg', field: 'days_to_pay' },
						{ agg: 'median', field: 'days_to_pay' },
					],
					dimensions: ['currency'],
					time: { field: 'paid_at', grain: 'month' },
				},
				controls,
			),
		],
	});
	const days = (v: number | undefined) => (v !== undefined ? t('insightsTools.revenue.reports.daysUnit', { value: v.toFixed(1) }) : '—');
	const avgNow = num(scalarOf(avg.data, 'days_to_pay', currency)?.current);
	const medNow = num(scalarOf(median.data, 'm0', currency)?.current);
	const data = mergeSeries({ average: { result: series.data, column: 'm0' }, median: { result: series.data, column: 'm1' } }, currency);
	return (
		<Panel
			title={t(`${O}.daysToPay`)}
			definition={t(`${O}.daysToPayDef`)}
			onViewReport={onViewReport}
			loading={series.isLoading || avg.isLoading || median.isLoading}
			error={series.isError || avg.isError || median.isError}
			empty={data.length === 0}>
			<StatRow
				stats={[
					{ label: t(`${O}.average`), value: days(avgNow) },
					{ label: t(`${O}.median`), value: days(medNow) },
				]}
			/>
			<SeriesChart
				data={data}
				series={[
					{ key: 'average', label: t(`${O}.average`), color: PALETTE[0], kind: 'line' },
					{ key: 'median', label: t(`${O}.median`), color: PALETTE[1], kind: 'line', dashed: true },
				]}
				xLabel={(b) => bucketLabel(b, 'month')}
				format={(v) => `${Math.round(v)}d`}
				height={220}
			/>
		</Panel>
	);
};

export const TopCustomersCard = ({ controls, onViewReport }: CardProps) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const q = useQuery({
		...reportQ(
			'invoice_total',
			{
				shape: 'breakdown',
				dimensions: ['customer_id'],
				limit: 5,
				sort: [{ field: 'invoice_total', dir: 'desc' }],
				// Top 5 within the page currency.
				filters: [{ field: 'currency', op: 'eq' as const, value: [currency] }],
			},
			controls,
		),
		enabled: !!currency,
	});
	const result = q.data;
	const ci = result ? result.columns.findIndex((c) => c.name === 'customer_id') : -1;
	const mi = result ? result.columns.findIndex((c) => c.name === 'invoice_total') : -1;
	const rows = result && ci >= 0 && mi >= 0 ? rowsFor(result, currency).slice(0, 5) : [];
	const names = useCustomerNames(rows.map((r) => r[ci]));
	const items = rows.map((r) => ({ key: r[ci], label: names[r[ci]] ?? r[ci], value: num(r[mi]) ?? 0 }));
	return (
		<Panel
			title={t(`${O}.topCustomers`)}
			definition={t(`${O}.topCustomersDef`)}
			onViewReport={onViewReport}
			loading={q.isLoading}
			error={q.isError}
			empty={items.length === 0}>
			<RankedBars items={items} format={(v) => formatCompactMoney(v, currency)} />
		</Panel>
	);
};

export const CreditsCard = ({ controls, onViewReport }: CardProps) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const [topups, consumption] = useQueries({
		queries: [
			reportQ('credit_topups', { shape: 'timeseries', grain: 'month' }, controls),
			reportQ('credit_consumption', { shape: 'timeseries', grain: 'month' }, controls),
		],
	});
	const data = mergeSeries(
		{
			topups: { result: topups.data, column: 'credit_topups' },
			consumed: { result: consumption.data, column: 'credit_consumption' },
		},
		currency,
	);
	const compact = (v: number) => v.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });
	const toppedUp = sumField(data, 'topups');
	const consumed = sumField(data, 'consumed');
	return (
		<Panel
			title={t(`${O}.credits`)}
			definition={t(`${O}.creditsDef`)}
			onViewReport={onViewReport}
			loading={topups.isLoading || consumption.isLoading}
			error={topups.isError || consumption.isError}
			empty={data.length === 0}>
			<StatRow
				stats={[
					{ label: t(`${O}.toppedUp`), value: toppedUp !== undefined ? compact(toppedUp) : '—' },
					{ label: t(`${O}.consumed`), value: consumed !== undefined ? compact(consumed) : '—' },
				]}
			/>
			<SeriesChart
				data={data}
				series={[
					{ key: 'consumed', label: t(`${O}.consumed`), color: PALETTE[1] },
					{ key: 'topups', label: t(`${O}.toppedUp`), color: PALETTE[0] },
				]}
				xLabel={(b) => bucketLabel(b, 'month')}
				format={compact}
				height={220}
			/>
		</Panel>
	);
};

const OverviewTab = ({ controls, goTo }: DashboardTabProps) => (
	<div className='flex flex-col gap-6'>
		<RevenueOverTime controls={controls} onViewReport={() => goTo('revenue')} />
		<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
			<AgingCard controls={controls} onViewReport={() => goTo('receivables')} />
			<DaysToPayCard controls={controls} onViewReport={() => goTo('payments')} />
			<TopCustomersCard controls={controls} onViewReport={() => goTo('customers')} />
			<CreditsCard controls={controls} onViewReport={() => goTo('credits')} />
		</div>
	</div>
);

export default OverviewTab;
