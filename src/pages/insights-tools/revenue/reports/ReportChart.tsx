import { useTranslation } from 'react-i18next';
import { Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ReportCatalogEntry, ReportQueryResult } from '@/types/dto/Reports';
import { formatValue, toSeries } from './reportMath';

const CURRENT = '#3b82f6';
const PREVIOUS = '#cbd5e1';

export const chartSupported = (entry: ReportCatalogEntry, result: ReportQueryResult): boolean => {
	const hasBucket = result.columns.some((c) => c.name === 'bucket');
	const hasDim = result.columns.some((c) => c.role === 'dimension' && c.name !== 'currency' && c.name !== 'bucket');
	return entry.default_shape !== 'histogram' && (hasBucket || hasDim);
};

const shortLabel = (label: string) => (/^\d{4}-\d{2}-\d{2}T/.test(label) ? label.slice(0, 10) : label);

interface Props {
	entry: ReportCatalogEntry;
	result: ReportQueryResult;
	currency: string;
}

const ReportChart = ({ entry, result, currency }: Props) => {
	const { t } = useTranslation('settings');
	if (!chartSupported(entry, result)) return null;
	const data = toSeries(result, entry.key, currency).map((p) => ({ ...p, label: shortLabel(p.label) }));
	const hasPrev = data.some((p) => p.prev !== undefined);
	const fmt = (v: number) => formatValue(v, entry.value_type, currency);
	return (
		<div className='h-72 w-full'>
			<ResponsiveContainer width='100%' height='100%'>
				<ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
					<CartesianGrid strokeDasharray='3 3' vertical={false} />
					<XAxis dataKey='label' tickLine={false} axisLine={false} fontSize={12} />
					<YAxis tickFormatter={fmt} tickLine={false} axisLine={false} fontSize={12} width={90} />
					<Tooltip formatter={(v: number) => fmt(v)} />
					{hasPrev && <Bar dataKey='prev' name={t('insightsTools.revenue.reports.previous')} fill={PREVIOUS} radius={[4, 4, 0, 0]} />}
					<Bar dataKey='current' name={entry.name} fill={CURRENT} radius={[4, 4, 0, 0]} />
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	);
};

export default ReportChart;
