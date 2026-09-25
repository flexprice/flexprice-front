import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, RotateCcw, Trash2 } from 'lucide-react';
import { DatePicker, Select } from '@/components/atoms';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ADDON_CHANGE_TIMING, ADDON_PRORATION_BEHAVIOR } from '@/types/dto/Addon';
import { AddonAssociationResponse } from '@/types/dto/Subscription';
import { formatDateInZone } from '@/utils/common/format_date';
import type { AddonRemovalDraft } from '@/utils/subscription/buildAddonBulkModifyRequest';

interface Props {
	association: AddonAssociationResponse;
	chargesCount: number;
	/** Set when the addon is marked for removal in this change. */
	removal?: AddonRemovalDraft;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onMarkForRemoval: () => void;
	onUndoRemoval: () => void;
	onChange: (patch: Partial<AddonRemovalDraft>) => void;
	currentPeriodStart?: Date;
	currentPeriodEnd?: Date;
	/** Shown under the custom end date picker. */
	endDateError?: string;
	/** Blocks marking another removal (batch limit reached or request in flight). */
	disableRemove?: boolean;
	disabled?: boolean;
}

/**
 * An addon already on the subscription, listed in the modify addons dialog. Marking it for
 * removal keeps the row in place — tinted, struck through and tagged "Removing" — and opens the
 * end-date and proration choices inline, so every pending change stays visible and undoable
 * until Save.
 */
const ExistingAddonRow: React.FC<Props> = ({
	association,
	chargesCount,
	removal,
	isOpen,
	onOpenChange,
	onMarkForRemoval,
	onUndoRemoval,
	onChange,
	currentPeriodStart,
	currentPeriodEnd,
	endDateError,
	disableRemove = false,
	disabled = false,
}) => {
	const { t } = useTranslation(['billing', 'common']);
	const name = association.addon?.name || association.addon_id;
	const isRemoving = !!removal;
	// Already scheduled to end: nothing more to change here.
	const scheduledEnd = association.end_date?.trim() ? new Date(association.end_date) : undefined;

	const endTimingOptions = useMemo(
		() => [
			{
				label: t('billing:subscriptions.addAddonDialog.changeAt.immediate'),
				value: ADDON_CHANGE_TIMING.IMMEDIATE,
				description: t('billing:subscriptions.addAddonDialog.endAt.immediateDescription'),
			},
			{
				label: t('billing:subscriptions.addAddonDialog.changeAt.endOfPeriod'),
				value: ADDON_CHANGE_TIMING.END_OF_PERIOD,
				description: currentPeriodEnd
					? t('billing:subscriptions.addAddonDialog.endAt.endOfPeriodDescriptionWithDate', {
							date: formatDateInZone(currentPeriodEnd, 'utc'),
						})
					: t('billing:subscriptions.addAddonDialog.endAt.endOfPeriodDescription'),
			},
			{
				label: t('billing:subscriptions.addAddonDialog.changeAt.custom'),
				value: ADDON_CHANGE_TIMING.CUSTOM,
				description: t('billing:subscriptions.addAddonDialog.endAt.customDescription'),
			},
		],
		[currentPeriodEnd, t],
	);

	const removalSummary = useMemo(() => {
		if (!removal) return undefined;
		switch (removal.endTiming) {
			case ADDON_CHANGE_TIMING.IMMEDIATE:
				return t('billing:subscriptions.addAddonDialog.endAt.summaryNow');
			case ADDON_CHANGE_TIMING.CUSTOM:
				return removal.customEndDate
					? t('billing:subscriptions.addAddonDialog.endAt.summaryOn', { date: formatDateInZone(removal.customEndDate, 'local') })
					: undefined;
			default:
				return t('billing:subscriptions.addAddonDialog.endAt.summaryPeriodEnd');
		}
	}, [removal, t]);

	const header = (
		<>
			<ChevronDown
				className={cn(
					'h-4 w-4 shrink-0 text-content-muted transition-transform',
					isOpen ? 'rotate-0' : '-rotate-90',
					!isRemoving && 'invisible',
				)}
			/>
			<span className={cn('truncate text-sm font-medium', isRemoving ? 'line-through text-content-muted' : 'text-content-heading')}>
				{name}
			</span>
			<span className='shrink-0 text-xs text-content-muted'>
				{t('billing:subscriptions.addAddonDialog.chargesCount', { count: chargesCount })}
			</span>
			{isRemoving && (
				<span className='shrink-0 rounded-md bg-danger-muted px-1.5 py-0.5 text-xs font-medium text-danger'>
					{t('billing:subscriptions.addAddonDialog.removing')}
				</span>
			)}
			{isRemoving && !isOpen && removalSummary && <span className='truncate text-xs text-content-muted'>{removalSummary}</span>}
			{scheduledEnd && !isNaN(scheduledEnd.getTime()) && (
				<span className='shrink-0 text-xs text-content-muted'>
					{t('billing:subscriptions.addAddonDialog.endAt.summaryOn', { date: formatDateInZone(scheduledEnd, 'local') })}
				</span>
			)}
		</>
	);

	return (
		<Collapsible open={isRemoving && isOpen} onOpenChange={onOpenChange}>
			<div className={cn('rounded-xl border', isRemoving ? 'border-danger-line bg-danger-muted/30' : 'border-line bg-surface')}>
				<div className='flex items-center gap-2 pe-2'>
					{isRemoving ? (
						<CollapsibleTrigger asChild>
							<button
								type='button'
								className='flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-start hover:bg-surface-subtle rounded-xl'>
								{header}
							</button>
						</CollapsibleTrigger>
					) : (
						<div className='flex-1 min-w-0 flex items-center gap-3 px-4 py-3'>{header}</div>
					)}
					{isRemoving ? (
						<button
							type='button'
							onClick={onUndoRemoval}
							disabled={disabled}
							className='flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-content-secondary hover:bg-surface-subtle disabled:opacity-50'>
							<RotateCcw className='h-3.5 w-3.5' />
							{t('billing:subscriptions.addAddonDialog.undoRemoval')}
						</button>
					) : (
						!scheduledEnd && (
							<button
								type='button'
								onClick={onMarkForRemoval}
								disabled={disabled || disableRemove}
								aria-label={t('billing:subscriptions.addAddonDialog.removeAddon', { name })}
								className='p-2 rounded-md text-content-muted hover:text-danger hover:bg-surface-subtle disabled:opacity-50'>
								<Trash2 className='h-4 w-4' />
							</button>
						)
					)}
				</div>

				{removal && (
					<CollapsibleContent>
						<div className='space-y-3 px-4 pb-4'>
							<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
								<Select
									label={t('billing:subscriptions.addAddonDialog.endAt.label')}
									options={endTimingOptions}
									value={removal.endTiming}
									onChange={(value) => {
										const endTiming = value as ADDON_CHANGE_TIMING;
										onChange({ endTiming, ...(endTiming !== ADDON_CHANGE_TIMING.CUSTOM ? { customEndDate: undefined } : {}) });
									}}
								/>
								<Select
									label={t('common:labels.proration')}
									options={[
										{
											label: t('billing:subscriptions.addAddonDialog.proration.prorate'),
											value: ADDON_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
											description: t('billing:subscriptions.addAddonDialog.proration.prorateDescription'),
										},
										{
											label: t('billing:subscriptions.addAddonDialog.proration.none'),
											value: ADDON_PRORATION_BEHAVIOR.NONE,
											description: t('billing:subscriptions.addAddonDialog.proration.noneDescription'),
										},
									]}
									value={removal.prorationBehavior}
									onChange={(value) => onChange({ prorationBehavior: value as ADDON_PRORATION_BEHAVIOR })}
								/>
							</div>
							{removal.endTiming === ADDON_CHANGE_TIMING.CUSTOM && (
								<div className='space-y-1'>
									<DatePicker
										label={t('common:labels.effectiveEndDate')}
										placeholder={t('common:labels.endDate')}
										date={removal.customEndDate}
										setDate={(date) => onChange({ customEndDate: date })}
										minDate={currentPeriodStart}
										maxDate={currentPeriodEnd}
										className='w-full'
										popoverTriggerClassName='w-full'
									/>
									{endDateError && <p className='text-sm text-danger'>{endDateError}</p>}
								</div>
							)}
						</div>
					</CollapsibleContent>
				)}
			</div>
		</Collapsible>
	);
};

export default ExistingAddonRow;
