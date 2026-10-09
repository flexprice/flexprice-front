import { type ReactNode, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ActionButton, AddButton, Card, Chip, FormHeader, Loader, NoDataCard, ShortPagination, Tooltip } from '@/components/atoms';
import FlexpriceTable, { type ColumnData } from '@/components/molecules/Table';
import ForexRateModal, { type ForexRateFormValues } from '@/components/molecules/ForexRateModal';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { getTypographyClass } from '@/lib/typography';
import type { FxRate } from '@/models/FxRate';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { formatFxRate } from '@/utils/fx/formatFxRate';
import { getOverrideStatus, type OverrideStatus } from '@/utils/fx/overrideStatus';
import { FX_OVERRIDES_KEY, type FxOverrideOwner, useScopedFxOverrides } from '@/hooks/useScopedFxOverrides';

const PAGE_SIZE = 10;

const STATUS_VARIANT: Record<OverrideStatus, 'success' | 'info' | 'default'> = {
	active: 'success',
	scheduled: 'info',
	expired: 'default',
};

export interface FxOverridesSectionProps extends FxOverrideOwner {
	paginationPrefix: PAGINATION_PREFIX;
	/** Shown when the list is empty. */
	emptyText: string;
	/** Hides Add and the row actions; rows stay visible. */
	readOnly?: boolean;
	/** False hides Add, e.g. when nothing needs converting. Defaults to true. */
	canAdd?: boolean;
	/** Both set = new overrides use this pair; otherwise the user picks it. */
	lockedFrom?: string;
	lockedTo?: string;
	/** Renders nothing while the list is empty and Add is unavailable. */
	hideWhenEmpty?: boolean;
	hint?: string;
	/** 'card' matches the Edit Subscription sections (Credit Grants); 'inline' matches the customer Information tab. */
	layout?: 'inline' | 'card';
}

const toValues = (rate: FxRate): ForexRateFormValues => ({
	from_currency: rate.from_currency,
	to_currency: rate.to_currency,
	rate: rate.rate,
	...(rate.start_date ? { start_date: rate.start_date } : {}),
	...(rate.end_date ? { end_date: rate.end_date } : {}),
});

const FxOverridesSection = ({
	scope,
	scopeId,
	paginationPrefix,
	emptyText,
	readOnly = false,
	canAdd = true,
	lockedFrom,
	lockedTo,
	hideWhenEmpty = false,
	hint,
	layout = 'inline',
}: FxOverridesSectionProps) => {
	const { t } = useTranslation(['customers', 'common']);
	const { can } = useCurrentUserPermissions();
	const canWrite = can('fxrate', 'write');
	const { page, limit, offset } = usePagination({ initialLimit: PAGE_SIZE, prefix: paginationPrefix });
	const { overrides, total, isLoading, isError, createOverride, updateOverride, deleteOverride } = useScopedFxOverrides(
		{ scope, scopeId },
		{ page, limit, offset },
	);

	const [isOpen, setIsOpen] = useState(false);
	const [editing, setEditing] = useState<FxRate | null>(null);
	const editingValues = useMemo(() => (editing ? toValues(editing) : undefined), [editing]);

	const open = (rate: FxRate | null) => {
		setEditing(rate);
		setIsOpen(true);
	};

	const onError = (error: Error) => toast.error(error.message);

	const handleSave = (values: ForexRateFormValues) => {
		const done = (key: 'created' | 'updated') => () => {
			toast.success(t(`tabPanels.information.fxOverrides.toast.${key}`));
			setIsOpen(false);
		};
		if (editing && editingValues) {
			updateOverride.mutate({ id: editing.id, original: editingValues, values }, { onSuccess: done('updated'), onError });
			return;
		}
		createOverride.mutate(values, { onSuccess: done('created'), onError });
	};

	const writeDenied = t('tabPanels.information.fxOverrides.writeDeniedTooltip');
	const dateOr = (value: string | null | undefined, fallback: string) => (value ? formatDateTimeWithSecondsAndTimezone(value) : fallback);

	const columns: ColumnData<FxRate>[] = [
		{
			title: t('tabPanels.information.fxOverrides.columns.rate'),
			render: (row) => formatFxRate(row.from_currency, row.to_currency, row.rate),
		},
		{
			title: t('tabPanels.information.fxOverrides.columns.validFrom'),
			render: (row) => dateOr(row.start_date, t('tabPanels.information.fxOverrides.always')),
		},
		{
			title: t('tabPanels.information.fxOverrides.columns.validUntil'),
			render: (row) => dateOr(row.end_date, t('tabPanels.information.fxOverrides.noEnd')),
		},
		{
			title: t('tabPanels.information.fxOverrides.columns.status'),
			render: (row) => {
				const status = getOverrideStatus(row.start_date, row.end_date);
				return <Chip variant={STATUS_VARIANT[status]} label={t(`tabPanels.information.fxOverrides.status.${status}`)} />;
			},
		},
		...(readOnly
			? []
			: [
					{
						fieldVariant: 'interactive' as const,
						hideOnEmpty: true,
						render: (row: FxRate) => (
							<ActionButton
								id={row.id}
								entityName={t('tabPanels.information.fxOverrides.entityName')}
								deleteMutationFn={async (id) => {
									await deleteOverride(id);
									toast.success(t('tabPanels.information.fxOverrides.toast.deleted'));
								}}
								refetchQueryKey={FX_OVERRIDES_KEY}
								disableToast
								edit={{ enabled: true, disabled: !canWrite, disabledReason: canWrite ? undefined : writeDenied, onClick: () => open(row) }}
								archive={{
									enabled: true,
									disabled: !canWrite,
									disabledReason: canWrite ? undefined : writeDenied,
									text: t('tabPanels.information.fxOverrides.delete'),
								}}
							/>
						),
					},
				]),
	];

	// The card layout uses the plain "Add" button, like the other Edit Subscription sections.
	const addLabel = layout === 'card' ? undefined : t('tabPanels.information.fxOverrides.add');
	const addVariant = layout === 'card' ? undefined : 'outline';
	const addButton: ReactNode = canWrite ? (
		<AddButton variant={addVariant} label={addLabel} onClick={() => open(null)} />
	) : (
		<Tooltip content={writeDenied}>
			<span tabIndex={0} className='inline-block'>
				<AddButton variant={addVariant} label={addLabel} disabled />
			</span>
		</Tooltip>
	);
	const showAdd = !readOnly && canAdd;
	const title = t('tabPanels.information.fxOverrides.title');

	const body = isLoading ? (
		<div className='flex min-h-[120px] items-center justify-center'>
			<Loader />
		</div>
	) : isError ? (
		<p className='text-sm text-destructive'>{t('tabPanels.information.fxOverrides.loadError')}</p>
	) : overrides.length === 0 ? (
		<p className='py-4 text-sm text-content-zinc-subtle'>{emptyText}</p>
	) : (
		<div className='space-y-4'>
			<FlexpriceTable columns={columns} data={overrides} variant='no-bordered' />
			<ShortPagination
				unit={t('tabPanels.information.fxOverrides.paginationUnit')}
				totalItems={total}
				pageSize={limit}
				prefix={paginationPrefix}
			/>
		</div>
	);

	const modal = (
		<ForexRateModal
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			data={editingValues}
			lockedFrom={lockedFrom}
			lockedTo={lockedTo}
			showWindow
			isSaving={createOverride.isPending || updateOverride.isPending}
			onSave={handleSave}
		/>
	);

	// Hidden while loading too, so a section with nothing to show never flashes in.
	if (hideWhenEmpty && (readOnly || !canAdd) && (isLoading || (!isError && overrides.length === 0))) return null;

	if (layout === 'card') {
		return (
			<>
				{!isLoading && !isError && overrides.length === 0 ? (
					<NoDataCard title={title} subtitle={emptyText} cta={showAdd ? addButton : undefined} />
				) : (
					<Card variant='notched'>
						<div className='flex items-center justify-between mb-4'>
							<FormHeader title={title} variant='sub-header' titleClassName='font-semibold' className='mb-0' />
							{showAdd && addButton}
						</div>
						{hint ? <p className='text-xs text-content-zinc-subtle'>{hint}</p> : null}
						<div className='mt-4'>{body}</div>
					</Card>
				)}
				{modal}
			</>
		);
	}

	return (
		<div className='mt-8'>
			<div className='flex justify-between items-center mb-2'>
				<h3 className={getTypographyClass('card-header') + '!text-[16px]'}>{title}</h3>
				{showAdd && addButton}
			</div>
			{hint ? <p className='mb-3 text-xs text-content-zinc-subtle'>{hint}</p> : null}
			{body}
			{modal}
		</div>
	);
};

export default FxOverridesSection;
