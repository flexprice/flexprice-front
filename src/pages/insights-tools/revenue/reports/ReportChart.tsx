import { useTranslation } from 'react-i18next';
import { Bar, CartesianGrid, Cell, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ReportCatalogEntry, ReportGrain, ReportQueryResult } from '@/types/dto/Reports';
import { ValueFormat, formatValue, isBucketInProgress, toSeries } from './reportMath';

const CURRENT = '#3b82f6';
const PREVIOUS = '#cbd5e1';

export const chartSupported = (entry: ReportCatalogEntry, result: ReportQueryResult): boolean => {
	const hasBucket = result.columns.some((c) => c.name === 'bucket');
	const hasDim = result.columns.some((c) => c.role === 'dimension' && c.name !== 'currency' && c.name !== 'bucket');
	return entry.default_shape !== 'histogram' && (hasBucket || hasDim);
};

const shortLabel = (label: string) => (/^\d{4}-\d{2}-\d{2}T/.test(label) ? label.slice(0, 10) : label);

export const IN_PROGRESS_OPACITY = 0.45;

export const chartPoints = (result: ReportQueryResult, key: string, currency: string, grain: ReportGrain | '' | undefined, now: Date) =>
	toSeries(result, key, currency).map((p) => ({
		...p,
		inProgress: isBucketInProgress(p.label, grain, now),
		label: shortLabel(p.label),
	}));

interface Props {
	entry: ReportCatalogEntry;
	result: ReportQueryResult;
	currency: string;
	grain?: ReportGrain | '';
	now: Date;
	valueType?: ValueFormat;
}

const ReportChart = ({ entry, result, currency, grain, now, valueType = entry.value_type }: Props) => {
	const { t } = useTranslation('settings');
	if (!chartSupported(entry, result)) return null;
	const data = chartPoints(result, entry.key, currency, grain, now);
	const inProgressLabel = t('insightsTools.revenue.reports.inProgress');
	const hasPrev = data.some((p) => p.prev !== undefined);
	const daysLabel = (v: string) => t('insightsTools.revenue.reports.daysUnit', { value: v });
	const fmt = (v: number) => formatValue(v, valueType, currency, daysLabel);
	return (
		<div className='h-72 w-full'>
			<ResponsiveContainer width='100%' height='100%'>
				<ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
					<CartesianGrid strokeDasharray='3 3' vertical={false} />
					<XAxis dataKey='label' tickLine={false} axisLine={false} fontSize={12} />
					<XAxis xAxisId='prev' dataKey='label' hide />
					<YAxis tickFormatter={fmt} tickLine={false} axisLine={false} fontSize={12} width={90} />
					<Tooltip
						formatter={(v: number, name: string, item: { payload?: { inProgress?: boolean } }) => [
							item.payload?.inProgress && name === entry.name ? `${fmt(v)} (${inProgressLabel})` : fmt(v),
							name,
						]}
					/>
					{hasPrev && (
						<Bar
							dataKey='prev'
							name={t('insightsTools.revenue.reports.previous')}
							fill={PREVIOUS}
							fillOpacity={0.5}
							xAxisId='prev'
							maxBarSize={24}
							radius={[4, 4, 0, 0]}
						/>
					)}
					<Bar dataKey='current' name={entry.name} fill={CURRENT} maxBarSize={24} radius={[4, 4, 0, 0]}>
						{data.map((p, n) => (
							<Cell key={n} fillOpacity={p.inProgress ? IN_PROGRESS_OPACITY : 1} />
						))}
					</Bar>
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	);
};

export default ReportChart;
