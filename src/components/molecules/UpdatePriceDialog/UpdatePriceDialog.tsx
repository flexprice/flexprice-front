import { FC, useState, useEffect, useMemo } from 'react';
import { Dialog } from '@/components/atoms';
import { Input, Button, Select, SelectOption, DatePicker } from '@/components/atoms';
import { Price, BILLING_MODEL, TIER_MODE, CreatePriceTier, TransformQuantity, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { BUCKET_SIZE } from '@/models/Meter';
import { formatAmount, removeFormatting } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import VolumeTieredPricingForm from '@/components/organisms/PlanForm/VolumeTieredPricingForm';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PriceApi } from '@/api/PriceApi';
import { UpdatePriceRequest } from '@/types/dto';
import { BUCKET_SIZE_NONE, priceBucketSizeOptions } from '@/constants/constants';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { PremiumFeatureIcon } from '../PremiumFeature/PremiumFeature';
import { useTranslation } from 'react-i18next';

interface UpdatePriceDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	price: Price;
	planId: string;
	onSuccess?: () => void;
}

const UpdatePriceDialog: FC<UpdatePriceDialogProps> = ({ isOpen, onOpenChange, price, planId: _planId, onSuccess }) => {
	const { t } = useTranslation('catalog');

	const billingModelOptions: SelectOption[] = useMemo(
		() => [
			{ label: t('priceDialogs.billingModels.flatFee'), value: BILLING_MODEL.FLAT_FEE },
			{ label: t('priceDialogs.billingModels.package'), value: BILLING_MODEL.PACKAGE },
			{ label: t('priceDialogs.billingModels.volumeTiered'), value: BILLING_MODEL.TIERED },
			{ label: t('priceDialogs.billingModels.slabTiered'), value: 'SLAB_TIERED' },
		],
		[t],
	);

	const [overrideAmount, setOverrideAmount] = useState('');
	const [overrideQuantity, setOverrideQuantity] = useState<number | undefined>(undefined);
	const [overrideBillingModel, setOverrideBillingModel] = useState<BILLING_MODEL | 'SLAB_TIERED'>(price.billing_model);
	const [overrideTierMode, setOverrideTierMode] = useState<TIER_MODE>(price.tier_mode || TIER_MODE.VOLUME);
	const [overrideTiers, setOverrideTiers] = useState<CreatePriceTier[]>([]);
	const [overrideTransformQuantity, setOverrideTransformQuantity] = useState<TransformQuantity>({
		divide_by: 1,
	});
	const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(undefined);
	const [overrideBucketSize, setOverrideBucketSize] = useState<BUCKET_SIZE | ''>(price.bucket_size ?? '');

	// Detect price unit type
	const isCustomPriceUnit = price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

	// Initialize state when price or dialog opens
	useEffect(() => {
		if (isOpen) {
			setOverrideQuantity(1);
			setOverrideBillingModel(price.billing_model);
			setOverrideTierMode(price.tier_mode || TIER_MODE.VOLUME);

			// Initialize amount and tiers based on price unit type
			if (isCustomPriceUnit) {
				// For CUSTOM prices, use price_unit_amount and price_unit_tiers
				const initialAmount = price.price_unit_amount || price.price_unit_config?.amount || '';
				setOverrideAmount(initialAmount);

				if (price.price_unit_tiers && price.price_unit_tiers.length > 0) {
					setOverrideTiers(
						price.price_unit_tiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
				} else {
					setOverrideTiers([
						{
							unit_amount: initialAmount,
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			} else {
				// For FIAT prices, use amount and tiers
				setOverrideAmount(price.amount);

				if (price.tiers && price.tiers.length > 0) {
					setOverrideTiers(
						price.tiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
				} else {
					setOverrideTiers([
						{
							unit_amount: price.amount,
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			}

			setOverrideTransformQuantity(price.transform_quantity || { divide_by: 1, round: 'up' });
			setEffectiveFrom(undefined);
			setOverrideBucketSize(price.bucket_size ?? '');
		}
	}, [isOpen, price, isCustomPriceUnit]);

	const { mutateAsync: updatePrice, isPending: isUpdatingPrice } = useMutation({
		mutationFn: async ({ priceId, data }: { priceId: string; data: UpdatePriceRequest }) => {
			return await PriceApi.UpdatePrice(priceId, data);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('priceDialogs.failedUpdateToast'));
		},
	});

	const isLoading = isUpdatingPrice;

	const handleUpdate = async () => {
		const updateData: UpdatePriceRequest = {};

		// Handle amount/price_unit_amount based on price unit type and billing model
		if (overrideBillingModel !== BILLING_MODEL.TIERED && overrideBillingModel !== 'SLAB_TIERED') {
			if (isCustomPriceUnit) {
				// For CUSTOM prices, use price_unit_amount
				const originalAmount = price.price_unit_amount || price.price_unit_config?.amount || '';
				if (overrideAmount && removeFormatting(overrideAmount) !== originalAmount) {
					updateData.price_unit_amount = removeFormatting(overrideAmount);
				}
			} else {
				// For FIAT prices, use amount
				if (overrideAmount && removeFormatting(overrideAmount) !== price.amount) {
					updateData.amount = removeFormatting(overrideAmount);
				}
			}
		}

		// Billing model override
		if (overrideBillingModel !== price.billing_model) {
			if (overrideBillingModel === 'SLAB_TIERED') {
				updateData.billing_model = BILLING_MODEL.TIERED;
			} else {
				updateData.billing_model = overrideBillingModel as BILLING_MODEL;
			}
		}

		// Tier mode override
		if (overrideTierMode !== (price.tier_mode || TIER_MODE.VOLUME)) {
			updateData.tier_mode = overrideTierMode;
		}

		// Handle tiers/price_unit_tiers based on price unit type and billing model
		if ((overrideBillingModel === BILLING_MODEL.TIERED || overrideBillingModel === 'SLAB_TIERED') && overrideTiers.length > 0) {
			if (isCustomPriceUnit) {
				// For CUSTOM prices, use price_unit_tiers
				updateData.price_unit_tiers = overrideTiers;
			} else {
				// For FIAT prices, use tiers
				updateData.tiers = overrideTiers;
			}
		}

		// Only include transform_quantity if billing model is package (same for both types)
		if (overrideBillingModel === BILLING_MODEL.PACKAGE) {
			updateData.transform_quantity = {
				...overrideTransformQuantity,
				divide_by: overrideQuantity || overrideTransformQuantity.divide_by,
			};
		}

		// Bucket size override - send BUCKET_SIZE_NONE to explicitly clear, omit to leave unchanged
		const originalBucketSize = price.bucket_size ?? '';
		if (overrideBucketSize !== originalBucketSize) {
			updateData.bucket_size = overrideBucketSize || BUCKET_SIZE_NONE;
		}

		// Include effective_from if provided
		if (effectiveFrom) {
			updateData.effective_from = effectiveFrom.toISOString();
		}

		try {
			// Update the price
			await updatePrice({ priceId: price.id, data: updateData });

			const priceName = price.meter?.name || t('priceDialogs.fallbackPriceName');
			const message = effectiveFrom
				? t('priceDialogs.toastScheduled', { name: priceName, date: formatDateTimeWithSecondsAndTimezone(effectiveFrom) })
				: t('priceDialogs.toastUpdated', { name: priceName });
			toast.success(message);

			onSuccess?.();
			onOpenChange(false);
		} catch (error) {
			console.error('Error updating price:', error);
		}
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	const hasChanges = () => {
		const originalBillingModel = price.billing_model;
		const originalTierMode = price.tier_mode || TIER_MODE.VOLUME;

		let billingModelChanged: boolean;
		if (overrideBillingModel === 'SLAB_TIERED' && originalBillingModel === BILLING_MODEL.TIERED && originalTierMode === TIER_MODE.SLAB) {
			billingModelChanged = false;
		} else if (
			overrideBillingModel === BILLING_MODEL.TIERED &&
			originalBillingModel === BILLING_MODEL.TIERED &&
			originalTierMode === TIER_MODE.VOLUME
		) {
			billingModelChanged = false;
		} else {
			billingModelChanged = overrideBillingModel !== originalBillingModel;
		}

		// Compare amount/price_unit_amount based on price unit type
		let amountChanged: boolean;
		if (isCustomPriceUnit) {
			const originalAmount = price.price_unit_amount || price.price_unit_config?.amount || '';
			amountChanged = !!(overrideAmount && removeFormatting(overrideAmount) !== originalAmount);
		} else {
			amountChanged = !!(overrideAmount && removeFormatting(overrideAmount) !== price.amount);
		}

		// Compare tiers/price_unit_tiers based on price unit type
		let tiersChanged = false;
		if (isCustomPriceUnit) {
			const originalTiers = price.price_unit_tiers || [];
			if (originalTiers.length === 0 && overrideTiers.length > 0) {
				tiersChanged = true;
			} else if (originalTiers.length > 0) {
				// Compare tier values
				tiersChanged =
					JSON.stringify(overrideTiers) !==
					JSON.stringify(
						originalTiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
			}
		} else {
			const originalTiers = price.tiers || [];
			if (originalTiers.length === 0 && overrideTiers.length > 0) {
				tiersChanged = true;
			} else if (originalTiers.length > 0) {
				// Compare tier values
				tiersChanged =
					JSON.stringify(overrideTiers) !==
					JSON.stringify(
						originalTiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
			}
		}

		const bucketSizeChanged = overrideBucketSize !== (price.bucket_size ?? '');

		return (
			amountChanged ||
			overrideQuantity !== undefined ||
			billingModelChanged ||
			tiersChanged ||
			overrideTransformQuantity !== undefined ||
			effectiveFrom !== undefined ||
			bucketSizeChanged
		);
	};

	// Get display amount and symbol based on price unit type
	const getDisplayAmount = () => {
		if (isCustomPriceUnit) {
			return price.price_unit_amount || price.price_unit_config?.amount || price.amount || '0';
		}
		return price.amount || '0';
	};

	const getDisplaySymbol = () => {
		if (isCustomPriceUnit) {
			// Try to get price unit symbol from pricing_unit if available (from PriceResponse)
			// Otherwise fall back to price_unit_config.price_unit or price_unit
			return price.price_unit_config?.price_unit || price.price_unit || price.currency;
		}
		return getCurrencySymbol(price.currency);
	};

	const originalFormatted = formatAmount(getDisplayAmount());
	const displaySymbol = getDisplaySymbol();
	const chargeDisplayName = price.meter?.name || price.description || t('priceDialogs.thisChargeFallback');

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				<div className='flex items-center gap-2'>
					<span>{t('priceDialogs.updateTitle')}</span>
					<PremiumFeatureIcon side='right' align='center' sideOffset={10} />
				</div>
			}
			description={t('priceDialogs.updatePricingDescription', { name: chargeDisplayName })}
			className='w-auto min-w-[32rem] max-w-[90vw]'>
			<div className='space-y-6 max-h-[80vh] overflow-y-auto'>
				<div className='space-y-4'>
					<div className='flex items-center justify-between p-3 bg-surface-subtle rounded-lg'>
						<div className='text-sm text-content-tertiary'>{t('priceDialogs.originalPrice')}</div>
						<div className='font-medium'>
							{displaySymbol}
							{originalFormatted}
						</div>
					</div>

					{price.type === PRICE_TYPE.USAGE && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-content-secondary'>{t('priceDialogs.billingModel')}</label>
							<Select
								value={overrideBillingModel}
								onChange={(value) => setOverrideBillingModel(value as BILLING_MODEL)}
								options={billingModelOptions}
								placeholder={t('priceDialogs.selectBillingModel')}
							/>
						</div>
					)}

					{price.type === PRICE_TYPE.USAGE && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-content-secondary'>{t('priceDialogs.bucketSize')}</label>
							<Select
								value={overrideBucketSize}
								onChange={(value) => setOverrideBucketSize(value as BUCKET_SIZE)}
								options={priceBucketSizeOptions}
								placeholder={t('priceDialogs.bucketSizePlaceholder')}
							/>
						</div>
					)}

					{overrideBillingModel !== BILLING_MODEL.TIERED && overrideBillingModel !== 'SLAB_TIERED' && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-content-secondary'>
								{t('priceDialogs.overrideAmountLabel', { unit: isCustomPriceUnit ? displaySymbol : price.currency })}
							</label>
							<Input
								type='formatted-number'
								value={overrideAmount}
								onChange={setOverrideAmount}
								placeholder={t('priceDialogs.enterNewAmountOptional')}
								suffix={displaySymbol}
								className='w-full'
							/>
						</div>
					)}

					{(overrideBillingModel === BILLING_MODEL.TIERED || overrideBillingModel === 'SLAB_TIERED') && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-content-secondary'>{t('priceDialogs.tiers')}</label>
							<VolumeTieredPricingForm
								tieredPrices={
									overrideTiers.length > 0
										? overrideTiers.map((tier, index) => {
												let from: number;
												let up_to: number | null;

												if (index === 0) {
													from = 0;
													up_to = overrideTiers[0]?.up_to || null;
												} else {
													from = overrideTiers[index - 1]?.up_to || 0;
													up_to = overrideTiers[index]?.up_to || null;
												}

												return {
													from,
													up_to,
													unit_amount: tier.unit_amount || '',
													flat_amount: tier.flat_amount || '0',
												};
											})
										: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }]
								}
								setTieredPrices={(setter) => {
									const newTiers =
										typeof setter === 'function'
											? setter(
													overrideTiers.length > 0
														? overrideTiers.map((tier, index) => ({
																from: index === 0 ? 0 : overrideTiers[index - 1]?.up_to || 0,
																up_to: tier.up_to || null,
																unit_amount: tier.unit_amount || '',
																flat_amount: tier.flat_amount || '0',
															}))
														: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }],
												)
											: setter;

									const convertedTiers = newTiers.map((tier) => ({
										unit_amount: tier.unit_amount || '',
										flat_amount: tier.flat_amount || '0',
										up_to: tier.up_to,
									}));
									setOverrideTiers(convertedTiers);
								}}
								currency={isCustomPriceUnit ? displaySymbol : price.currency}
								tierMode={overrideBillingModel === BILLING_MODEL.TIERED ? TIER_MODE.VOLUME : TIER_MODE.SLAB}
							/>
						</div>
					)}

					{overrideBillingModel === BILLING_MODEL.PACKAGE && (
						<div className='space-y-4'>
							<label className='text-sm font-medium text-content-secondary'>{t('priceDialogs.packageConfiguration')}</label>
							<div className='space-y-2'>
								<label className='text-sm text-content-tertiary'>{t('priceDialogs.unitsPerPackage')}</label>
								<Input
									type='number'
									value={overrideTransformQuantity?.divide_by || ''}
									onChange={(value) =>
										setOverrideTransformQuantity({
											...overrideTransformQuantity,
											divide_by: Number(value) || 1,
										})
									}
									placeholder={t('priceDialogs.enterUnitsPerPackage')}
									className='w-full'
								/>
								{price.transform_quantity && (
									<div className='text-xs text-content-muted'>
										{t('priceDialogs.originalUnitsPerPackage', { count: price.transform_quantity.divide_by })}
									</div>
								)}
							</div>
						</div>
					)}

					<div className='space-y-2'>
						<DatePicker
							label={t('priceDialogs.effectiveFromOptional')}
							placeholder={t('priceDialogs.selectDateScheduledUpdate')}
							date={effectiveFrom}
							setDate={setEffectiveFrom}
							className='w-full'
							labelClassName=''
							popoverTriggerClassName='w-full'
						/>
						<p className='text-xs text-content-muted'>{t('priceDialogs.schedulePriceChangeHint')}</p>
					</div>
				</div>

				<div className='flex gap-3 pt-4'>
					<Button variant='outline' onClick={handleCancel} disabled={isLoading} className='flex-1'>
						{t('priceDialogs.cancel')}
					</Button>
					<Button onClick={handleUpdate} className='flex-1' disabled={!hasChanges() || isLoading} isLoading={isLoading}>
						{t('priceDialogs.updatePrice')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default UpdatePriceDialog;
