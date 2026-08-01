import { FC, useMemo, useState } from 'react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Button, Input, Select as AtomSelect, type SelectOption } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import CommitmentTypeSelect from '@/components/molecules/CommitmentTypeSelect';
import type { CommitmentTimePoint } from '@/types/dto/CommitmentTimeBucket';
import { CommitmentType } from '@/types/dto/LineItemCommitmentConfig';
import { BILLING_MODEL, TIER_MODE } from '@/models/Price';
import VolumeTieredPricingForm from '@/components/organisms/PlanForm/VolumeTieredPricingForm';
import { BUCKET_SIZE } from '@/models/Meter';
import {
	buildCommitmentTimeValues,
	getCommitmentTimeBucketConstraints,
	isCommitmentTimePointAligned,
	timePointToMinutes,
} from '@/utils/common/commitment_helpers';
import {
	createDefaultSlabTiers,
	createEmptyTimeBucketDraft,
	getBucketTierFormRows,
	isTieredBillingModel,
	isSlabBillingModel,
	isTimeBucketDraftComplete,
	mapFormTiersToBucketTiers,
	resolveDraftCommitmentType,
	UNSET_TIME_VALUE,
	type BillingModelSelectValue,
	type CommitmentTimeBucketDefaults,
	type CommitmentTimeBucketDraft,
} from '@/utils/common/commitment_time_bucket_draft';
import { useTranslation } from 'react-i18next';

interface Props {
	buckets: CommitmentTimeBucketDraft[];
	onChange: (buckets: CommitmentTimeBucketDraft[]) => void;
	bucketSize?: BUCKET_SIZE | string | null;
	disabled?: boolean;
	defaultCommitmentType?: CommitmentType;
	currencySymbol?: string;
	currency?: string;
	bucketDefaults?: CommitmentTimeBucketDefaults;
	/** Highlight empty/invalid required fields — set true after a failed save attempt. */
	showErrors?: boolean;
}

function formatTwoDigits(value: number): string {
	return String(value).padStart(2, '0');
}

function hasSameStartAndEnd(row: CommitmentTimeBucketDraft, minutesEnabled: boolean): boolean {
	if (!isTimeBucketDraftComplete(row, minutesEnabled)) return false;

	const startMinutes = timePointToMinutes({
		hour: row.start.hour,
		minute: minutesEnabled ? row.start.minute : 0,
	});
	const endMinutes = timePointToMinutes({
		hour: row.end.hour,
		minute: minutesEnabled ? row.end.minute : 0,
	});

	return startMinutes === endMinutes;
}

interface TimeUnitSelectProps {
	value: number;
	allowedValues: number[];
	placeholder: string;
	onChange: (value: number) => void;
	disabled?: boolean;
	ariaLabel: string;
	hasError?: boolean;
	/** Unique id for this dropdown, used to keep only one time dropdown open at a time. */
	id: string;
	openId: string | null;
	onOpenIdChange: (id: string | null) => void;
}

const TimeUnitSelect: FC<TimeUnitSelectProps> = ({
	value,
	allowedValues,
	placeholder,
	onChange,
	disabled,
	ariaLabel,
	hasError,
	id,
	openId,
	onOpenIdChange,
}) => {
	const isUnset = value === UNSET_TIME_VALUE;

	return (
		<Select
			value={isUnset ? undefined : String(value)}
			onValueChange={(next) => onChange(parseInt(next, 10))}
			disabled={disabled}
			open={openId === id}
			onOpenChange={(open) => onOpenIdChange(open ? id : null)}>
			<SelectTrigger
				aria-label={ariaLabel}
				className={cn(
					'h-8 w-12 shrink-0 justify-center gap-0 px-1 text-center text-xs font-medium tabular-nums [&>svg]:size-3.5',
					disabled && 'cursor-not-allowed opacity-60',
					hasError && 'border-danger-bright focus:ring-danger-bright',
					isUnset && 'text-muted-foreground',
				)}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className='max-h-52'>
				{allowedValues.map((unitValue) => (
					<SelectItem key={unitValue} value={String(unitValue)} className='justify-center tabular-nums'>
						{formatTwoDigits(unitValue)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

interface TimePointInputProps {
	label: string;
	value: CommitmentTimePoint;
	onChange: (value: CommitmentTimePoint) => void;
	hourValues: number[];
	minuteValues: number[];
	minutesEnabled: boolean;
	hourPlaceholder: string;
	minutePlaceholder: string;
	disabled?: boolean;
	hasError?: boolean;
	/** Unique id prefix for this Start/End input, used to keep only one time dropdown open at a time. */
	idPrefix: string;
	openId: string | null;
	onOpenIdChange: (id: string | null) => void;
}

const TimePointInput: FC<TimePointInputProps> = ({
	label,
	value,
	onChange,
	minutesEnabled,
	hourValues,
	minuteValues,
	hourPlaceholder,
	minutePlaceholder,
	disabled,
	hasError,
	idPrefix,
	openId,
	onOpenIdChange,
}) => (
	<div className='flex w-fit shrink-0 flex-col gap-2'>
		<span className='text-xs font-medium text-content-tertiary'>{label}</span>
		<div className='flex flex-nowrap items-center gap-0'>
			<TimeUnitSelect
				id={`${idPrefix}-hour`}
				openId={openId}
				onOpenIdChange={onOpenIdChange}
				value={value.hour}
				allowedValues={hourValues}
				placeholder={hourPlaceholder}
				onChange={(hour) => onChange({ ...value, hour })}
				disabled={disabled}
				ariaLabel={`${label} hour`}
				hasError={hasError}
			/>
			<span className='shrink-0 px-0.5 text-xs font-medium text-content-disabled'>:</span>
			<TimeUnitSelect
				id={`${idPrefix}-minute`}
				openId={openId}
				onOpenIdChange={onOpenIdChange}
				value={minutesEnabled ? value.minute : value.hour === UNSET_TIME_VALUE ? UNSET_TIME_VALUE : 0}
				allowedValues={minuteValues}
				placeholder={minutePlaceholder}
				onChange={(minute) => onChange({ ...value, minute })}
				disabled={disabled || !minutesEnabled}
				ariaLabel={`${label} minute`}
				hasError={hasError}
			/>
		</div>
	</div>
);

const CommitmentTimeBucketsEditor: FC<Props> = ({
	buckets,
	onChange,
	bucketSize,
	disabled,
	defaultCommitmentType = CommitmentType.AMOUNT,
	currencySymbol,
	currency,
	bucketDefaults,
	showErrors = false,
}) => {
	const { t } = useTranslation(['billing', 'common', 'catalog']);
	// Shared across all bucket rows so opening any time dropdown closes any other that's open.
	const [openTimeDropdownId, setOpenTimeDropdownId] = useState<string | null>(null);
	const constraints = useMemo(() => getCommitmentTimeBucketConstraints(bucketSize), [bucketSize]);
	const { minutesEnabled } = constraints;
	const hourValues = useMemo(() => buildCommitmentTimeValues(23, constraints.hourStep), [constraints.hourStep]);
	const minuteValues = useMemo(
		() => (constraints.minutesEnabled ? buildCommitmentTimeValues(59, constraints.minuteStep) : []),
		[constraints.minuteStep, constraints.minutesEnabled],
	);

	const billingModelOptions: SelectOption[] = useMemo(
		() => [
			{
				value: BILLING_MODEL.FLAT_FEE,
				label: t('catalog:priceDialogs.billingModels.flatFee'),
			},
			{
				value: BILLING_MODEL.PACKAGE,
				label: t('catalog:priceDialogs.billingModels.package'),
			},
			{
				value: BILLING_MODEL.TIERED,
				label: t('catalog:priceDialogs.billingModels.volumeTiered'),
			},
			{
				value: 'SLAB_TIERED',
				label: t('catalog:priceDialogs.billingModels.slabTiered'),
			},
		],
		[t],
	);

	const displayCurrency = (currency ?? 'usd').toUpperCase();
	const hourPlaceholder = t('billing:commitmentConfig.timeBuckets.hourPlaceholder');
	const minutePlaceholder = t('billing:commitmentConfig.timeBuckets.minutePlaceholder');
	const overagePlaceholder = t('billing:commitmentConfig.overageFactorPlaceholder');

	const updateRow = (index: number, patch: Partial<CommitmentTimeBucketDraft>) => {
		onChange(buckets.map((row, i) => (i === index ? { ...row, ...patch } : row)));
	};

	const handleAddBucket = () => {
		onChange([...buckets, createEmptyTimeBucketDraft(bucketDefaults)]);
	};

	const handleBillingModelChange = (index: number, value: BillingModelSelectValue) => {
		const row = buckets[index];
		const patch: Partial<CommitmentTimeBucketDraft> = { billing_model: value };

		if (isTieredBillingModel(value)) {
			patch.bucket_tiers = row.bucket_tiers?.length ? row.bucket_tiers : createDefaultSlabTiers();
			patch.bucket_amount = undefined;
			patch.transform_quantity_divide_by = undefined;
		} else if (value === BILLING_MODEL.PACKAGE) {
			patch.transform_quantity_divide_by = row.transform_quantity_divide_by ?? '1';
			patch.bucket_tiers = undefined;
		} else {
			patch.bucket_tiers = undefined;
			patch.transform_quantity_divide_by = undefined;
		}

		updateRow(index, patch);
	};

	return (
		<div className='rounded-lg border border-line bg-surface p-4 min-w-0 overflow-x-hidden'>
			<div className='flex items-center justify-between gap-4'>
				<div className='min-w-0'>
					<h4 className='text-sm font-semibold text-content'>{t('billing:commitmentConfig.timeBuckets.title')}</h4>
					<p className='mt-0.5 text-xs text-content-muted'>{t('billing:commitmentConfig.timeBuckets.descriptionShort')}</p>
				</div>
				<Button type='button' variant='outline' size='sm' onClick={handleAddBucket} disabled={disabled} className='shrink-0 gap-1.5'>
					{t('billing:commitmentConfig.timeBuckets.addBucket')}
				</Button>
			</div>

			{buckets.length === 0 ? (
				<div className='mt-5 rounded-md border border-dashed border-line bg-surface-subtle/60 px-4 py-10 text-center'>
					<p className='text-sm text-content-muted'>{t('billing:commitmentConfig.timeBuckets.emptyShort')}</p>
				</div>
			) : (
				<div className='mt-5 space-y-3'>
					{buckets.map((row, index) => {
						const sameTime = hasSameStartAndEnd(row, minutesEnabled);
						const billingModel = row.billing_model ?? bucketDefaults?.billing_model ?? BILLING_MODEL.FLAT_FEE;
						const isTiered = isTieredBillingModel(billingModel);
						const isSlab = isSlabBillingModel(billingModel);
						const tieredSectionLabel = isSlab
							? t('billing:commitmentConfig.timeBuckets.slabTiers')
							: t('billing:commitmentConfig.timeBuckets.volumeTiers');
						const tieredPriceHint = isSlab
							? t('billing:commitmentConfig.timeBuckets.bucketAmountSlabTieredHint')
							: t('billing:commitmentConfig.timeBuckets.bucketAmountVolumeTieredHint');
						const isPackage = billingModel === BILLING_MODEL.PACKAGE;
						const rowCommitmentType = resolveDraftCommitmentType(row, defaultCommitmentType);
						const commitmentValueLabel =
							rowCommitmentType === CommitmentType.QUANTITY
								? t('billing:commitmentConfig.timeBuckets.commitmentQuantity')
								: t('billing:commitmentConfig.timeBuckets.commitmentValue');
						const tierFormRows = getBucketTierFormRows(row.bucket_tiers);
						const startTimeError = sameTime || !isCommitmentTimePointAligned(row.start, constraints);
						const endTimeError = sameTime || !isCommitmentTimePointAligned(row.end, constraints);
						const stepErrorMessage =
							constraints.minuteStep > 1
								? t('billing:commitmentConfig.errors.minuteStep', { step: constraints.minuteStep })
								: constraints.hourStep > 1
									? t('billing:commitmentConfig.errors.hourStep', { step: constraints.hourStep })
									: null;

						const overageNum = parseFloat(row.overage_factor ?? '');
						const hasTier = row.bucket_tiers?.some((tier) => tier.unit_amount.trim());
						const commitmentValueError =
							showErrors && !row.commitment_value?.trim() ? t('billing:commitmentConfig.timeBuckets.errors.fieldRequired') : undefined;
						const overageFactorError =
							showErrors && (!Number.isFinite(overageNum) || overageNum < 1)
								? t('billing:commitmentConfig.timeBuckets.errors.overageRequired')
								: undefined;
						const bucketAmountError =
							showErrors && !isTiered && !row.bucket_amount?.trim()
								? t('billing:commitmentConfig.timeBuckets.errors.priceRequired')
								: undefined;
						const tiersError =
							showErrors && isTiered && !hasTier ? t('billing:commitmentConfig.timeBuckets.errors.tiersRequired') : undefined;

						return (
							<div key={index} className='rounded-lg border border-line bg-surface-subtle/40 p-4'>
								<div className='mb-4 flex items-center justify-between gap-3'>
									<span className='text-xs font-semibold uppercase tracking-wide text-content-muted'>
										{t('billing:commitmentConfig.timeBuckets.bucketLabel', { index: index + 1 })}
									</span>
									<button
										type='button'
										onClick={() => {
											// openTimeDropdownId is keyed by array index, not a stable row id — removing a
											// row shifts every later index down, so a stale id would otherwise keep (or
											// wrongly reopen) a dropdown on whichever row ends up at that index next.
											setOpenTimeDropdownId(null);
											onChange(buckets.filter((_, i) => i !== index));
										}}
										disabled={disabled}
										className='rounded-md p-1.5 text-content-subtle transition-colors hover:bg-danger-muted hover:text-danger disabled:opacity-50'
										aria-label={t('billing:commitmentConfig.timeBuckets.removeBucket')}>
										<RiDeleteBin6Line className='size-4' />
									</button>
								</div>

								<div className='flex flex-nowrap items-end gap-3'>
									<TimePointInput
										idPrefix={`${index}-start`}
										openId={openTimeDropdownId}
										onOpenIdChange={setOpenTimeDropdownId}
										label={t('billing:commitmentConfig.timeBuckets.startLabel')}
										value={row.start}
										onChange={(start) => updateRow(index, { start })}
										hourValues={hourValues}
										minuteValues={minuteValues}
										minutesEnabled={minutesEnabled}
										hourPlaceholder={hourPlaceholder}
										minutePlaceholder={minutePlaceholder}
										disabled={disabled}
										hasError={startTimeError}
									/>
									<TimePointInput
										idPrefix={`${index}-end`}
										openId={openTimeDropdownId}
										onOpenIdChange={setOpenTimeDropdownId}
										label={t('billing:commitmentConfig.timeBuckets.endLabel')}
										value={row.end}
										onChange={(end) => updateRow(index, { end })}
										hourValues={hourValues}
										minuteValues={minuteValues}
										minutesEnabled={minutesEnabled}
										hourPlaceholder={hourPlaceholder}
										minutePlaceholder={minutePlaceholder}
										disabled={disabled}
										hasError={endTimeError}
									/>
									<span className='shrink-0 pb-2 text-xs font-medium text-content-subtle'>
										{t('billing:commitmentConfig.timeBuckets.utc')}
									</span>
								</div>

								<div className='mt-2 min-h-5'>
									{sameTime && <p className='text-xs text-danger'>{t('billing:commitmentConfig.timeBuckets.errors.sameTime')}</p>}
									{!sameTime && stepErrorMessage && (startTimeError || endTimeError) && (
										<p className='text-xs text-danger'>{stepErrorMessage}</p>
									)}
								</div>

								<div className='mt-4 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-start'>
									<CommitmentTypeSelect
										size='compact'
										value={rowCommitmentType}
										onChange={(commitment_type) => updateRow(index, { commitment_type })}
										disabled={disabled}
									/>
								</div>

								<div className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2'>
									<div className='space-y-1'>
										<label className='text-xs font-medium text-content-tertiary'>{commitmentValueLabel}</label>
										<Input
											type={rowCommitmentType === CommitmentType.QUANTITY ? 'number' : 'formatted-number'}
											value={row.commitment_value ?? ''}
											onChange={(value) => updateRow(index, { commitment_value: value })}
											placeholder={t('billing:commitmentConfig.timeBuckets.commitmentValuePlaceholder')}
											suffix={rowCommitmentType === CommitmentType.AMOUNT ? currencySymbol : undefined}
											disabled={disabled}
											className='w-full'
											error={commitmentValueError}
										/>
										<p className='text-xs text-content-muted'>
											{rowCommitmentType === CommitmentType.QUANTITY
												? t('billing:commitmentConfig.commitmentQuantityHint')
												: t('billing:commitmentConfig.commitmentAmountHint')}
										</p>
									</div>
									<div className='space-y-1'>
										<label className='text-xs font-medium text-content-tertiary'>
											{t('billing:commitmentConfig.timeBuckets.trueUpEnabled')}
										</label>
										<div className='flex h-10 w-full items-center justify-between rounded-[6px] border border-input bg-background px-3'>
											<span className={cn('text-sm', row.true_up_enabled ? 'font-medium text-content' : 'text-muted-foreground')}>
												{row.true_up_enabled ? t('common:labels.enabled') : t('common:labels.disabled')}
											</span>
											<Switch
												checked={row.true_up_enabled ?? false}
												onCheckedChange={(checked) => updateRow(index, { true_up_enabled: checked })}
												disabled={disabled}
											/>
										</div>
										<p className='text-xs text-content-muted'>{t('billing:commitmentConfig.enableTrueUpHint')}</p>
									</div>
								</div>
								<div className='w-full'>
									<label className='text-xs font-medium text-content-tertiary'>
										{t('billing:commitmentConfig.timeBuckets.overageFactor')}
									</label>
									<Input
										type='number'
										value={row.overage_factor ?? ''}
										onChange={(value) => updateRow(index, { overage_factor: value })}
										placeholder={overagePlaceholder}
										disabled={disabled}
										className='w-full'
										error={overageFactorError}
									/>
									<p className='text-xs text-content-muted'>{t('billing:commitmentConfig.overageFactorHint')}</p>
								</div>

								<div className='mt-4 space-y-1'>
									<label className='text-xs font-medium text-content-tertiary'>
										{t('billing:commitmentConfig.timeBuckets.billingModel')}
									</label>
									<AtomSelect
										value={billingModel}
										options={billingModelOptions}
										onChange={(value) => handleBillingModelChange(index, value as BillingModelSelectValue)}
										disabled={disabled}
										placeholder={t('billing:commitmentConfig.timeBuckets.billingModelPlaceholder')}
									/>
									<p className='text-xs text-content-muted'>{t('billing:commitmentConfig.timeBuckets.billingModelHint')}</p>
								</div>

								<div className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2'>
									<div className='space-y-1'>
										<label className='text-xs font-medium text-content-tertiary'>
											{t('billing:commitmentConfig.timeBuckets.bucketAmount')}
										</label>
										{isTiered ? (
											<div
												className={cn(
													'flex h-10 w-full items-center rounded-[6px] border bg-muted/30 px-3 text-sm text-muted-foreground',
													tiersError ? 'border-danger-bright' : 'border-input',
												)}>
												{tieredSectionLabel}
											</div>
										) : (
											<Input
												type='formatted-number'
												value={row.bucket_amount ?? ''}
												onChange={(value) =>
													updateRow(index, {
														bucket_amount: value,
														// Default overage to 1 the first time a price override is entered, so
														// users aren't blocked by "incomplete" validation on a field that
														// would otherwise silently default to 1 at save time anyway.
														...(value.trim() && !row.overage_factor?.trim() ? { overage_factor: '1' } : {}),
													})
												}
												placeholder={t('billing:commitmentConfig.timeBuckets.bucketAmountPlaceholder')}
												suffix={currencySymbol}
												disabled={disabled}
												className='w-full'
												error={bucketAmountError}
											/>
										)}
										{isTiered && tiersError ? (
											<p className='text-xs text-danger-bright'>{tiersError}</p>
										) : (
											<p className='text-xs text-content-muted'>
												{isTiered ? tieredPriceHint : t('billing:commitmentConfig.timeBuckets.bucketAmountHint')}
											</p>
										)}
									</div>
									{isPackage && (
										<div className='space-y-1'>
											<label className='text-xs font-medium text-content-tertiary'>
												{t('billing:commitmentConfig.timeBuckets.unitsPerPackage')}
											</label>
											<Input
												type='integer'
												value={row.transform_quantity_divide_by ?? ''}
												onChange={(value) => updateRow(index, { transform_quantity_divide_by: value })}
												placeholder='1'
												disabled={disabled}
												className='w-full'
											/>
											<p className='text-xs text-content-muted'>{t('billing:commitmentConfig.timeBuckets.unitsPerPackageHint')}</p>
										</div>
									)}
								</div>

								<div className={cn('mt-4 space-y-2', !isTiered && 'hidden')}>
									<label className='text-xs font-medium text-content-tertiary'>{tieredSectionLabel}</label>
									<VolumeTieredPricingForm
										tieredPrices={tierFormRows}
										setTieredPrices={(setter) => {
											const newTiers = typeof setter === 'function' ? setter(tierFormRows) : setter;
											updateRow(index, {
												bucket_tiers: mapFormTiersToBucketTiers(newTiers),
												...(row.billing_model ? {} : { billing_model: billingModel }),
											});
										}}
										currency={displayCurrency}
										tierMode={isSlabBillingModel(billingModel) ? TIER_MODE.SLAB : TIER_MODE.VOLUME}
									/>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default CommitmentTimeBucketsEditor;
