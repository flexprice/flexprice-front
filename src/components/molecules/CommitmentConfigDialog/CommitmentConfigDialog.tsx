import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, Button, Input, Select } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { Price } from '@/models/Price';
import { LineItemCommitmentConfig, CommitmentType } from '@/types/dto/LineItemCommitmentConfig';
import {
	bucketPriceContextFromPrice,
	classifyCommitmentValidation,
	mapCommitmentValidationError,
	resolveCommitmentTypeFromConfig,
	validateCommitment,
	supportsWindowCommitment,
	supportsCommitmentTimeBuckets,
	type CommitmentValidationTarget,
} from '@/utils/common/commitment_helpers';
import { removeFormatting } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { BILLING_PERIOD } from '@/constants/constants';
import { useTranslation } from 'react-i18next';
import CommitmentTimeBucketsEditor from '@/components/molecules/CommitmentTimeBucketsEditor';
import CommitmentTypeSelect from '@/components/molecules/CommitmentTypeSelect';
import {
	bucketDefaultsFromPrice,
	normalizeTimeBucketDraftsOrError,
	timeBucketToDraft,
	type CommitmentTimeBucketDraft,
} from '@/utils/common/commitment_time_bucket_draft';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';

interface CommitmentConfigDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	price: Price;
	onSave: (priceId: string, config: LineItemCommitmentConfig | null, timeBuckets?: CommitmentTimeBucket[]) => void | Promise<void>;
	currentConfig: LineItemCommitmentConfig | undefined;
	currentTimeBuckets?: CommitmentTimeBucket[];
	billingPeriod?: BILLING_PERIOD;
}

const CommitmentConfigDialog: FC<CommitmentConfigDialogProps> = ({
	isOpen,
	onOpenChange,
	price,
	onSave,
	currentConfig,
	currentTimeBuckets,
	billingPeriod,
}) => {
	const { t } = useTranslation('billing');
	const [commitmentType, setCommitmentType] = useState<CommitmentType>(CommitmentType.AMOUNT);
	const [commitmentAmount, setCommitmentAmount] = useState<string>('');
	const [commitmentQuantity, setCommitmentQuantity] = useState<string>('');
	const [overageFactor, setOverageFactor] = useState<string>('1.0');
	const [enableTrueUp, setEnableTrueUp] = useState<boolean>(false);
	const [isWindowCommitment, setIsWindowCommitment] = useState<boolean>(() => supportsWindowCommitment(price));
	const [commitmentDuration, setCommitmentDuration] = useState<string>(billingPeriod?.toUpperCase() || '');
	const [timeBuckets, setTimeBuckets] = useState<CommitmentTimeBucketDraft[]>([]);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [commitmentErrorTarget, setCommitmentErrorTarget] = useState<CommitmentValidationTarget | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const commitmentDurationOptions = useMemo(
		() => [
			{ label: t('commitmentConfig.billingPeriodLabels.MONTHLY'), value: BILLING_PERIOD.MONTHLY },
			{ label: t('commitmentConfig.billingPeriodLabels.QUARTERLY'), value: BILLING_PERIOD.QUARTERLY },
			{ label: t('commitmentConfig.billingPeriodLabels.HALF_YEARLY'), value: BILLING_PERIOD.HALF_YEARLY },
			{ label: t('commitmentConfig.billingPeriodLabels.ANNUAL'), value: BILLING_PERIOD.ANNUAL },
		],
		[t],
	);

	const currencySymbol = getCurrencySymbol(price.currency);
	const meterDisplayName = price.meter?.name || price.display_name || t('commitmentConfig.thisChargeFallback');
	const showWindowCommitment = supportsWindowCommitment(price);
	const showTimeBucketEditor = showWindowCommitment && supportsCommitmentTimeBuckets(price) && isWindowCommitment;
	const bucketPriceContext = useMemo(() => bucketPriceContextFromPrice(price), [price]);

	const bucketDefaults = useMemo(() => bucketDefaultsFromPrice(price), [price]);

	const clearValidation = useCallback(() => {
		setValidationError(null);
		setCommitmentErrorTarget(null);
	}, []);

	useEffect(() => {
		if (currentConfig) {
			setCommitmentType(resolveCommitmentTypeFromConfig(currentConfig));
			setCommitmentAmount(currentConfig.commitment_amount?.toString() || '');
			setCommitmentQuantity(currentConfig.commitment_quantity?.toString() || '');
			setOverageFactor(currentConfig.overage_factor?.toString() || '1.0');
			setEnableTrueUp(currentConfig.enable_true_up ?? false);
			setIsWindowCommitment(currentConfig.is_window_commitment ?? showWindowCommitment);
			setCommitmentDuration(currentConfig.commitment_duration || billingPeriod?.toUpperCase() || '');
			setTimeBuckets((currentTimeBuckets ?? []).map(timeBucketToDraft));
		} else {
			setCommitmentType(CommitmentType.AMOUNT);
			setCommitmentAmount('');
			setCommitmentQuantity('');
			setOverageFactor('1.0');
			setEnableTrueUp(false);
			setIsWindowCommitment(showWindowCommitment);
			setCommitmentDuration(billingPeriod?.toUpperCase() || '');
			setTimeBuckets([]);
		}
		clearValidation();
	}, [currentConfig, currentTimeBuckets, isOpen, showWindowCommitment, billingPeriod, clearValidation]);

	const handleDialogOpenChange = (open: boolean) => {
		if (!open && isSaving) return;
		onOpenChange(open);
	};

	const handleSave = async () => {
		if (isSaving) return;

		const config: Partial<LineItemCommitmentConfig> = {
			commitment_type: commitmentType,
			overage_factor: parseFloat(overageFactor) || 1.0,
			enable_true_up: enableTrueUp,
			is_window_commitment: isWindowCommitment,
			commitment_duration: commitmentDuration ? (commitmentDuration as BILLING_PERIOD) : undefined,
		};

		if (commitmentType === CommitmentType.AMOUNT) {
			config.commitment_amount = commitmentAmount ? parseFloat(removeFormatting(commitmentAmount)) : undefined;
		} else {
			config.commitment_quantity = commitmentQuantity ? parseInt(commitmentQuantity, 10) : undefined;
		}

		const rawError = validateCommitment(config);
		if (rawError) {
			setCommitmentErrorTarget(classifyCommitmentValidation(rawError));
			setValidationError(mapCommitmentValidationError(rawError, t));
			return;
		}

		let normalizedTimeBuckets: CommitmentTimeBucket[] | undefined;
		if (showTimeBucketEditor) {
			if (timeBuckets.length > 0) {
				const result = normalizeTimeBucketDraftsOrError(timeBuckets, commitmentType, price.bucket_size, {
					requireCommitmentFields: true,
					requireBucketPrice: !!bucketPriceContext,
					requireNonEmpty: false,
					priceContext: bucketPriceContext,
				});
				if ('error' in result) {
					setCommitmentErrorTarget('banner');
					setValidationError(mapCommitmentValidationError(result.error, t));
					return;
				}
				normalizedTimeBuckets = result.buckets;
			} else {
				normalizedTimeBuckets = [];
			}
		}

		setCommitmentErrorTarget(null);
		try {
			setIsSaving(true);
			await onSave(price.id, config as LineItemCommitmentConfig, normalizedTimeBuckets);
			onOpenChange(false);
		} catch {
			// Keep dialog open so the user can fix and retry.
		} finally {
			setIsSaving(false);
		}
	};

	const handleClear = async () => {
		if (isSaving) return;

		try {
			setIsSaving(true);
			await onSave(price.id, null);
			onOpenChange(false);
		} catch {
			// Keep dialog open so the user can fix and retry.
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		if (isSaving) return;
		clearValidation();
		onOpenChange(false);
	};

	const hasExistingConfig = currentConfig !== undefined;
	const showAmountError =
		commitmentErrorTarget === 'amountField' || commitmentErrorTarget === 'bothFields' ? (validationError ?? undefined) : undefined;
	const showQuantityError =
		commitmentErrorTarget === 'quantityField' || commitmentErrorTarget === 'bothFields' ? (validationError ?? undefined) : undefined;

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={handleDialogOpenChange}
			title={t('commitmentConfig.title')}
			description={t('commitmentConfig.description', { name: meterDisplayName })}
			className='w-full max-w-4xl'>
			<div className='space-y-6 min-w-0 overflow-x-hidden'>
				<CommitmentTypeSelect
					value={commitmentType}
					onChange={(value) => {
						setCommitmentType(value);
						clearValidation();
					}}
				/>

				<div className='grid grid-cols-2 gap-4 items-start'>
					<div className='space-y-1'>
						{commitmentType === CommitmentType.AMOUNT ? (
							<>
								<label className='text-sm font-medium text-content-secondary'>
									{t('commitmentConfig.commitmentAmount', { currency: price.currency })}
								</label>
								<Input
									type='formatted-number'
									value={commitmentAmount}
									onChange={(value) => {
										setCommitmentAmount(value);
										clearValidation();
									}}
									placeholder={t('commitmentConfig.commitmentAmountPlaceholder')}
									suffix={currencySymbol}
									className='w-full'
									error={showAmountError}
								/>
								<p className='text-xs text-content-muted'>{t('commitmentConfig.commitmentAmountHint')}</p>
							</>
						) : (
							<>
								<label className='text-sm font-medium text-content-secondary'>{t('commitmentConfig.commitmentQuantity')}</label>
								<Input
									type='number'
									value={commitmentQuantity}
									onChange={(value) => {
										setCommitmentQuantity(value);
										clearValidation();
									}}
									placeholder={t('commitmentConfig.commitmentQuantityPlaceholder')}
									className='w-full'
									error={showQuantityError}
								/>
								<p className='text-xs text-content-muted'>{t('commitmentConfig.commitmentQuantityHint')}</p>
							</>
						)}
					</div>
					<div className='space-y-1'>
						<label className='text-sm font-medium text-content-secondary'>{t('commitmentConfig.commitmentPeriod')}</label>
						<Select
							value={commitmentDuration}
							options={commitmentDurationOptions}
							onChange={(value) => {
								setCommitmentDuration(value);
								clearValidation();
							}}
							placeholder={t('commitmentConfig.sameAsBillingPlaceholder')}
						/>
						<p className='text-xs text-content-muted'>{t('commitmentConfig.commitmentPeriodHint')}</p>
					</div>
				</div>

				<div className='space-y-2'>
					<label className='text-sm font-medium text-content-secondary'>{t('commitmentConfig.overageFactor')}</label>
					<Input
						type='number'
						value={overageFactor}
						onChange={(value) => {
							setOverageFactor(value);
							clearValidation();
						}}
						placeholder={t('commitmentConfig.overageFactorPlaceholder')}
						className='w-full'
						error={commitmentErrorTarget === 'overageField' ? (validationError ?? undefined) : undefined}
					/>
					<p className='text-xs text-content-muted'>{t('commitmentConfig.overageFactorHint')}</p>
				</div>

				<div className='flex items-center justify-between p-4 bg-surface-subtle rounded-lg'>
					<div className='flex-1'>
						<label className='text-sm font-medium text-content-secondary block mb-1'>{t('commitmentConfig.enableTrueUp')}</label>
						<p className='text-xs text-content-muted'>{t('commitmentConfig.enableTrueUpHint')}</p>
					</div>
					<Switch checked={enableTrueUp} onCheckedChange={setEnableTrueUp} />
				</div>

				{showWindowCommitment && (
					<div className='flex items-center justify-between p-4 bg-surface-subtle rounded-lg'>
						<div className='flex-1'>
							<label className='text-sm font-medium text-content-secondary block mb-1'>{t('commitmentConfig.windowCommitment')}</label>
							<p className='text-xs text-content-muted'>{t('commitmentConfig.windowCommitmentHint', { bucketSize: price.bucket_size })}</p>
						</div>
						<Switch
							checked={isWindowCommitment}
							onCheckedChange={(checked) => {
								setIsWindowCommitment(checked);
								if (!checked) setTimeBuckets([]);
							}}
						/>
					</div>
				)}

				{showTimeBucketEditor && (
					<CommitmentTimeBucketsEditor
						buckets={timeBuckets}
						onChange={(nextBuckets) => {
							setTimeBuckets(nextBuckets);
							if (commitmentErrorTarget === 'banner') clearValidation();
						}}
						bucketSize={price.bucket_size}
						defaultCommitmentType={commitmentType}
						currencySymbol={currencySymbol}
						currency={price.currency}
						bucketDefaults={bucketDefaults}
						showErrors={commitmentErrorTarget === 'banner'}
					/>
				)}

				{validationError && commitmentErrorTarget === 'banner' && (
					<div className='p-3 bg-danger-muted border border-danger-line rounded-lg'>
						<p className='text-sm text-danger-strong'>{validationError}</p>
					</div>
				)}

				{hasExistingConfig && (
					<div className='p-3 bg-info-muted border border-info-line rounded-lg'>
						<p className='text-sm text-info-strong'>{t('commitmentConfig.existingNotice')}</p>
					</div>
				)}

				<div className='flex gap-3 pt-4 border-t'>
					<Button variant='outline' onClick={handleCancel} className='flex-1' disabled={isSaving}>
						{t('commitmentConfig.cancel')}
					</Button>
					{hasExistingConfig && (
						<Button variant='outline' onClick={handleClear} className='flex-1 text-danger hover:bg-danger-muted' disabled={isSaving}>
							{t('commitmentConfig.clearCommitment')}
						</Button>
					)}
					<Button onClick={handleSave} className='flex-1' isLoading={isSaving} disabled={isSaving}>
						{hasExistingConfig ? t('commitmentConfig.updateCommitment') : t('commitmentConfig.saveCommitment')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default CommitmentConfigDialog;
