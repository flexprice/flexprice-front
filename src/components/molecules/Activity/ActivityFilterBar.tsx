import { FC, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button, DateRangePicker, Input, Select } from '@/components/atoms';
import AsyncSearchableSelect from '@/components/atoms/Select/AsyncSearchableSelect';
import CustomerApi from '@/api/CustomerApi';
import { PlanApi } from '@/api/PlanApi';
import { ACTIVITY_ACTIONS, ACTIVITY_ACTOR_TYPES, ACTIVITY_ENTITY_TYPES } from '@/constants/activity';
import { labelFor, shortId } from './entityRegistry';
import { EntityRef } from './formatters';
import { ANY, ActivityFilterState, SEARCHABLE_ENTITY_TYPES, actionsFor, withEntityType, withRange } from './filterState';

type Row = Record<string, unknown> & { id: string };

const toRows = (items: unknown, type: string) => (items as Row[]).map((r) => ({ value: r.id, label: labelFor(type, r), data: r }));

const searchFor = (type: string) => {
	if (!(SEARCHABLE_ENTITY_TYPES as readonly string[]).includes(type)) return null;
	if (type === 'customer') return async (q: string) => toRows((await CustomerApi.searchCustomers(q, 20)).items, 'customer');
	return async (q: string) => {
		const needle = q.toLowerCase();
		const res = await PlanApi.getPlansByFilter({ limit: 50 });
		return toRows(
			(res.items as unknown as Row[]).filter(
				(r) =>
					!needle ||
					String(r.name ?? '')
						.toLowerCase()
						.includes(needle),
			),
			'plan',
		);
	};
};

const Pill: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
	<div className='inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-sm'>
		<span className='text-xs text-content-muted whitespace-nowrap'>{label}</span>
		{children}
	</div>
);

const Chip: FC<{ label: string; removeLabel: string; onRemove: () => void; children: ReactNode }> = ({
	label,
	removeLabel,
	onRemove,
	children,
}) => (
	<div className='inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-sm'>
		<span className='text-xs text-content-muted'>{label}</span>
		{children}
		<button type='button' aria-label={removeLabel} onClick={onRemove} className='text-content-muted hover:text-content'>
			<X className='h-3.5 w-3.5' />
		</button>
	</div>
);

interface Props {
	value: ActivityFilterState;
	onChange: (f: ActivityFilterState) => void;
	onClear: () => void;
}

const ActivityFilterBar: FC<Props> = ({ value, onChange, onClear }) => {
	const { t } = useTranslation('activity');
	const [picked, setPicked] = useState<Row | undefined>();
	const any = { value: ANY, label: t('filters.any') };
	const fromSelect = (v: string) => (v === ANY ? '' : v);
	const search = searchFor(value.entityType);
	const trigger = 'h-7 border-0 shadow-none px-1 min-w-[90px]';

	return (
		<div className='flex flex-wrap items-center gap-2' data-testid='activity-filter-bar'>
			<Pill label={t('filters.entityType')}>
				<Select
					className={trigger}
					value={value.entityType || ANY}
					options={[
						any,
						...ACTIVITY_ENTITY_TYPES.map((v) => ({ value: v, label: t(`entity.${v}`, { defaultValue: v.replace(/_/g, ' ') }) })),
					]}
					onChange={(v) => {
						setPicked(undefined);
						onChange(withEntityType(value, fromSelect(v)));
					}}
				/>
			</Pill>

			<Pill label={t('filters.entity')}>
				{search ? (
					<div className='min-w-[220px]'>
						<AsyncSearchableSelect<Row>
							search={{ searchFn: search, queryKeyPrefix: ['activity-entity', value.entityType], placeholder: t('filters.entitySearch') }}
							extractors={{ valueExtractor: (r) => r.id, labelExtractor: (r) => labelFor(value.entityType, r) }}
							value={picked && picked.id === value.entityId ? picked : undefined}
							onChange={(r) => {
								setPicked(r);
								onChange({ ...value, entityId: r?.id ?? '' });
							}}
							display={{ placeholder: t('filters.any'), side: 'bottom' }}
						/>
					</div>
				) : (
					<Input
						className='h-7 border-0 bg-transparent shadow-none px-1 w-[200px]'
						disabled={!value.entityType}
						placeholder={value.entityType ? t('filters.entityIdPlaceholder') : t('filters.pickTypeFirst')}
						value={value.entityId}
						onChange={(v) => onChange({ ...value, entityId: v.trim() })}
					/>
				)}
			</Pill>

			<Pill label={t('filters.actor')}>
				<Select
					className={trigger}
					value={value.actorType || ANY}
					options={[any, ...ACTIVITY_ACTOR_TYPES.map((v) => ({ value: v, label: t(`actor.${v}`, { defaultValue: v }) }))]}
					onChange={(v) => onChange({ ...value, actorType: fromSelect(v) })}
				/>
			</Pill>

			<Pill label={t('filters.action')}>
				<Select
					className={trigger}
					value={value.action || ANY}
					options={[
						any,
						...actionsFor(value.entityType, ACTIVITY_ACTIONS).map((a) => ({ value: a, label: a.replace('.', ' · ').replace(/_/g, ' ') })),
					]}
					onChange={(v) => onChange({ ...value, action: fromSelect(v) })}
				/>
			</Pill>

			<Pill label={t('filters.date')}>
				<DateRangePicker
					startDate={value.start}
					// An open-ended range runs to now; the picker only renders a label when it has both ends.
					endDate={value.end ?? (value.start ? new Date() : undefined)}
					className='!h-7 w-auto border-0 bg-transparent px-1 shadow-none'
					onChange={({ startDate, endDate }) => onChange(withRange(value, startDate, endDate))}
				/>
			</Pill>

			{value.customerId && (
				<Chip
					label={t('filters.customer')}
					removeLabel={t('filters.removeCustomer')}
					onRemove={() => onChange({ ...value, customerId: '' })}>
					<EntityRef type='customer' id={value.customerId} />
				</Chip>
			)}
			{value.requestId && (
				<Chip label={t('filters.request')} removeLabel={t('filters.removeRequest')} onRemove={() => onChange({ ...value, requestId: '' })}>
					<code className='text-xs'>{shortId(value.requestId)}</code>
				</Chip>
			)}

			<Button variant='ghost' size='sm' onClick={onClear}>
				{t('filters.clear')}
			</Button>
		</div>
	);
};

export default ActivityFilterBar;
