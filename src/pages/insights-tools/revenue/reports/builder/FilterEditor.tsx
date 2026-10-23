import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button, Input, Select } from '@/components/atoms';
import { CustomerSearchSelect } from '@/components/molecules/Customer';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/models';
import { BuilderFilter, BuilderFilterOp, Dataset, DatasetField } from '@/types/dto/Reports';
import { MAX_FILTERS, opsFor } from './builderModel';

const MULTI: BuilderFilterOp[] = ['in', 'not_in'];

interface Props {
	dataset: Dataset;
	filters: BuilderFilter[];
	onChange: (next: BuilderFilter[]) => void;
}

const fitValues = (op: BuilderFilterOp, v: string[]) => (MULTI.includes(op) ? v : v.slice(0, op === 'between' ? 2 : 1));

const FilterEditor = ({ dataset, filters, onChange }: Props) => {
	const { t } = useTranslation('settings', { keyPrefix: 'insightsTools.revenue.reports.builder' });
	const [customers, setCustomers] = useState<Record<string, string>>({});
	const [drafts, setDrafts] = useState<Record<number, string>>({});
	const fields = dataset.fields.filter((f) => f.filter);

	const replace = (i: number, f: BuilderFilter) => onChange(filters.map((x, j) => (j === i ? f : x)));
	const newFilter = (field: DatasetField): BuilderFilter => ({ field: field.key, op: opsFor(field)[0], value: [] });

	const valueControl = (f: BuilderFilter, i: number, field: DatasetField) => {
		const n = i + 1;
		const label = t('filterValue', { n });
		const multi = MULTI.includes(f.op);
		const setValues = (value: string[]) => replace(i, { ...f, value });
		const add = (v: string) => v && setValues(multi ? [...new Set([...f.value, v])] : [v]);

		if (f.op === 'between') {
			return (
				<>
					<Input
						className='w-28'
						aria-label={t('filterMin', { n })}
						value={f.value[0] ?? ''}
						onChange={(v) => setValues([v, f.value[1] ?? ''])}
					/>
					<Input
						className='w-28'
						aria-label={t('filterMax', { n })}
						value={f.value[1] ?? ''}
						onChange={(v) => setValues([f.value[0] ?? '', v])}
					/>
				</>
			);
		}
		if (field.customer) {
			return (
				<CustomerSearchSelect
					includeNoneOption={false}
					display={{ placeholder: label }}
					value={undefined}
					onChange={(c: Customer | undefined) => {
						if (!c?.id) return;
						setCustomers((prev) => ({ ...prev, [c.id]: c.name }));
						add(c.id);
					}}
				/>
			);
		}
		const options =
			field.kind === 'bool'
				? ['true', 'false'].map((v) => ({ value: v, label: t(`bool.${v}`) }))
				: field.enum?.map((v) => ({ value: v, label: v }));
		if (options) {
			return <Select className='w-44' ariaLabel={label} value={multi ? undefined : f.value[0]} options={options} onChange={add} />;
		}
		if (!multi) return <Input className='w-44' aria-label={label} value={f.value[0] ?? ''} onChange={(v) => setValues([v])} />;
		return (
			<Input
				className='w-44'
				aria-label={label}
				placeholder={t('addValueHint')}
				value={drafts[i] ?? ''}
				onChange={(v) => setDrafts((d) => ({ ...d, [i]: v }))}
				onKeyDown={(e) => {
					if (e.key !== 'Enter') return;
					e.preventDefault();
					add((drafts[i] ?? '').trim());
					setDrafts((d) => ({ ...d, [i]: '' }));
				}}
			/>
		);
	};

	return (
		<div className='flex flex-col gap-2'>
			{filters.map((f, i) => {
				const n = i + 1;
				const field = fields.find((x) => x.key === f.field);
				const chips = field && (MULTI.includes(f.op) || field.customer) ? f.value : [];
				return (
					<div key={i} className='flex flex-col gap-1'>
						<div className='flex flex-wrap items-center gap-2'>
							<Select
								className='w-44'
								ariaLabel={t('filterField', { n })}
								value={f.field}
								options={fields.map((x) => ({ value: x.key, label: x.label }))}
								onChange={(v) => {
									const next = fields.find((x) => x.key === v);
									if (next) replace(i, newFilter(next));
								}}
							/>
							{field && (
								<Select
									className='w-36'
									ariaLabel={t('filterOp', { n })}
									value={f.op}
									options={opsFor(field).map((op) => ({ value: op, label: t(`ops.${op}`) }))}
									onChange={(v) => {
										const op = v as BuilderFilterOp;
										if (op) replace(i, { ...f, op, value: fitValues(op, f.value) });
									}}
								/>
							)}
							{field && valueControl(f, i, field)}
							<Button
								type='button'
								variant='ghost'
								size='icon'
								aria-label={t('removeFilter', { n })}
								onClick={() => {
									setDrafts({});
									onChange(filters.filter((_, j) => j !== i));
								}}>
								<X className='h-4 w-4' />
							</Button>
						</div>
						{chips.length > 0 && (
							<div className='flex flex-wrap gap-1'>
								{chips.map((v) => {
									const shown = customers[v] ?? v;
									return (
										<Badge key={v} variant='secondary' className='gap-1'>
											{shown}
											<button
												type='button'
												aria-label={t('removeValue', { value: shown })}
												onClick={() => replace(i, { ...f, value: f.value.filter((x) => x !== v) })}>
												<X className='h-3 w-3' />
											</button>
										</Badge>
									);
								})}
							</div>
						)}
					</div>
				);
			})}
			<div>
				<Button
					type='button'
					variant='outline'
					size='sm'
					disabled={filters.length >= MAX_FILTERS || fields.length === 0}
					onClick={() => onChange([...filters, newFilter(fields[0])])}>
					{t('addFilter')}
				</Button>
			</div>
		</div>
	);
};

export default FilterEditor;
