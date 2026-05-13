import { FC, useState, useEffect } from 'react';
import { Dialog } from '@/components/atoms';
import { Input, Button, Select, SelectOption, DatePicker } from '@/components/atoms';
import { Price, BILLING_MODEL, TIER_MODE, CreatePriceTier, TransformQuantity, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { formatAmount, removeFormatting } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import VolumeTieredPricingForm from '@/components/organisms/PlanForm/VolumeTieredPricingForm';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PriceApi } from '@/api/PriceApi';
import { UpdatePriceRequest } from '@/types/dto';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { PremiumFeatureIcon } from '../PremiumFeature/PremiumFeature';

interface UpdatePriceDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	price: Price;
	planId: string;
	onSuccess?: () => void;
}

const billingModelOptions: SelectOption[] = [
	{ label: 'Flat Fee', value: BILLING_MODEL.FLAT_FEE },
	{ label: 'Package', value: BILLING_MODEL.PACKAGE },
	{ label: 'Volume Tiered', value: BILLING_MODEL.TIERED },
	{ label: 'Slab Tiered', value: 'SLAB_TIERED' },
];

const UpdatePriceDialog: FC<UpdatePriceDialogProps> = ({ isOpen, onOpenChange, price, planId: _planId, onSuccess }) => {
	const [overrideAmount, setOverrideAmount] = useState('');
	const [overrideQuantity, setOverrideQuantity] = useState<number | undefined>(undefined);
	const [overrideBillingModel, setOverrideBillingModel] = useState<BILLING_MODEL | 'SLAB_TIERED'>(price.billing_model);
	const [overrideTierMode, setOverrideTierMode] = useState<TIER_MODE>(price.tier_mode || TIER_MODE.VOLUME);
	const [overrideTiers, setOverrideTiers] = useState<CreatePriceTier[]>([]);
	const [overrideTransformQuantity, setOverrideTransformQuantity] = useState<TransformQuantity>({
		divide_by: 1,
	});
	const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(undefined);

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
		}
	}, [isOpen, price, isCustomPriceUnit]);

	const { mutateAsync: updatePrice, isPending: isUpdatingPrice } = useMutation({
		mutationFn: async ({ priceId, data }: { priceId: string; data: UpdatePriceRequest }) => {
			return await PriceApi.UpdatePrice(priceId, data);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update price');
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

		// Include effective_from if provided
		if (effectiveFrom) {
			updateData.effective_from = effectiveFrom.toISOString();
		}

		try {
			// Update the price
			await updatePrice({ priceId: price.id, data: updateData });

			const priceName = price.meter?.name || 'Price';
			const message = effectiveFrom
				? `${priceName} will be effective from ${formatDateTimeWithSecondsAndTimezone(effectiveFrom)}.`
				: `${priceName} has been updated successfully.`;
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

		let billingModelChanged = false;
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
		let amountChanged = false;
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

		return (
			amountChanged ||
			overrideQuantity !== undefined ||
			billingModelChanged ||
			tiersChanged ||
			overrideTransformQuantity !== undefined ||
			effectiveFrom !== undefined
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

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				<div className='flex items-center gap-2'>
					<span>Update Price</span>
					<PremiumFeatureIcon side='right' align='center' sideOffset={10} />
				</div>
			}
			description={`Update the pricing configuration (amount, billing model, tiers) for ${price.meter?.name || price.description || 'this charge'}`}
			className='w-auto min-w-[32rem] max-w-[90vw]'>
			<div className='space-y-6 max-h-[80vh] overflow-y-auto'>
				<div className='space-y-4'>
					{/* Original Price Display */}
					<div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
						<div className='text-sm text-gray-600'>Original Price</div>
						<div className='font-medium'>
							{displaySymbol}
							{originalFormatted}
						</div>
					</div>

					{/* Billing Model Override - Only show for USAGE price types */}
					{price.type === PRICE_TYPE.USAGE && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>Billing Model</label>
							<Select
								value={overrideBillingModel}
								onChange={(value) => setOverrideBillingModel(value as BILLING_MODEL)}
								options={billingModelOptions}
								placeholder='Select billing model'
							/>
						</div>
					)}

					{/* Amount Override - only show if billing model is not TIERED or SLAB_TIERED */}
					{overrideBillingModel !== BILLING_MODEL.TIERED && overrideBillingModel !== 'SLAB_TIERED' && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>
								Override Amount ({isCustomPriceUnit ? displaySymbol : price.currency})
							</label>
							<Input
								type='formatted-number'
								value={overrideAmount}
								onChange={setOverrideAmount}
								placeholder='Enter new amount (optional)'
								suffix={displaySymbol}
								className='w-full'
							/>
						</div>
					)}

					{/* Tiers Override - only show if billing model is TIERED or SLAB_TIERED */}
					{(overrideBillingModel === BILLING_MODEL.TIERED || overrideBillingModel === 'SLAB_TIERED') && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>Tiers</label>
							<VolumeTieredPricingForm
								tieredPrices={
									overrideTiers.length > 0
										? overrideTiers.map((tier, index) => {
												let from = 0;
												let up_to = null;

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

					{/* Transform Quantity Override - only show if billing model is PACKAGE */}
					{overrideBillingModel === BILLING_MODEL.PACKAGE && (
						<div className='space-y-4'>
							<label className='text-sm font-medium text-gray-700'>Package Configuration</label>
							<div className='space-y-2'>
								<label className='text-sm text-gray-600'>Units per package</label>
								<Input
									type='number'
									value={overrideTransformQuantity?.divide_by || ''}
									onChange={(value) =>
										setOverrideTransformQuantity({
											...overrideTransformQuantity,
											divide_by: Number(value) || 1,
										})
									}
									placeholder='Enter units per package'
									className='w-full'
								/>
								{price.transform_quantity && (
									<div className='text-xs text-gray-500'>Original: {price.transform_quantity.divide_by} units per package</div>
								)}
							</div>
						</div>
					)}

					{/* Effective From Date */}
					<div className='space-y-2'>
						<DatePicker
							label='Effective From (Optional)'
							placeholder='Select date for scheduled update'
							date={effectiveFrom}
							setDate={setEffectiveFrom}
							className='w-full'
							labelClassName=''
							popoverTriggerClassName='w-full'
						/>
						<p className='text-xs text-gray-500'>Schedule this price change to take effect on a future date</p>
					</div>
				</div>

				<div className='flex gap-3 pt-4'>
					<Button variant='outline' onClick={handleCancel} disabled={isLoading} className='flex-1'>
						Cancel
					</Button>
					<Button onClick={handleUpdate} className='flex-1' disabled={!hasChanges() || isLoading} isLoading={isLoading}>
						Update Price
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default UpdatePriceDialog;
