import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import DeltaChip from '../reports/DeltaChip';
import LoadingElapsed from './LoadingElapsed';
import { deltaDisplay, formatCompactMoney, formatValue } from '../reports/reportMath';
import { agingQ, arpuQ, billedCustomersQ, DashboardControls, outstandingQ, overdueOf, reportQ, scalarOf, ScalarValue } from './queries';
import { REVENUE_KPI } from './useDashboardControls';

const K = 'insightsTools.revenue.dashboard.kpi';

const Card = ({
	label,
	value,
	title,
	loading,
	status,
	footer,
}: {
	label: string;
	value: string;
	title?: string;
	loading: boolean;
	status: ReactNode;
	footer: ReactNode;
}) => (
	<div className='flex min-w-0 flex-col gap-2 border-line p-5 [&:not(:last-child)]:border-b lg:[&:not(:last-child)]:border-b-0 lg:[&:not(:last-child)]:border-e'>
		<span className='text-sm text-content-zinc-tertiary'>{label}</span>
		{loading ? (
			<Skeleton className='h-8 w-32' />
		) : (
			<span title={title} className='truncate text-2xl font-semibold tabular-nums text-content-zinc-bold'>
				{value}
			</span>
		)}
		<div className='flex min-h-6 items-center gap-2 text-xs text-content-zinc-tertiary'>{loading ? <LoadingElapsed /> : status}</div>
		<div className='mt-2 border-t border-line pt-3 text-xs text-content-zinc-tertiary'>{footer}</div>
	</div>
);

const KpiCards = ({ controls }: { controls: DashboardControls }) => {
	const { t } = useTranslation('settings');
	const { currency } = controls;
	const [revenue, arpu, outstanding, aging, billed] = useQueries({
		queries: [
			reportQ(REVENUE_KPI.key, REVENUE_KPI.opts, controls),
			arpuQ(controls),
			outstandingQ(controls),
			agingQ(controls),
			billedCustomersQ(controls),
		],
	});
	// Compact large amounts; hover shows exact.
	const money = (v: number) => (Math.abs(v) >= 1e7 ? formatCompactMoney(v, currency) : formatValue(Math.round(v), 'money', currency));
	const exact = (v: number | undefined) => (v !== undefined ? formatValue(v, 'money', currency) : undefined);
	const num = (v: string | undefined) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);
	const vsLabel = t(`${K}.${controls.compare === 'previous_year' ? 'vsPrevYear' : 'vsPrevPeriod'}`);
	const delta = (s: ScalarValue | undefined, higherIsBetter: boolean) => {
		const d = s ? deltaDisplay(s.current, s.prev, s.pct, higherIsBetter) : null;
		return (
			d && (
				<>
					<DeltaChip display={d} />
					<span>{vsLabel}</span>
				</>
			)
		);
	};
	const dash = '—';

	const rev = scalarOf(revenue.data, 'invoice_total', currency);
	const revNow = num(rev?.current);
	const revPrev = num(rev?.prev);
	const arpuV = scalarOf(arpu.data, 'arpu', currency);
	const arpuNow = num(arpuV?.current);
	const billedN = num(scalarOf(billed.data, 'm0', currency)?.current);
	const out = num(scalarOf(outstanding.data, 'total_receivables', currency)?.current);
	const overdue = overdueOf(aging.data, currency);
	const overduePct = overdue !== undefined && out ? (overdue / out) * 100 : undefined;

	return (
		<div className='grid grid-cols-1 rounded-lg border border-line bg-surface lg:grid-cols-4'>
			<Card
				label={t(`${K}.revenue`)}
				value={revNow !== undefined ? money(revNow) : dash}
				title={exact(revNow)}
				loading={revenue.isLoading}
				status={delta(rev, true)}
				footer={
					controls.compare === 'none'
						? null
						: revPrev !== undefined
							? t(`${K}.previous`, { value: formatCompactMoney(revPrev, currency) })
							: dash
				}
			/>
			<Card
				label={t(`${K}.arpu`)}
				value={arpuNow !== undefined ? money(arpuNow) : dash}
				title={exact(arpuNow)}
				loading={arpu.isLoading}
				status={delta(arpuV, true)}
				footer={billedN !== undefined ? t(`${K}.billedCustomers`, { count: billedN, value: billedN.toLocaleString('en-US') }) : dash}
			/>
			<Card
				label={t(`${K}.outstanding`)}
				value={out !== undefined ? money(out) : dash}
				title={exact(out)}
				loading={outstanding.isLoading}
				status={t(`${K}.pointInTime`)}
				footer={t(`${K}.asOfToday`)}
			/>
			<Card
				label={t(`${K}.overdue`)}
				value={overdue !== undefined ? money(overdue) : dash}
				title={exact(overdue)}
				loading={aging.isLoading}
				status={t(`${K}.pointInTime`)}
				footer={overduePct !== undefined ? t(`${K}.ofOutstanding`, { value: overduePct.toFixed(1) }) : dash}
			/>
		</div>
	);
};

export default KpiCards;
