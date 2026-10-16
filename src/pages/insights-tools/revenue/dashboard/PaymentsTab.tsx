import { useTranslation } from 'react-i18next';
import { useQueries, useQuery } from '@tanstack/react-query';
import { csvFilename, downloadCsv } from '../reports/reportCsv';
import { formatValue } from '../reports/reportMath';
import { CUSTOMER_LIMIT } from './CustomersTab';
import DataTable from './DataTable';
import Panel from './Panel';
import { DashboardControls, DashboardTabProps, datasetQ, daysToPayQ, medianDaysQ, numOf, recordsOf, scalarOf } from './queries';
import RankedBars from './RankedBars';
import { bucketLabel, DataColumn, mergeSeries, PALETTE, PREVIOUS_COLOR, tableCsv } from './revenueMath';
import SeriesChart from './SeriesChart';
import { StatRow } from './Stat';

const P = 'insightsTools.revenue.dashboard.payments';
const O = 'insightsTools.revenue.dashboard.overview';

const PAYMENT_SPEEDS = ['0-7', '8-30', '30+'] as const;
const SPEED_COLORS = ['#16a34a', PALETTE[0], PALETTE[1]];

// Paid invoices only.
const PAID = { field: 'days_to_pay', op: 'gte' as const, value: ['0'] };

const useDays = () => {
	const { t } = useTranslation('settings');
	return (v: number | undefined) => (v !== undefined ? t('insightsTools.revenue.reports.daysUnit', { value: v.toFixed(1) }) : '—');
};

export const DaysToPayOverTime = ({ controls }: { controls: DashboardControls }) => {
	const { t } = useTranslation('settings');
	const noPaidInvoices = t(`${P}.noPaidInvoices`);
	const days = useDays();
	const { currency } = controls;
	const [avg, median, paid, series] = useQueries({
		queries: [
			daysToPayQ(controls),
			medianDaysQ(controls),
			datasetQ(
				{
					dataset: 'invoices',
					measures: [{ agg: 'count' }],
					dimensions: ['currency'],
					filters: [PAID],
					time: { field: 'paid_at' },
					compare: true,
				},
				controls,
			),
			datasetQ(
				{
					dataset: 'invoices',
					measures: [{ agg: 'avg', field: 'days_to_pay' }, { agg: 'median', field: 'days_to_pay' }, { agg: 'count' }],
					dimensions: ['currency'],
					filters: [PAID],
					time: { field: 'paid_at', grain: 'month' },
				},
				controls,
			),
		],
	});
	const avgV = scalarOf(avg.data, 'days_to_pay', currency);
	const paidV = scalarOf(paid.data, 'm0', currency);
	const avgNow = numOf(avgV?.current);
	const paidNow = numOf(paidV?.current);
	const data = mergeSeries(
		{
			average: { result: series.data, column: 'm0' },
			median: { result: series.data, column: 'm1' },
			paid: { result: series.data, column: 'm2' },
		},
		currency,
	).map((r) => (avgNow !== undefined ? { ...r, periodAverage: avgNow } : r));
	const queries = [avg, median, paid, series];
	return (
		<Panel
			title={t(`${O}.daysToPay`)}
			definition={t(`${P}.daysToPayDef`)}
			loading={queries.some((q) => q.isLoading)}
			error={queries.some((q) => q.isError)}
			empty={data.length === 0}
			emptyMessage={noPaidInvoices}>
			<StatRow
				stats={[
					{ label: t(`${O}.average`), value: days(avgNow), current: avgNow, prev: numOf(avgV?.prev), higherIsBetter: false },
					{ label: t(`${O}.median`), value: days(numOf(scalarOf(median.data, 'm0', currency)?.current)) },
					{
						label: t(`${P}.paid`),
						value: paidNow !== undefined ? formatValue(paidNow, 'count', currency) : '—',
						current: paidNow,
						prev: numOf(paidV?.prev),
					},
				]}
			/>
			<SeriesChart
				data={data}
				series={[
					{ key: 'paid', label: t(`${P}.paid`), color: '#e2e8f0', axis: 'right' },
					{ key: 'average', label: t(`${P}.averageLine`), color: PALETTE[0], kind: 'line' },
					{ key: 'median', label: t(`${P}.medianLine`), color: PALETTE[1], kind: 'line' },
					...(avgNow !== undefined
						? [
								{
									key: 'periodAverage',
									label: t(`${P}.periodAverage`, { value: days(avgNow) }),
									color: PREVIOUS_COLOR,
									kind: 'line' as const,
									dashed: true,
								},
							]
						: []),
				]}
				xLabel={(b) => bucketLabel(b, 'month')}
				format={days}
				rightFormat={(v) => String(Math.round(v))}
			/>
		</Panel>
	);
};

export const PaymentSpeed = ({ controls }: { controls: DashboardControls }) => {
	const { t } = useTranslation('settings');
	const noPaidInvoices = t(`${P}.noPaidInvoices`);
	const q = useQuery(
		datasetQ(
			{
				dataset: 'invoices',
				measures: [{ agg: 'count' }],
				dimensions: ['payment_speed', 'currency'],
				filters: [PAID],
				time: { field: 'paid_at' },
			},
			controls,
		),
	);
	const records = recordsOf(q.data, controls.currency);
	const counts = PAYMENT_SPEEDS.map((s) => records.filter((r) => r.payment_speed === s).reduce((n, r) => n + (numOf(r.m0) ?? 0), 0));
	const total = counts.reduce((s, v) => s + v, 0);
	return (
		<Panel
			title={t(`${P}.speed`)}
			definition={t(`${P}.speedDef`)}
			loading={q.isLoading}
			error={q.isError}
			empty={total === 0}
			emptyMessage={noPaidInvoices}>
			<RankedBars
				items={PAYMENT_SPEEDS.map((s, i) => ({ key: s, label: t(`${P}.speeds.${s}`), value: counts[i], color: SPEED_COLORS[i] }))}
				format={(v) => `${v.toLocaleString('en-US')} · ${total > 0 ? ((v / total) * 100).toFixed(1) : '0.0'}%`}
				vertical
			/>
		</Panel>
	);
};

interface PayerRow {
	id: string;
	name: string;
	days: number;
	paid: number;
	collected: number;
}

const usePayers = (controls: DashboardControls) => {
	const { currency } = controls;
	const q = useQuery({
		...datasetQ(
			{
				dataset: 'invoices',
				measures: [{ agg: 'avg', field: 'days_to_pay' }, { agg: 'count' }, { agg: 'sum', field: 'amount_paid' }],
				dimensions: ['customer'],
				filters: [PAID, { field: 'currency', op: 'eq' as const, value: [currency] }],
				time: { field: 'paid_at' },
				sort: [{ field: 'm0', dir: 'desc' }],
				limit: CUSTOMER_LIMIT,
			},
			controls,
		),
		enabled: !!currency,
	});
	const rows: PayerRow[] = recordsOf(q.data, currency)
		.filter((r) => r.customer)
		.map((r) => ({
			id: r.customer,
			name: r.customer_label || r.customer,
			days: numOf(r.m0) ?? 0,
			paid: numOf(r.m1) ?? 0,
			collected: numOf(r.m2) ?? 0,
		}));
	return { rows, loading: q.isLoading, error: q.isError };
};

type Payers = ReturnType<typeof usePayers>;

export const SlowestPayers = ({ data }: { data: Payers }) => {
	const { t } = useTranslation('settings');
	const noPaidInvoices = t(`${P}.noPaidInvoices`);
	const days = useDays();
	const items = data.rows.slice(0, 8).map((r) => ({ key: r.id, label: r.name, value: r.days }));
	return (
		<Panel
			title={t(`${P}.slowest`)}
			definition={t(`${P}.slowestDef`)}
			loading={data.loading}
			error={data.error}
			empty={items.length === 0}
			emptyMessage={noPaidInvoices}>
			<RankedBars items={items} format={days} />
		</Panel>
	);
};

export const PaymentsByCustomer = ({ controls, data }: { controls: DashboardControls; data: Payers }) => {
	const { t } = useTranslation('settings');
	const noPaidInvoices = t(`${P}.noPaidInvoices`);
	const days = useDays();
	const columns: DataColumn<PayerRow>[] = [
		{ key: 'customer', label: t(`${P}.customer`), value: (r) => r.name },
		{ key: 'paid', label: t(`${P}.paid`), numeric: true, value: (r) => r.paid },
		{
			key: 'collected',
			label: t(`${P}.collected`),
			numeric: true,
			value: (r) => r.collected,
			render: (r) => formatValue(r.collected, 'money', controls.currency),
		},
		{ key: 'days', label: t(`${P}.averageDays`), numeric: true, value: (r) => r.days.toFixed(1), render: (r) => days(r.days) },
	];
	return (
		<Panel
			title={t(`${P}.byCustomer`)}
			definition={t(`${P}.byCustomerDef`)}
			onDownloadCsv={() => downloadCsv(csvFilename('payments_by_customer', controls.range), tableCsv(columns, data.rows))}
			csvDisabled={data.rows.length === 0}
			loading={data.loading}
			error={data.error}
			empty={data.rows.length === 0}
			emptyMessage={noPaidInvoices}>
			<div className='max-h-[36rem] overflow-y-auto'>
				<DataTable columns={columns} rows={data.rows} rowKey={(r) => r.id} />
			</div>
		</Panel>
	);
};

const PaymentsTab = ({ controls }: DashboardTabProps) => {
	const payers = usePayers(controls);
	return (
		<div className='flex flex-col gap-6'>
			<DaysToPayOverTime controls={controls} />
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				<PaymentSpeed controls={controls} />
				<SlowestPayers data={payers} />
			</div>
			<PaymentsByCustomer controls={controls} data={payers} />
		</div>
	);
};

export default PaymentsTab;
