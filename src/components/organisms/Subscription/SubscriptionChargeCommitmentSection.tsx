import { FC, useMemo, type ReactNode } from 'react';
import { Input, Select } from '@/components/atoms';
import { Switch } from '@/components/ui';
import CommitmentTimeBucketsEditor from '@/components/molecules/CommitmentTimeBucketsEditor';
import CommitmentTypeSelect from '@/components/molecules/CommitmentTypeSelect';
import { useMeterForCommitment } from '@/hooks/useMeterForCommitment';
import { Price } from '@/models/Price';
import { BILLING_PERIOD } from '@/constants/constants';
import { CommitmentType } from '@/types/dto/LineItemCommitmentConfig';
import { supportsCommitmentTimeBuckets, supportsWindowCommitment } from '@/utils/common/commitment_helpers';
import {
	DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
	type SubscriptionChargeCommitmentState,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import type { CommitmentTimeBucketDefaults } from '@/utils/common/commitment_time_bucket_draft';
import { bucketDefaultsFromPrice, type BucketPriceSource } from '@/utils/common/commitment_time_bucket_draft';
import { useTranslation } from 'react-i18next';

export type { SubscriptionChargeCommitmentState };
export { DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE };

interface Props {
	meterId?: string;
	currency?: string;
	billingPeriod?: BILLING_PERIOD;
	value: SubscriptionChargeCommitmentState;
	onChange: (value: SubscriptionChargeCommitmentState) => void;
	disabled?: boolean;
	/** Defaults for new bucket rows (billing model, amount, tiers, etc.). */
	bucketDefaults?: CommitmentTimeBucketDefaults;
	/** Source price for bucket defaults when `bucketDefaults` is omitted. */
	sourcePrice?: BucketPriceSource;
}

const Notice: FC<{ children: ReactNode }> = ({ children }) => (
	<div className='rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-500'>{children}</div>
);

const SubscriptionChargeCommitmentSection: FC<Props> = ({
	meterId,
	currency,
	billingPeriod,
	value,
	onChange,
	disabled,
	bucketDefaults,
	sourcePrice,
}) => {
	const { t } = useTranslation('billing');
	const { meter, isLoading } = useMeterForCommitment(meterId);
	const priceLike = { meter_id: meterId ?? '', meter: meter ?? undefined } as Price;
	const showWindow = !!meterId && supportsWindowCommitment(priceLike);
	const showBuckets = showWindow && value.windowCommitment && supportsCommitmentTimeBuckets(priceLike);
	const hasWindowCommitmentData = value.windowCommitment || value.timeBuckets.length > 0;
	const showMeterNotSupported = !showWindow && hasWindowCommitmentData;
	const currencySymbol = getCurrencySymbol(currency ?? 'usd');
	const resolvedBucketDefaults = bucketDefaults ?? (sourcePrice ? bucketDefaultsFromPrice(sourcePrice) : undefined);

	const commitmentDurationOptions = useMemo(
		() => [
			{ label: t('commitmentConfig.billingPeriodLabels.MONTHLY'), value: BILLING_PERIOD.MONTHLY },
			{ label: t('commitmentConfig.billingPeriodLabels.QUARTERLY'), value: BILLING_PERIOD.QUARTERLY },
			{ label: t('commitmentConfig.billingPeriodLabels.HALF_YEARLY'), value: BILLING_PERIOD.HALF_YEARLY },
			{ label: t('commitmentConfig.billingPeriodLabels.ANNUAL'), value: BILLING_PERIOD.ANNUAL },
		],
		[t],
	);

	const updateValue = (patch: Partial<SubscriptionChargeCommitmentState>) => onChange({ ...value, ...patch });

	return (
		<div className='space-y-6 border-t border-gray-200 pt-6 min-w-0 overflow-x-hidden'>
			<CommitmentTypeSelect
				value={value.commitmentType}
				onChange={(commitmentType) => updateValue({ commitmentType })}
				disabled={disabled}
			/>

			<div className='grid grid-cols-2 gap-4 items-start'>
				<div className='space-y-1'>
					{value.commitmentType === CommitmentType.AMOUNT ? (
						<>
							<label className='text-sm font-medium text-gray-700'>
								{t('commitmentConfig.commitmentAmount', { currency: (currency ?? 'usd').toUpperCase() })}
							</label>
							<Input
								type='formatted-number'
								value={value.commitmentAmount}
								onChange={(commitmentAmount) => updateValue({ commitmentAmount })}
								placeholder={t('commitmentConfig.commitmentAmountPlaceholder')}
								suffix={currencySymbol}
								className='w-full'
								disabled={disabled}
							/>
							<p className='text-xs text-gray-500'>{t('commitmentConfig.commitmentAmountHint')}</p>
						</>
					) : (
						<>
							<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.commitmentQuantity')}</label>
							<Input
								type='number'
								value={value.commitmentQuantity}
								onChange={(commitmentQuantity) => updateValue({ commitmentQuantity })}
								placeholder={t('commitmentConfig.commitmentQuantityPlaceholder')}
								className='w-full'
								disabled={disabled}
							/>
							<p className='text-xs text-gray-500'>{t('commitmentConfig.commitmentQuantityHint')}</p>
						</>
					)}
				</div>
				<div className='space-y-1'>
					<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.commitmentPeriod')}</label>
					<Select
						value={value.commitmentDuration || billingPeriod?.toUpperCase() || ''}
						options={commitmentDurationOptions}
						onChange={(commitmentDuration) => updateValue({ commitmentDuration })}
						placeholder={t('commitmentConfig.sameAsBillingPlaceholder')}
						disabled={disabled}
					/>
					<p className='text-xs text-gray-500'>{t('commitmentConfig.commitmentPeriodHint')}</p>
				</div>
			</div>

			<div className='space-y-2'>
				<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.overageFactor')}</label>
				<Input
					type='number'
					value={value.overageFactor}
					onChange={(overageFactor) => updateValue({ overageFactor })}
					placeholder={t('commitmentConfig.overageFactorPlaceholder')}
					className='w-full'
					disabled={disabled}
				/>
				<p className='text-xs text-gray-500'>{t('commitmentConfig.overageFactorHint')}</p>
			</div>

			<div className='flex items-center justify-between rounded-lg bg-gray-50 p-4'>
				<div className='flex-1 pr-4'>
					<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.enableTrueUp')}</label>
					<p className='mt-0.5 text-xs text-gray-500'>{t('commitmentConfig.enableTrueUpHint')}</p>
				</div>
				<Switch checked={value.enableTrueUp} onCheckedChange={(enableTrueUp) => updateValue({ enableTrueUp })} disabled={disabled} />
			</div>

			{!meterId ? (
				<Notice>
					{t('commitmentConfig.addCharge.selectMeterForBuckets', {
						defaultValue: 'Select a metered feature to configure window commitment time buckets.',
					})}
				</Notice>
			) : isLoading ? (
				<Notice>{t('commitmentConfig.addCharge.loadingMeter', { defaultValue: 'Loading meter details…' })}</Notice>
			) : !showWindow ? (
				showMeterNotSupported ? (
					<Notice>
						{t('commitmentConfig.addCharge.meterNotSupported', {
							defaultValue: 'This meter does not support window commitment. Configure a bucket size on the meter first.',
						})}
					</Notice>
				) : null
			) : (
				<>
					<div className='flex items-center justify-between rounded-lg bg-gray-50 p-4'>
						<div className='flex-1 pr-4'>
							<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.windowCommitment')}</label>
							<p className='mt-0.5 text-xs text-gray-500'>
								{t('commitmentConfig.windowCommitmentHint', { bucketSize: meter?.aggregation?.bucket_size ?? '—' })}
							</p>
						</div>
						<Switch
							checked={value.windowCommitment}
							onCheckedChange={(windowCommitment) =>
								updateValue({
									windowCommitment,
									timeBuckets: windowCommitment ? value.timeBuckets : [],
								})
							}
							disabled={disabled}
						/>
					</div>

					{showBuckets && (
						<CommitmentTimeBucketsEditor
							buckets={value.timeBuckets}
							onChange={(timeBuckets) => updateValue({ timeBuckets })}
							bucketSize={meter?.aggregation?.bucket_size}
							disabled={disabled}
							defaultCommitmentType={value.commitmentType}
							currencySymbol={currencySymbol}
							currency={currency}
							bucketDefaults={{
								...resolvedBucketDefaults,
								commitment_type: resolvedBucketDefaults?.commitment_type ?? value.commitmentType,
								commitment_value: resolvedBucketDefaults?.commitment_value,
							}}
						/>
					)}
				</>
			)}
		</div>
	);
};

export default SubscriptionChargeCommitmentSection;
