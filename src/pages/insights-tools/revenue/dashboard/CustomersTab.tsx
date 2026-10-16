import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeltaChip from '../reports/DeltaChip';
import { csvFilename, downloadCsv } from '../reports/reportCsv';
import { deltaDisplay, formatCompactMoney, formatValue, rowsFor } from '../reports/reportMath';
import { BAND_EDGES, bands, concentration, CustomerRow, customerRows } from './customerMath';
import DataTable, { SortDir } from './DataTable';
import Panel from './Panel';
import { arpuQ, billedCustomersQ, DashboardControls, DashboardTabProps, datasetQ, reportQ, scalarOf, USAGE_FILTERS } from './queries';
import RankedBars from './RankedBars';
import { DataColumn, PALETTE, tableCsv } from './revenueMath';
import { SeriesLegend } from './SeriesChart';
import { StatRow } from './Stat';
import { useCustomerNames } from './useCustomerNames';

const C = 'insightsTools.revenue.dashboard.customers';
const R = 'insightsTools.revenue.dashboard.revenue';
const K = 'insightsTools.revenue.dashboard.kpi';

// Also the customer name lookup cap.
export const CUSTOMER_LIMIT = 1000;
const PAGE_SIZE = 20;

const num = (v: string | undefined) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);

const useCustomers = (controls: DashboardControls) => {
	const { currency } = controls;
	const currencyFilter = { field: 'currency', op: 'eq' as const, value: [currency] };
	const revenue = useQuery({
		...reportQ(
			'invoice_total',
			{
				shape: 'breakdown',
				dimensions: ['customer_id'],
				compare: true,
				limit: CUSTOMER_LIMIT,
				sort: [{ field: 'invoice_total', dir: 'desc' }],
				filters: [currencyFilter],
			},
			controls,
		),
		enabled: !!currency,
	});
	const ids = customerRows(revenue.data, undefined, currency).map((r) => r.id);
	// Usage only for listed customers.
	const usage = useQuery({
		...datasetQ(
			{
				dataset: 'invoice_lines',
				measures: [{ agg: 'sum', field: 'amount' }],
				dimensions: ['customer'],
				filters: [...USAGE_FILTERS, currencyFilter, { field: 'customer', op: 'in' as const, value: ids }],
				time: { field: 'billing_period' },
			},
			controls,
		),
		enabled: !!currency && revenue.isSuccess && ids.length > 0,
	});
	const rows = customerRows(revenue.data, usage.data, currency);
	const labels = new Map<string, string>();
	if (usage.data) {
		const ui = usage.data.columns.findIndex((c) => c.name === 'customer');
		const li = usage.data.columns.findIndex((c) => c.name === 'customer_label');
		if (ui >= 0 && li >= 0) for (const r of rowsFor(usage.data, currency)) if (r[li]) labels.set(r[ui], r[li]);
	}
	const names = useCustomerNames(rows.map((r) => r.id));
	return {
		rows,
		name: (id: string) => names[id] ?? labels.get(id) ?? id,
		hasPrev: !!revenue.data?.columns.some((c) => c.name === 'invoice_total_prev'),
		capped: (revenue.data ? rowsFor(revenue.data, currency).length : 0) >= CUSTOMER_LIMIT,
		loading: revenue.isLoading || usage.isLoading,
		error: revenue.isError || usage.isError,
	};
};

type Customers = ReturnType<typeof useCustomers>;

const CappedNote = ({ data }: { data: Customers }) => {
	const { t } = useTranslation('settings');
	return data.capped ? <p className='text-xs text-content-zinc-tertiary'>{t(`${C}.capped`, { count: CUSTOMER_LIMIT })}</p> : null;
};

export const TopCustomers = ({ controls, data }: { controls: DashboardControls; data: Customers }) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const [billed, arpu] = useQueries({ queries: [billedCustomersQ(controls), arpuQ(controls)] });
	const billedV = scalarOf(billed.data, 'm0', currency);
	const arpuV = scalarOf(arpu.data, 'arpu', currency);
	const billedNow = num(billedV?.current);
	const arpuNow = num(arpuV?.current);
	const items = data.rows.slice(0, 10).map((r) => ({ key: r.id, label: data.name(r.id), value: r.revenue, parts: [r.usage, r.contract] }));
	return (
		<Panel
			title={t(`${C}.top`)}
			definition={t(`${C}.topDef`)}
			loading={data.loading || billed.isLoading || arpu.isLoading}
			error={data.error || billed.isError || arpu.isError}
			empty={items.length === 0}>
			<StatRow
				stats={[
					{
						label: t(`${C}.billed`),
						value: billedNow !== undefined ? formatValue(billedNow, 'count', currency) : '—',
						current: billedNow,
						prev: num(billedV?.prev),
					},
					{
						label: t(`${K}.arpu`),
						value: arpuNow !== undefined ? formatValue(arpuNow, 'money', currency) : '—',
						current: arpuNow,
						prev: num(arpuV?.prev),
					},
				]}
			/>
			<RankedBars items={items} colors={[PALETTE[0], PALETTE[1]]} format={(v) => formatCompactMoney(v, currency)} />
			<SeriesLegend
				series={[
					{ key: 'usage', label: t(`${R}.usage`), color: PALETTE[0] },
					{ key: 'contract', label: t(`${R}.contract`), color: PALETTE[1] },
				]}
			/>
		</Panel>
	);
};

export const Concentration = ({ data }: { data: Customers }) => {
	const { t } = useTranslation('settings');
	const items = concentration(data.rows).map(({ n, share }) => ({ key: String(n), label: t(`${C}.topN`, { n }), value: share }));
	return (
		<Panel
			title={t(`${C}.concentration`)}
			definition={t(`${C}.concentrationDef`)}
			loading={data.loading}
			error={data.error}
			empty={data.rows.length === 0}>
			<RankedBars items={items} format={(v) => `${Math.round(v)}%`} vertical max={100} />
			<CappedNote data={data} />
		</Panel>
	);
};

export const RevenueBands = ({ controls, data }: { controls: DashboardControls; data: Customers }) => {
	const { t } = useTranslation('settings');
	const money = (v: number) => formatCompactMoney(v, controls.currency);
	const labels = [
		t(`${C}.bandUnder`, { value: money(BAND_EDGES[0]) }),
		...BAND_EDGES.slice(1).map((e, i) => t(`${C}.bandBetween`, { from: money(BAND_EDGES[i]), to: money(e) })),
		t(`${C}.bandOver`, { value: money(BAND_EDGES[BAND_EDGES.length - 1]) }),
	];
	const items = bands(data.rows).map((count, i) => ({ key: String(i), label: labels[i], value: count }));
	return (
		<Panel title={t(`${C}.bands`)} definition={t(`${C}.bandsDef`)} loading={data.loading} error={data.error} empty={data.rows.length === 0}>
			<RankedBars items={items} format={(v) => String(v)} vertical />
			<CappedNote data={data} />
		</Panel>
	);
};

interface TableRow extends CustomerRow {
	rank: number;
	name: string;
}

export const AllCustomers = ({ controls, data }: { controls: DashboardControls; data: Customers }) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const [page, setPage] = useState(0);
	const [dir, setDir] = useState<SortDir>('desc');
	const total = data.rows.reduce((s, r) => s + r.revenue, 0);
	const rows: TableRow[] = data.rows.map((r, i) => ({ ...r, rank: i + 1, name: data.name(r.id) }));
	const pct = (v: number, of: number) => (of > 0 ? (v / of) * 100 : 0);
	const money = (v: number) => formatValue(v, 'money', currency);
	const change = (r: TableRow) => deltaDisplay(String(r.revenue), r.prev !== undefined ? String(r.prev) : undefined, undefined, true);
	const percent = (key: string, label: string, get: (r: TableRow) => number): DataColumn<TableRow> => ({
		key,
		label,
		numeric: true,
		value: (r) => get(r).toFixed(1),
		render: (r) => `${get(r).toFixed(1)}%`,
	});
	const moneyCol = (key: string, label: string, get: (r: TableRow) => number): DataColumn<TableRow> => ({
		key,
		label,
		numeric: true,
		value: get,
		render: (r) => money(get(r)),
	});
	const columns: DataColumn<TableRow>[] = [
		{ key: 'rank', label: '#', value: (r) => r.rank },
		{ key: 'customer', label: t(`${C}.customer`), value: (r) => r.name },
		moneyCol('revenue', t(`${R}.revenue`), (r) => r.revenue),
		moneyCol('contract', t(`${R}.contract`), (r) => r.contract),
		moneyCol('usage', t(`${R}.usage`), (r) => r.usage),
		percent('usageShare', t(`${C}.usageShare`), (r) => pct(r.usage, r.revenue)),
		percent('share', t(`${C}.shareOfTotal`), (r) => pct(r.revenue, total)),
		...(data.hasPrev
			? [
					moneyCol('prev', t(`${R}.previous`), (r) => r.prev ?? 0),
					{
						key: 'change',
						label: t(`${R}.change`),
						numeric: true,
						value: (r: TableRow) => change(r)?.label ?? '',
						render: (r: TableRow) => <DeltaChip display={change(r)} />,
					},
				]
			: []),
	];
	const ordered = dir === 'desc' ? rows : [...rows].reverse();
	const pages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
	const current = Math.min(page, pages - 1);
	const shown = ordered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
	return (
		<Panel
			title={t(`${C}.all`)}
			definition={t(`${C}.allDef`)}
			onDownloadCsv={() => downloadCsv(csvFilename('customers_by_revenue', controls.range), tableCsv(columns, ordered))}
			csvDisabled={rows.length === 0}
			loading={data.loading}
			error={data.error}
			empty={rows.length === 0}>
			<DataTable
				columns={columns}
				rows={shown}
				rowKey={(r) => r.id}
				sort={{
					key: 'revenue',
					dir,
					onToggle: () => {
						setDir(dir === 'desc' ? 'asc' : 'desc');
						setPage(0);
					},
				}}
			/>
			<div className='flex items-center justify-between gap-3 text-xs text-content-zinc-tertiary'>
				<span>{t(`${C}.pageRange`, { from: current * PAGE_SIZE + 1, to: current * PAGE_SIZE + shown.length, count: rows.length })}</span>
				{pages > 1 && (
					<div className='flex gap-1'>
						<Button
							type='button'
							variant='outline'
							size='sm'
							aria-label={t(`${C}.previousPage`)}
							disabled={current === 0}
							onClick={() => setPage(current - 1)}>
							<ChevronLeft className='h-4 w-4 rtl:rotate-180' />
						</Button>
						<Button
							type='button'
							variant='outline'
							size='sm'
							aria-label={t(`${C}.nextPage`)}
							disabled={current >= pages - 1}
							onClick={() => setPage(current + 1)}>
							<ChevronRight className='h-4 w-4 rtl:rotate-180' />
						</Button>
					</div>
				)}
			</div>
			<CappedNote data={data} />
		</Panel>
	);
};

const CustomersTab = ({ controls }: DashboardTabProps) => {
	const data = useCustomers(controls);
	return (
		<div className='flex flex-col gap-6'>
			<TopCustomers controls={controls} data={data} />
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				<Concentration data={data} />
				<RevenueBands controls={controls} data={data} />
			</div>
			<AllCustomers controls={controls} data={data} />
		</div>
	);
};

export default CustomersTab;
