import DeltaChip from '../reports/DeltaChip';
import { deltaDisplay } from '../reports/reportMath';

export interface StatProps {
	label: string;
	value: string;
	current?: number;
	// Omit to hide the delta chip.
	prev?: number;
	higherIsBetter?: boolean;
	note?: string;
}

const Stat = ({ label, value, current, prev, higherIsBetter = true, note }: StatProps) => {
	const d = current !== undefined && prev !== undefined ? deltaDisplay(String(current), String(prev), undefined, higherIsBetter) : null;
	return (
		<div className='flex flex-col gap-1'>
			<span className='text-xs text-content-zinc-tertiary'>{label}</span>
			<span className='text-lg font-semibold tabular-nums text-content-zinc-bold'>{value}</span>
			{note && <span className='text-xs text-content-zinc-tertiary'>{note}</span>}
			{d && (
				<span>
					<DeltaChip display={d} />
				</span>
			)}
		</div>
	);
};

export const StatRow = ({ stats }: { stats: StatProps[] }) => (
	<div className='flex flex-wrap gap-x-8 gap-y-3 [&>*:not(:first-child)]:border-s [&>*:not(:first-child)]:border-line [&>*:not(:first-child)]:ps-8'>
		{stats.map((s) => (
			<Stat key={s.label} {...s} />
		))}
	</div>
);

export default Stat;
