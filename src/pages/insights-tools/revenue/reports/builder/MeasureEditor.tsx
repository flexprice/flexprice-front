import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { Button, Select } from '@/components/atoms';
import { Dataset, MeasureAgg, MeasureSpec } from '@/types/dto/Reports';
import { MAX_MEASURES, aggsFor } from './builderModel';

const AGGS: MeasureAgg[] = ['count', 'count_distinct', 'sum', 'avg', 'min', 'max'];

interface Props {
	dataset: Dataset;
	measures: MeasureSpec[];
	onChange: (next: MeasureSpec[]) => void;
}

const MeasureEditor = ({ dataset, measures, onChange }: Props) => {
	const { t } = useTranslation('settings', { keyPrefix: 'insightsTools.revenue.reports.builder' });
	const fieldsFor = (agg: MeasureAgg) => dataset.fields.filter((f) => agg !== 'count' && aggsFor(f).includes(agg));
	const aggs = AGGS.filter((a) => a === 'count' || fieldsFor(a).length > 0);

	const replace = (i: number, m: MeasureSpec) => onChange(measures.map((x, j) => (j === i ? m : x)));
	const move = (i: number, to: number) => {
		const next = [...measures];
		[next[i], next[to]] = [next[to], next[i]];
		onChange(next);
	};
	const pickAgg = (i: number, agg: MeasureAgg) => {
		if (agg === 'count') return replace(i, { agg });
		const keys = fieldsFor(agg).map((f) => f.key);
		const cur = measures[i].field;
		replace(i, { agg, field: cur && keys.includes(cur) ? cur : keys[0] });
	};

	return (
		<div className='flex flex-col gap-2'>
			{measures.map((m, i) => {
				const n = i + 1;
				return (
					<div key={i} className='flex flex-wrap items-center gap-2'>
						<Select
							className='w-40'
							ariaLabel={t('measureAgg', { n })}
							value={m.agg}
							options={aggs.map((a) => ({ value: a, label: t(`aggNames.${a}`) }))}
							onChange={(v) => v && pickAgg(i, v as MeasureAgg)}
						/>
						{m.agg !== 'count' && (
							<Select
								className='w-48'
								ariaLabel={t('measureField', { n })}
								value={m.field}
								options={fieldsFor(m.agg).map((f) => ({ value: f.key, label: f.label }))}
								onChange={(v) => v && replace(i, { ...m, field: v })}
							/>
						)}
						<Button
							type='button'
							variant='ghost'
							size='icon'
							aria-label={t('moveUp', { n })}
							disabled={i === 0}
							onClick={() => move(i, i - 1)}>
							<ArrowUp className='h-4 w-4' />
						</Button>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							aria-label={t('moveDown', { n })}
							disabled={i === measures.length - 1}
							onClick={() => move(i, i + 1)}>
							<ArrowDown className='h-4 w-4' />
						</Button>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							aria-label={t('removeMeasure', { n })}
							disabled={measures.length === 1}
							onClick={() => onChange(measures.filter((_, j) => j !== i))}>
							<X className='h-4 w-4' />
						</Button>
					</div>
				);
			})}
			<div>
				<Button
					type='button'
					variant='outline'
					size='sm'
					disabled={measures.length >= MAX_MEASURES}
					onClick={() => onChange([...measures, { agg: 'count' }])}>
					{t('addMeasure')}
				</Button>
			</div>
		</div>
	);
};

export default MeasureEditor;
