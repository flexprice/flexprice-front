import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SeriesRow } from './revenueMath';

export interface ChartSeries {
	key: string;
	label: string;
	color: string;
	kind?: 'bar' | 'line';
	dashed?: boolean;
	// Shown next to the legend label.
	total?: string;
	axis?: 'left' | 'right';
}

export interface SeriesChartProps {
	data: SeriesRow[];
	series: ChartSeries[];
	xLabel: (bucket: string) => string;
	format: (v: number) => string;
	stacked?: boolean;
	height?: number;
	// Formats the right axis, when used.
	rightFormat?: (v: number) => string;
}

export const SeriesLegend = ({ series }: { series: ChartSeries[] }) => (
	<ul className='flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-content-zinc-tertiary'>
		{series.map((s) => (
			<li key={s.key} className='flex items-center gap-1.5'>
				{s.kind === 'line' ? (
					<span className='w-4 border-t-2' style={{ borderColor: s.color, borderStyle: s.dashed ? 'dashed' : 'solid' }} />
				) : (
					<span className='h-2.5 w-2.5 rounded-sm' style={{ backgroundColor: s.color }} />
				)}
				<span>{s.label}</span>
				{s.total && <span className='font-medium tabular-nums text-content-zinc-bold'>{s.total}</span>}
			</li>
		))}
	</ul>
);

const SeriesChart = ({ data, series, xLabel, format, stacked = false, height = 288, rightFormat }: SeriesChartProps) => {
	const right = new Set(series.filter((s) => s.axis === 'right').map((s) => s.key));
	const bars = series.filter((s) => s.kind !== 'line');
	const lines = series.filter((s) => s.kind === 'line');
	return (
		<div className='flex flex-col gap-3'>
			<div className='w-full' style={{ height }}>
				<ResponsiveContainer width='100%' height='100%'>
					<ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
						<CartesianGrid strokeDasharray='3 3' vertical={false} />
						<XAxis dataKey='bucket' tickFormatter={xLabel} tickLine={false} axisLine={false} fontSize={12} />
						<YAxis yAxisId='left' tickFormatter={format} tickLine={false} axisLine={false} fontSize={12} width={72} />
						{rightFormat && (
							<YAxis yAxisId='right' orientation='right' tickFormatter={rightFormat} tickLine={false} axisLine={false} fontSize={12} />
						)}
						<Tooltip
							labelFormatter={(b: string) => xLabel(b)}
							formatter={(v: number, name: string, item: { dataKey?: unknown }) => [
								(rightFormat && right.has(String(item.dataKey)) ? rightFormat : format)(v),
								name,
							]}
						/>
						{bars.map((s, i) => (
							<Bar
								key={s.key}
								dataKey={s.key}
								name={s.label}
								fill={s.color}
								yAxisId={s.axis ?? 'left'}
								stackId={stacked ? 'stack' : undefined}
								maxBarSize={40}
								radius={!stacked || i === bars.length - 1 ? [3, 3, 0, 0] : 0}
							/>
						))}
						{lines.map((s) => (
							<Line
								key={s.key}
								dataKey={s.key}
								name={s.label}
								stroke={s.color}
								yAxisId={s.axis ?? 'left'}
								strokeWidth={2}
								strokeDasharray={s.dashed ? '4 4' : undefined}
								dot={false}
								type='monotone'
							/>
						))}
					</ComposedChart>
				</ResponsiveContainer>
			</div>
			<SeriesLegend series={series} />
		</div>
	);
};

export default SeriesChart;
