import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/atoms';
import { Dataset, DatasetDefinition, ReportCompare, ReportGrain } from '@/types/dto/Reports';
import { RANGE_PRESETS, presetAllowed } from '../reportMath';
import { Segmented } from '../ReportControlsBar';
import { MAX_DIMENSIONS, defaultDefinition, validateBuilder, withTopN } from './builderModel';
import FilterEditor from './FilterEditor';
import MeasureEditor from './MeasureEditor';

type SectionKey = 'measures' | 'groupBy' | 'filters' | 'time';

const sectionOf = (errKey: string): SectionKey => {
	const name = errKey.replace('builder.errors.', '');
	if (name.startsWith('measure') || name === 'countNoField') return 'measures';
	if (name.startsWith('dimension')) return 'groupBy';
	if (name.startsWith('filter')) return 'filters';
	return 'time';
};

const NONE = '__none__';

interface Props {
	datasets: Dataset[];
	value: DatasetDefinition;
	onChange: (def: DatasetDefinition) => void;
}

const ReportBuilder = ({ datasets, value, onChange }: Props) => {
	const { t } = useTranslation('settings', { keyPrefix: 'insightsTools.revenue.reports' });
	const ds = datasets.find((d) => d.key === value.dataset);
	const set = (patch: Partial<DatasetDefinition>) => onChange(withTopN({ ...value, ...patch }));

	const datasetSelect = (
		<Select
			className='w-64'
			label={t('builder.dataset')}
			value={value.dataset}
			description={ds?.description}
			options={datasets.map((d) => ({ value: d.key, label: d.label, description: d.description }))}
			onChange={(v) => {
				const next = datasets.find((d) => d.key === v);
				if (next && next.key !== value.dataset) onChange(defaultDefinition(next));
			}}
		/>
	);
	if (!ds) return <div className='flex flex-col gap-4'>{datasetSelect}</div>;

	const errs: Record<SectionKey, string[]> = { measures: [], groupBy: [], filters: [], time: [] };
	for (const e of validateBuilder(ds, value)) errs[sectionOf(e)].push(e);
	const section = (title: string, sectionErrors: string[], body: ReactNode) => (
		<section aria-label={title} className='flex flex-col gap-2'>
			<h3 className='text-sm font-medium'>{title}</h3>
			{body}
			{sectionErrors.map((e) => (
				<p key={e} className='text-xs text-destructive'>
					{t(e, { count: ds.max_range_days })}
				</p>
			))}
		</section>
	);

	const dims = value.dimensions ?? [];
	const groupFields = ds.fields.filter((f) => f.group);
	const setDim = (i: number, v: string) => {
		const next = [...dims];
		next[i] = v === NONE ? '' : v;
		set({ dimensions: next.filter(Boolean) });
	};
	const timeFields = ds.fields.filter((f) => f.kind === 'time');
	const usage = ds.key === 'usage';
	const grain = value.time.grain || NONE;

	return (
		<div className='flex flex-col gap-5'>
			{datasetSelect}
			{section(
				t('builder.measures'),
				errs.measures,
				<MeasureEditor dataset={ds} measures={value.measures} onChange={(measures) => set({ measures })} />,
			)}
			{section(
				t('groupBy'),
				errs.groupBy,
				<div className='flex flex-wrap items-end gap-3'>
					{Array.from({ length: MAX_DIMENSIONS }, (_, i) => (
						<Select
							key={i}
							className='w-48'
							ariaLabel={t('builder.groupByN', { n: i + 1 })}
							disabled={i > 0 && (!!value.time.grain || !dims[0])}
							value={dims[i] ?? NONE}
							options={[
								{ value: NONE, label: t('none') },
								...groupFields.map((f) => ({ value: f.key, label: f.label, disabled: dims.includes(f.key) && dims[i] !== f.key })),
							]}
							onChange={(v) => setDim(i, v || NONE)}
						/>
					))}
				</div>,
			)}
			{section(
				t('builder.filters'),
				errs.filters,
				<FilterEditor dataset={ds} filters={value.filters ?? []} onChange={(filters) => set({ filters })} />,
			)}
			{section(
				t('builder.time'),
				errs.time,
				<div className='flex flex-wrap items-end gap-4'>
					<Select
						className='w-40'
						label={t('builder.timeField')}
						value={value.time.field}
						options={timeFields.map((f) => ({ value: f.key, label: f.label }))}
						onChange={(v) => v && set({ time: { ...value.time, field: v } })}
					/>
					<Select
						className='w-44'
						label={t('range')}
						value={value.time.range}
						options={[
							...RANGE_PRESETS.map((p) => {
								const ok = presetAllowed(ds, p);
								return {
									value: p,
									label: t(`presets.${p}`),
									disabled: !ok,
									description: ok ? undefined : t('maxRangeHint', { count: ds.max_range_days }),
								};
							}),
							...((RANGE_PRESETS as string[]).includes(value.time.range) ? [] : [{ value: value.time.range, label: value.time.range }]),
						]}
						onChange={(v) => v && set({ time: { ...value.time, range: v } })}
					/>
					<Segmented
						label={t('grain')}
						value={grain}
						options={[NONE, 'day', 'week', 'month'].map((g) => ({ value: g, label: g === NONE ? t('none') : t(`grains.${g}`) }))}
						onPick={(g) =>
							g === NONE
								? set({ time: { ...value.time, grain: '' } })
								: set({ time: { ...value.time, grain: g as ReportGrain }, dimensions: dims.slice(0, 1) })
						}
					/>
					{!usage && (
						<Select
							className='w-48'
							label={t('compare')}
							value={value.compare ?? NONE}
							options={[
								...(['previous_period', 'previous_year'] as const).map((c) => ({ value: c, label: t(`compares.${c}`) })),
								{ value: NONE, label: t('compares.none') },
							]}
							onChange={(v) => set({ compare: !v || v === NONE ? undefined : (v as ReportCompare) })}
						/>
					)}
				</div>,
			)}
			<Segmented
				label={t('view')}
				value={value.display ?? 'chart'}
				options={[
					{ value: 'chart', label: t('chart') },
					{ value: 'table', label: t('table') },
				]}
				onPick={(v) => set({ display: v as DatasetDefinition['display'] })}
			/>
		</div>
	);
};

export default ReportBuilder;
