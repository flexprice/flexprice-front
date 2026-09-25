import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Pencil, RotateCcw, Target, Trash2 } from 'lucide-react';
import { BsThreeDots } from 'react-icons/bs';
import { DatePicker, Select } from '@/components/atoms';
import { ColumnData, FlexpriceTable } from '@/components/molecules';
import CommitmentConfigDialog from '@/components/molecules/CommitmentConfigDialog';
import PriceOverrideDialog from '@/components/molecules/PriceOverrideDialog/PriceOverrideDialog';
import { PriceQuantityCell } from '@/components/molecules/PriceQuantityCell';
import ChargeValueCell from '@/components/molecules/ChargeValueCell/ChargeValueCell';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BILLING_PERIOD } from '@/constants/constants';
import { cn } from '@/lib/utils';
import { Price, PRICE_TYPE } from '@/models/Price';
import { AddonResponse, ADDON_CADENCE, ADDON_PRORATION_BEHAVIOR, ADDON_CHANGE_TIMING } from '@/types/dto/Addon';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import { LineItemCommitmentConfig } from '@/types/dto/LineItemCommitmentConfig';
import { formatCommitmentSummary } from '@/utils/common/commitment_helpers';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { formatDateInZone } from '@/utils/common/format_date';
import { ExtendedPriceOverride, removePriceOverride, updatePriceOverride } from '@/utils/common/price_override_helpers';
import { buildCommitmentConfigOnSave } from '@/utils/subscription/addon_commitment_helpers';
import type { AddonDraft } from '@/utils/subscription/buildAddonBulkModifyRequest';

interface Props {
	draft: AddonDraft;
	addon?: AddonResponse;
	/** The addon's prices already filtered to the subscription's currency and cadence. */
	prices: Price[];
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onChange: (patch: Partial<AddonDraft>) => void;
	onRemove: () => void;
	billingPeriod?: BILLING_PERIOD;
	currentPeriodEnd?: Date;
	/** Shown under the custom start date picker. */
	startDateError?: string;
	disabled?: boolean;
	/**
	 * `modify` (default) attaches to a live subscription: a Now / period end / custom start and
	 * cadence + proration options. `create` stages an addon on a subscription that doesn't exist
	 * yet: just an optional start date, as the create request has always taken.
	 */
	variant?: 'modify' | 'create';
	/** Hide the remove button, e.g. when editing a single addon that was already staged. */
	removable?: boolean;
}

type AddonChargeRow = { price: Price };

/**
 * One addon staged in the add/modify addons dialog. Collapsed, it shows the addon name and how
 * many charges it attaches; expanded, it holds that addon's charges, overrides, commitments and
 * timing. All values live on the draft owned by the dialog — this card only edits them.
 */
const AddonDraftCard: React.FC<Props> = ({
	draft,
	addon,
	prices,
	isOpen,
	onOpenChange,
	onChange,
	onRemove,
	billingPeriod,
	currentPeriodEnd,
	startDateError,
	disabled = false,
	variant = 'modify',
	removable = true,
}) => {
	const { t } = useTranslation(['billing', 'common', 'customers']);
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [overridePrice, setOverridePrice] = useState<Price | null>(null);
	const [commitmentPrice, setCommitmentPrice] = useState<Price | null>(null);

	const { overriddenPrices, lineItemCommitments } = draft;

	const handlePriceOverride = useCallback(
		(priceId: string, override: Partial<ExtendedPriceOverride>) =>
			onChange({ overriddenPrices: updatePriceOverride(priceId, overriddenPrices, override) }),
		[onChange, overriddenPrices],
	);

	const handleResetOverride = useCallback(
		(priceId: string) => onChange({ overriddenPrices: removePriceOverride(priceId, overriddenPrices) }),
		[onChange, overriddenPrices],
	);

	const handleCommitmentSave = useCallback(
		(priceId: string, config: LineItemCommitmentConfig | null, timeBuckets?: CommitmentTimeBucket[]) => {
			const next = { ...lineItemCommitments };
			if (config) {
				next[priceId] = buildCommitmentConfigOnSave(config, timeBuckets);
			} else {
				delete next[priceId];
			}
			onChange({ lineItemCommitments: next });
		},
		[onChange, lineItemCommitments],
	);

	const columns: ColumnData<AddonChargeRow>[] = useMemo(
		() => [
			{
				title: t('billing:subscriptions.addAddonDialog.columns.charge'),
				render: (row) => (
					<span>{row.price.display_name || row.price.meter?.name || t('billing:subscriptions.addAddonDialog.chargeFallback')}</span>
				),
			},
			{
				title: t('billing:subscriptions.addAddonDialog.columns.type'),
				render: (row) => <span>{toSentenceCase(row.price.type || t('common:labels.na'))}</span>,
			},
			{
				title: t('billing:subscriptions.addAddonDialog.columns.quantity'),
				render: (row) => (
					<PriceQuantityCell
						price={row.price}
						override={overriddenPrices[row.price.id]}
						usageLabel={t('billing:subscriptions.addAddonDialog.quantityUsage')}
						ariaLabel={t('billing:subscriptions.addAddonDialog.columns.quantity')}
						onPriceOverride={handlePriceOverride}
						onResetOverride={handleResetOverride}
					/>
				),
			},
			{
				title: t('billing:subscriptions.addAddonDialog.columns.price'),
				render: (row) => <ChargeValueCell data={row.price} priceOverride={overriddenPrices[row.price.id]} />,
			},
			{
				title: t('billing:subscriptions.addAddonDialog.columns.commitment'),
				render: (row) => {
					if (row.price.type !== PRICE_TYPE.USAGE) {
						return <span className='text-sm text-content-subtle'>{t('billing:subscriptions.addAddonDialog.commitmentNotAvailable')}</span>;
					}
					const config = lineItemCommitments[row.price.id];
					return config ? <span className='text-sm text-content-tertiary'>{formatCommitmentSummary(config)}</span> : <span>—</span>;
				},
			},
			{
				fieldVariant: 'interactive',
				hideOnEmpty: true,
				title: '',
				width: 60,
				align: 'right',
				render: (row) => {
					const isOverridden = overriddenPrices[row.price.id] !== undefined;
					const hasCommitment = lineItemCommitments[row.price.id] !== undefined;
					const canConfigureCommitment = row.price.type === PRICE_TYPE.USAGE;
					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button type='button' aria-label={t('billing:subscriptions.configure')}>
									<BsThreeDots className='text-base size-4' />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-48'>
								<DropdownMenuItem onClick={() => setOverridePrice(row.price)}>
									<Pencil className='me-2 h-4 w-4' />
									{isOverridden
										? t('customers:organisms.subscriptionPriceTable.editOverride')
										: t('customers:organisms.subscriptionPriceTable.overridePrice')}
								</DropdownMenuItem>
								{isOverridden && (
									<DropdownMenuItem onClick={() => handleResetOverride(row.price.id)}>
										<RotateCcw className='me-2 h-4 w-4' />
										{t('customers:organisms.subscriptionPriceTable.resetOverride')}
									</DropdownMenuItem>
								)}
								{canConfigureCommitment && (
									<DropdownMenuItem onClick={() => setCommitmentPrice(row.price)}>
										<Target className='me-2 h-4 w-4' />
										{hasCommitment
											? t('customers:organisms.subscriptionPriceTable.editCommitment')
											: t('customers:organisms.subscriptionPriceTable.configureCommitment')}
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
			},
		],
		[lineItemCommitments, overriddenPrices, handlePriceOverride, handleResetOverride, t],
	);

	const changeAtOptions = useMemo(
		() => [
			{
				label: t('billing:subscriptions.addAddonDialog.changeAt.immediate'),
				value: ADDON_CHANGE_TIMING.IMMEDIATE,
				description: t('billing:subscriptions.addAddonDialog.changeAt.immediateDescription'),
			},
			{
				label: t('billing:subscriptions.addAddonDialog.changeAt.endOfPeriod'),
				value: ADDON_CHANGE_TIMING.END_OF_PERIOD,
				description: currentPeriodEnd
					? t('billing:subscriptions.addAddonDialog.changeAt.endOfPeriodDescriptionWithDate', {
							date: formatDateInZone(currentPeriodEnd, 'utc'),
						})
					: t('billing:subscriptions.addAddonDialog.changeAt.endOfPeriodDescription'),
			},
			{
				label: t('billing:subscriptions.addAddonDialog.changeAt.custom'),
				value: ADDON_CHANGE_TIMING.CUSTOM,
				description: t('billing:subscriptions.addAddonDialog.changeAt.customDescription'),
			},
		],
		[currentPeriodEnd, t],
	);

	const addonName = addon?.name ?? draft.addonId;

	return (
		<Collapsible open={isOpen} onOpenChange={onOpenChange}>
			<div className={cn('rounded-xl border border-line bg-surface', startDateError && 'border-danger')}>
				<div className='flex items-center gap-2 pe-2'>
					<CollapsibleTrigger asChild>
						<button
							type='button'
							className='flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-start hover:bg-surface-subtle rounded-xl'>
							<ChevronDown className={cn('h-4 w-4 shrink-0 text-content-muted transition-transform', isOpen ? 'rotate-0' : '-rotate-90')} />
							<span className='truncate text-sm font-medium text-content-heading'>{addonName}</span>
							<span className='shrink-0 text-xs text-content-muted'>
								{t('billing:subscriptions.addAddonDialog.chargesCount', { count: prices.length })}
							</span>
						</button>
					</CollapsibleTrigger>
					{removable && (
						<button
							type='button'
							onClick={onRemove}
							disabled={disabled}
							aria-label={t('billing:subscriptions.addAddonDialog.removeAddon', { name: addonName })}
							className='p-2 rounded-md text-content-muted hover:text-danger hover:bg-surface-subtle disabled:opacity-50'>
							<Trash2 className='h-4 w-4' />
						</button>
					)}
				</div>

				<CollapsibleContent>
					<div className='space-y-3 px-4 pb-4'>
						{prices.length > 0 ? (
							<div className='rounded-xl border border-line'>
								<FlexpriceTable columns={columns} data={prices.map((price) => ({ price }))} />
							</div>
						) : (
							<div className='rounded-xl border border-line p-4'>
								<p className='text-sm text-content-tertiary'>{t('billing:subscriptions.addAddonDialog.emptyNoChargesForPeriodCurrency')}</p>
							</div>
						)}

						{variant === 'create' ? (
							<DatePicker
								label={t('billing:subscriptions.startDateOptional')}
								placeholder={t('billing:subscriptions.startDate')}
								date={draft.customStartDate}
								setDate={(date) =>
									onChange({
										customStartDate: date,
										startTiming: date ? ADDON_CHANGE_TIMING.CUSTOM : ADDON_CHANGE_TIMING.IMMEDIATE,
									})
								}
								clearable
								className='w-full'
								popoverTriggerClassName='w-full'
							/>
						) : (
							<div className='space-y-2'>
								<Select
									label={t('billing:subscriptions.addAddonDialog.changeAt.label')}
									options={changeAtOptions}
									value={draft.startTiming}
									onChange={(value) => {
										const startTiming = value as ADDON_CHANGE_TIMING;
										onChange({ startTiming, ...(startTiming !== ADDON_CHANGE_TIMING.CUSTOM ? { customStartDate: undefined } : {}) });
									}}
								/>
								{draft.startTiming === ADDON_CHANGE_TIMING.CUSTOM && (
									<div className='space-y-1'>
										<DatePicker
											label={t('billing:subscriptions.startDate')}
											placeholder={t('billing:subscriptions.addAddonDialog.changeAt.datePlaceholder')}
											date={draft.customStartDate}
											setDate={(date) => onChange({ customStartDate: date })}
											className='w-full'
											popoverTriggerClassName='w-full'
										/>
										{startDateError && <p className='text-sm text-danger'>{startDateError}</p>}
									</div>
								)}
							</div>
						)}

						{/* Advanced options (optional) */}
						{variant === 'modify' && (
							<Collapsible
								open={advancedOpen}
								onOpenChange={(open) => {
									setAdvancedOpen(open);
									if (open) {
										onChange({
											cadence: draft.cadence || ADDON_CADENCE.RECURRING,
											prorationBehavior: draft.prorationBehavior || ADDON_PRORATION_BEHAVIOR.NONE,
										});
									}
								}}>
								<div className='rounded-xl border border-line bg-surface'>
									<CollapsibleTrigger asChild>
										<button
											type='button'
											className='w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-content-heading hover:bg-surface-subtle rounded-xl'>
											<span>{t('billing:subscriptions.addAddonDialog.advancedOptions')}</span>
											<ChevronDown
												className={cn('h-4 w-4 text-content-muted transition-transform', advancedOpen ? 'rotate-180' : 'rotate-0')}
											/>
										</button>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className='px-4 pb-4 pt-1'>
											<div className='flex flex-col gap-3'>
												<Select
													label={t('billing:subscriptions.cadenceOptional')}
													placeholder={t('common:labels.default')}
													options={[
														{
															label: t('billing:subscriptions.addAddonDialog.cadence.recurring'),
															value: ADDON_CADENCE.RECURRING,
															description: t('billing:subscriptions.addAddonDialog.cadence.recurringDescription'),
														},
														{
															label: t('billing:subscriptions.addAddonDialog.cadence.onetime'),
															value: ADDON_CADENCE.ONETIME,
															description: t('billing:subscriptions.addAddonDialog.cadence.onetimeDescription'),
														},
													]}
													value={draft.cadence}
													onChange={(v) => onChange({ cadence: v as ADDON_CADENCE })}
												/>
												<Select
													label={t('billing:subscriptions.prorationOptional')}
													placeholder={t('common:labels.default')}
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
													value={draft.prorationBehavior}
													onChange={(v) => onChange({ prorationBehavior: v as ADDON_PRORATION_BEHAVIOR })}
												/>
											</div>
											<div className='pt-3'>
												<button
													type='button'
													className='text-xs text-content-muted hover:text-content-secondary'
													onClick={() => onChange({ cadence: ADDON_CADENCE.RECURRING, prorationBehavior: ADDON_PRORATION_BEHAVIOR.NONE })}>
													{t('billing:subscriptions.addAddonDialog.resetAdvancedOptions')}
												</button>
											</div>
										</div>
									</CollapsibleContent>
								</div>
							</Collapsible>
						)}
					</div>
				</CollapsibleContent>
			</div>

			{overridePrice && (
				<PriceOverrideDialog
					isOpen={!!overridePrice}
					onOpenChange={(open) => !open && setOverridePrice(null)}
					price={overridePrice}
					onPriceOverride={handlePriceOverride}
					onResetOverride={handleResetOverride}
					overriddenPrices={overriddenPrices}
				/>
			)}

			{commitmentPrice && (
				<CommitmentConfigDialog
					isOpen={!!commitmentPrice}
					onOpenChange={(open) => !open && setCommitmentPrice(null)}
					price={commitmentPrice}
					onSave={handleCommitmentSave}
					currentConfig={lineItemCommitments[commitmentPrice.id]}
					currentTimeBuckets={lineItemCommitments[commitmentPrice.id]?.commitment_time_buckets}
					billingPeriod={billingPeriod}
				/>
			)}
		</Collapsible>
	);
};

export default AddonDraftCard;
