import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import DeltaChip from '../reports/DeltaChip';
import { csvFilename, downloadCsv } from '../reports/reportCsv';
import { deltaDisplay, formatValue, metricIndexes, rowsFor } from '../reports/reportMath';
import DataTable from './DataTable';
import Panel from './Panel';
import { DashboardControls, DashboardTabProps, INVOICE_TYPES, reportQ } from './queries';
import { DataColumn, tableCsv } from './revenueMath';
import RevenueOverTime from './RevenueOverTime';

const R = 'insightsTools.revenue.dashboard.revenue';

interface BreakdownRow {
	key: string;
	name: string;
	revenue: number;
	prev?: number;
	share: number;
}

const num = (v: string | undefined) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);

export const RevenueBreakdown = ({ controls }: { controls: DashboardControls }) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const q = useQuery(reportQ('invoice_total', { shape: 'breakdown', dimensions: ['invoice_type'], compare: true }, controls));
	const result = q.data;
	const idx = result ? metricIndexes(result, 'invoice_total') : { current: -1, prev: -1, pct: -1 };
	const ti = result ? result.columns.findIndex((c) => c.name === 'invoice_type') : -1;
	const raw = result && ti >= 0 && idx.current >= 0 ? rowsFor(result, currency) : [];
	const total = raw.reduce((s, r) => s + (num(r[idx.current]) ?? 0), 0);
	const hasPrev = idx.prev >= 0;
	const label = (k: string) => ((INVOICE_TYPES as readonly string[]).includes(k) ? t(`${R}.invoiceTypes.${k}`) : k);
	const rows: BreakdownRow[] = raw
		.map((r) => {
			const revenue = num(r[idx.current]) ?? 0;
			return {
				key: r[ti],
				name: label(r[ti]),
				revenue,
				...(hasPrev ? { prev: num(r[idx.prev]) ?? 0 } : {}),
				share: total ? (revenue / total) * 100 : 0,
			};
		})
		.sort((a, b) => b.revenue - a.revenue);
	const footer: BreakdownRow = {
		key: 'total',
		name: t('insightsTools.revenue.reports.total'),
		revenue: total,
		...(hasPrev ? { prev: rows.reduce((s, r) => s + (r.prev ?? 0), 0) } : {}),
		share: total ? 100 : 0,
	};
	const money = (v: number) => formatValue(v, 'money', currency);
	const change = (r: BreakdownRow) => deltaDisplay(String(r.revenue), r.prev !== undefined ? String(r.prev) : undefined, undefined, true);
	const columns: DataColumn<BreakdownRow>[] = [
		{ key: 'name', label: t(`${R}.name`), value: (r) => r.name },
		{ key: 'share', label: t(`${R}.share`), numeric: true, value: (r) => r.share.toFixed(1), render: (r) => `${r.share.toFixed(1)}%` },
		{ key: 'revenue', label: t(`${R}.revenue`), numeric: true, value: (r) => r.revenue, render: (r) => money(r.revenue) },
		...(hasPrev
			? [
					{
						key: 'prev',
						label: t(`${R}.previous`),
						numeric: true,
						value: (r: BreakdownRow) => r.prev ?? 0,
						render: (r: BreakdownRow) => money(r.prev ?? 0),
					},
					{
						key: 'change',
						label: t(`${R}.change`),
						numeric: true,
						value: (r: BreakdownRow) => change(r)?.label ?? '',
						render: (r: BreakdownRow) => <DeltaChip display={change(r)} />,
					},
				]
			: []),
	];
	return (
		<Panel
			title={t(`${R}.breakdown`)}
			definition={t(`${R}.breakdownDef`)}
			actions={<span className='text-sm text-content-zinc-tertiary'>{t(`${R}.groupBys.invoice_type`)}</span>}
			onDownloadCsv={() => downloadCsv(csvFilename('revenue_by_invoice_type', controls.range), tableCsv(columns, rows, footer))}
			csvDisabled={rows.length === 0}
			loading={q.isLoading}
			error={q.isError}
			empty={rows.length === 0}>
			<DataTable columns={columns} rows={rows} rowKey={(r) => r.key} footer={footer} />
		</Panel>
	);
};

const RevenueTab = ({ controls }: DashboardTabProps) => (
	<div className='flex flex-col gap-6'>
		<RevenueOverTime controls={controls} full />
		<RevenueBreakdown controls={controls} />
	</div>
);

export default RevenueTab;
