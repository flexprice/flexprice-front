import { PALETTE } from './revenueMath';

export interface RankedItem {
	key: string;
	label: string;
	value: number;
	// Stacked segments, horizontal only.
	parts?: number[];
	color?: string;
}

export interface RankedBarsProps {
	items: RankedItem[];
	format: (v: number) => string;
	// Columns, kept in given order.
	vertical?: boolean;
	color?: string;
	// Per-part colors for stacked items.
	colors?: string[];
	// Fixed scale, e.g. 100 for percents.
	max?: number;
}

const pct = (v: number, max: number) => `${max > 0 ? Math.max((v / max) * 100, 0) : 0}%`;

const RankedBars = ({ items, format, vertical = false, color = PALETTE[0], colors, max: fixedMax }: RankedBarsProps) => {
	const max = fixedMax ?? Math.max(0, ...items.map((i) => i.value));
	if (vertical) {
		return (
			<ul className='flex h-56 items-end gap-3'>
				{items.map((i) => (
					<li key={i.key} className='flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1'>
						<span className='text-xs font-medium tabular-nums text-content-zinc-bold'>{format(i.value)}</span>
						<span className='w-full max-w-12 rounded-t-sm' style={{ height: pct(i.value, max), backgroundColor: i.color ?? color }} />
						<span className='truncate text-center text-xs text-content-zinc-tertiary'>{i.label}</span>
					</li>
				))}
			</ul>
		);
	}
	return (
		<ul className='flex flex-col gap-3'>
			{items.map((i) => (
				<li key={i.key} className='grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm'>
					<span className='truncate text-content-zinc-bold' title={i.label}>
						{i.label}
					</span>
					<span className='flex h-5 rounded-sm bg-surface-muted'>
						{(i.parts ?? [i.value]).map((p, j) => (
							<span
								key={j}
								className='h-full first:rounded-s-sm last:rounded-e-sm'
								style={{ width: pct(p, max), backgroundColor: colors?.[j] ?? i.color ?? color }}
							/>
						))}
					</span>
					<span className='tabular-nums text-content-zinc-bold'>{format(i.value)}</span>
				</li>
			))}
		</ul>
	);
};

export default RankedBars;
