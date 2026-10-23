import { useTranslation } from 'react-i18next';
import { Select } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { ReportCatalogEntry } from '@/types/dto/Reports';
import { RANGE_PRESETS, RangePreset, ReportControls, presetAllowed } from './reportMath';

interface Props {
	entry: ReportCatalogEntry;
	controls: ReportControls;
	currencies: string[];
	onChange: (next: ReportControls) => void;
	basis?: { options: { value: string; label: string }[]; value: string; onPick: (v: string) => void };
}

interface SegmentedProps {
	label: string;
	options: { value: string; label: string }[];
	value: string;
	onPick: (v: string) => void;
}

const Segmented = ({ label, options, value, onPick }: SegmentedProps) => (
	<div className='flex flex-col gap-1'>
		<span className='text-sm font-medium'>{label}</span>
		<div role='group' aria-label={label} className='flex rounded-md border p-0.5'>
			{options.map((o) => (
				<button
					key={o.value}
					type='button'
					aria-pressed={o.value === value}
					onClick={() => onPick(o.value)}
					className={cn('rounded px-3 py-1 text-sm', o.value === value ? 'bg-zinc-100 font-medium' : 'text-muted-foreground')}>
					{o.label}
				</button>
			))}
		</div>
	</div>
);

const ReportControlsBar = ({ entry, controls, currencies, onChange, basis }: Props) => {
	const { t } = useTranslation('settings');
	const k = (s: string) => t(`insightsTools.revenue.reports.${s}`);
	const set = (patch: Partial<ReportControls>) => onChange({ ...controls, ...patch });
	const snapshot = entry.kind === 'snapshot';
	const text = {
		range: k('range'),
		grain: k('grain'),
		currency: k('currency'),
		groupBy: k('groupBy'),
		compare: k('compare'),
		view: k('view'),
		basis: k('basis'),
	};
	const groupRequired = entry.default_shape === 'breakdown';

	return (
		<div className='flex flex-wrap items-end gap-4'>
			{basis && <Segmented label={text.basis} value={basis.value} options={basis.options} onPick={basis.onPick} />}
			<Select
				label={text.range}
				value={controls.preset}
				options={RANGE_PRESETS.map((p) => {
					const ok = presetAllowed(entry, p);
					return {
						value: p,
						label: k(`presets.${p}`),
						disabled: !ok,
						description: ok ? undefined : t('insightsTools.revenue.reports.maxRangeHint', { count: entry.max_range_days }),
					};
				})}
				onChange={(v) => v && set({ preset: v as RangePreset })}
			/>
			{!snapshot && entry.grains.length > 0 && !controls.groupBy && (
				<Segmented
					label={text.grain}
					value={controls.grain}
					options={entry.grains.map((g) => ({ value: g, label: k(`grains.${g}`) }))}
					onPick={(v) => set({ grain: v as ReportControls['grain'] })}
				/>
			)}
			{currencies.length > 0 && (
				<Select
					label={text.currency}
					value={controls.currency || currencies[0]}
					options={currencies.map((c) => ({ value: c, label: c.toUpperCase() }))}
					onChange={(v) => v && set({ currency: v })}
				/>
			)}
			{entry.dimensions.length > 0 && (
				<Select
					label={text.groupBy}
					value={controls.groupBy || 'none'}
					options={[
						...(groupRequired ? [] : [{ value: 'none', label: k('none') }]),
						...entry.dimensions.map((d) => ({ value: d.key, label: d.label })),
					]}
					onChange={(v) => {
						if (groupRequired && !v) return;
						set({ groupBy: v === 'none' ? '' : v });
					}}
				/>
			)}
			{!snapshot && entry.supports_compare && (
				<Select
					label={text.compare}
					value={controls.compare}
					options={(['previous_period', 'previous_year', 'none'] as const).map((c) => ({ value: c, label: k(`compares.${c}`) }))}
					onChange={(v) => v && set({ compare: v as ReportControls['compare'] })}
				/>
			)}
			<Segmented
				label={text.view}
				value={controls.view}
				options={[
					{ value: 'chart', label: k('chart') },
					{ value: 'table', label: k('table') },
				]}
				onPick={(v) => set({ view: v as ReportControls['view'] })}
			/>
		</div>
	);
};

export default ReportControlsBar;
