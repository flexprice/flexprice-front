import { FC, useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/atoms';
import { Input, Button, Select, SelectOption, DatePicker } from '@/components/atoms';
import { Price, BILLING_MODEL, TIER_MODE, CreatePriceTier, TransformQuantity, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { formatAmount, removeFormatting } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import VolumeTieredPricingForm from '@/components/organisms/PlanForm/VolumeTieredPricingForm';
import { PremiumFeatureIcon } from '../PremiumFeature/PremiumFeature';
import { useTranslation } from 'react-i18next';
import type { LineItem } from '@/models/Subscription';
import type { UpdateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import SubscriptionChargeCommitmentSection, {
	DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
	type SubscriptionChargeCommitmentState,
} from '@/components/organisms/Subscription/SubscriptionChargeCommitmentSection';
import { useMeterForCommitment } from '@/hooks/useMeterForCommitment';
import {
	buildLineItemCommitmentUpdatePayload,
	formatWindowCommitmentError,
	lineItemWindowCommitmentStateFromBuckets,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';
import { useCommitmentTimeBucketPrices } from '@/hooks/useCommitmentTimeBucketPrices';
import { convertPriceOverrideToLineItemUpdate } from '@/utils/subscription/priceOverrideToLineItemUpdate';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	price: Price;
	onPriceOverride: (priceId: string, override: Partial<ExtendedPriceOverride>) => void;
	onResetOverride: (priceId: string) => void;
	overriddenPrices: Record<string, ExtendedPriceOverride>;
	showEffectiveFrom?: boolean; // Optional prop to conditionally show effective_from date
	/** When set (subscription line item edit), shows window commitment and merges into line item update. */
	lineItem?: LineItem;
	onLineItemUpdate?: (updateData: UpdateSubscriptionLineItemRequest) => void | Promise<void>;
	isSaving?: boolean;
}

const PriceOverrideDialog: FC<Props> = ({
	isOpen,
	onOpenChange,
	price,
	onPriceOverride,
	onResetOverride,
	overriddenPrices,
	showEffectiveFrom = false,
	lineItem,
	onLineItemUpdate,
	isSaving = false,
}) => {
	const { t } = useTranslation('catalog');
	const { t: tBilling } = useTranslation('billing');
	const meterId = lineItem?.meter_id || lineItem?.price?.meter_id;
	const { meter } = useMeterForCommitment(meterId, lineItem?.price?.meter);
	const { bucketsWithPrices, isLoading: isLoadingBucketPrices } = useCommitmentTimeBucketPrices(
		isOpen && lineItem ? lineItem.commitment_time_buckets : undefined,
	);
	const [commitmentState, setCommitmentState] = useState<SubscriptionChargeCommitmentState>(DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE);
	const [initialCommitmentState, setInitialCommitmentState] = useState<SubscriptionChargeCommitmentState>(
		DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
	);

	useEffect(() => {
		if (isOpen && lineItem && !isLoadingBucketPrices) {
			const state = lineItemWindowCommitmentStateFromBuckets(lineItem, bucketsWithPrices);
			setCommitmentState(state);
			setInitialCommitmentState(state);
		}
	}, [isOpen, lineItem, bucketsWithPrices, isLoadingBucketPrices]);

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
	const [isOverridden, setIsOverridden] = useState(false);

	// Detect price unit type
	const isCustomPriceUnit = price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

	// Check if this price is currently overridden
	useEffect(() => {
		const currentOverride = overriddenPrices[price.id];
		const isCurrentlyOverridden = currentOverride !== undefined;
		setIsOverridden(isCurrentlyOverridden);

		if (isCurrentlyOverridden) {
			// Initialize from override or original price based on price unit type
			if (isCustomPriceUnit) {
				setOverrideAmount(currentOverride.price_unit_amount || price.price_unit_amount || price.price_unit_config?.amount || '');
				setOverrideTiers(currentOverride.price_unit_tiers || price.price_unit_tiers || []);
			} else {
				setOverrideAmount(currentOverride.amount || price.amount);
				setOverrideTiers(currentOverride.tiers || price.tiers || []);
			}
			setOverrideQuantity(currentOverride.quantity);
			setOverrideBillingModel(currentOverride.billing_model || price.billing_model);
			setOverrideTierMode(currentOverride.tier_mode || price.tier_mode || TIER_MODE.VOLUME);
			setOverrideTransformQuantity(currentOverride.transform_quantity || { divide_by: 1, round: 'up' });
			if (showEffectiveFrom && currentOverride.effective_from) {
				setEffectiveFrom(new Date(currentOverride.effective_from));
			}
		} else {
			// Prefill with original price values
			setOverrideQuantity(1); // Default quantity for usage-based prices
			setOverrideBillingModel(price.billing_model);
			setOverrideTierMode(price.tier_mode || TIER_MODE.VOLUME);

			// Initialize amount and tiers based on price unit type
			if (isCustomPriceUnit) {
				const initialAmount = price.price_unit_amount || price.price_unit_config?.amount || '';
				setOverrideAmount(initialAmount);

				// Initialize with original price_unit_tiers if they exist, otherwise start with one default tier
				if (price.price_unit_tiers && price.price_unit_tiers.length > 0) {
					setOverrideTiers(
						price.price_unit_tiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
				} else {
					// Start with one default tier
					setOverrideTiers([
						{
							unit_amount: initialAmount, // Prefill with original amount
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			} else {
				setOverrideAmount(price.amount);

				// Initialize with original tiers if they exist, otherwise start with one default tier
				if (price.tiers && price.tiers.length > 0) {
					setOverrideTiers(
						price.tiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
				} else {
					// Start with one default tier
					setOverrideTiers([
						{
							unit_amount: price.amount, // Prefill with original amount
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			}

			// Prefill transform quantity with original value if it exists
			setOverrideTransformQuantity(price.transform_quantity || { divide_by: 1, round: 'up' });
			if (showEffectiveFrom) {
				setEffectiveFrom(undefined);
			}
		}
	}, [
		price.id,
		overriddenPrices,
		price.billing_model,
		price.tier_mode,
		price.tiers,
		price.amount,
		price.transform_quantity,
		price.price_unit_type,
		price.price_unit_amount,
		price.price_unit_tiers,
		price.price_unit_config,
		showEffectiveFrom,
		isCustomPriceUnit,
	]);

	const buildPriceOverride = (): Partial<ExtendedPriceOverride> => {
		const override: Partial<ExtendedPriceOverride> = {};

		// Handle amount/price_unit_amount based on price unit type and billing model
		if (overrideBillingModel !== BILLING_MODEL.TIERED && overrideBillingModel !== 'SLAB_TIERED') {
			if (isCustomPriceUnit) {
				// For CUSTOM prices, use price_unit_amount
				const originalAmount = price.price_unit_amount || price.price_unit_config?.amount || '';
				if (overrideAmount && removeFormatting(overrideAmount) !== originalAmount) {
					override.price_unit_amount = removeFormatting(overrideAmount);
				}
			} else {
				// For FIAT prices, use amount
				if (overrideAmount && removeFormatting(overrideAmount) !== price.amount) {
					override.amount = removeFormatting(overrideAmount);
				}
			}
		}

		// Quantity can be overridden for any billing model
		if (overrideQuantity !== undefined) {
			override.quantity = overrideQuantity;
		}

		// Billing model override
		if (overrideBillingModel !== price.billing_model) {
			override.billing_model = overrideBillingModel;
		}

		// Tier mode override
		if (overrideTierMode !== (price.tier_mode || TIER_MODE.VOLUME)) {
			override.tier_mode = overrideTierMode;
		}

		// Handle tiers/price_unit_tiers based on price unit type and billing model
		if ((overrideBillingModel === BILLING_MODEL.TIERED || overrideBillingModel === 'SLAB_TIERED') && overrideTiers.length > 0) {
			if (isCustomPriceUnit) {
				// For CUSTOM prices, use price_unit_tiers
				override.price_unit_tiers = overrideTiers;
			} else {
				// For FIAT prices, use tiers
				override.tiers = overrideTiers;
			}
		}

		// Only include transform_quantity if billing model is package (same for both types)
		if (overrideBillingModel === BILLING_MODEL.PACKAGE && overrideTransformQuantity !== undefined) {
			override.transform_quantity = overrideTransformQuantity;
		}

		// Include effective_from if showEffectiveFrom is enabled
		if (showEffectiveFrom && effectiveFrom) {
			override.effective_from = effectiveFrom.toISOString();
		}

		return override;
	};

	const hasCommitmentChanges = () => {
		if (!lineItem) return false;
		return JSON.stringify(commitmentState) !== JSON.stringify(initialCommitmentState);
	};

	const handleOverride = async () => {
		const override = buildPriceOverride();

		if (lineItem && onLineItemUpdate) {
			const priceUpdate = convertPriceOverrideToLineItemUpdate(price.id, override);
			const commitmentResult = buildLineItemCommitmentUpdatePayload(commitmentState, lineItem, meter);
			if (!commitmentResult.ok) {
				toast.error(formatWindowCommitmentError(commitmentResult.error, tBilling));
				return;
			}
			const merged: UpdateSubscriptionLineItemRequest = { ...priceUpdate, ...commitmentResult.payload };
			const hasPriceChanges = Object.keys(priceUpdate).length > 0;
			if (!hasPriceChanges && !hasCommitmentChanges()) {
				onOpenChange(false);
				return;
			}
			try {
				await onLineItemUpdate(merged);
			} catch {
				// Keep dialog open so the user can fix and retry.
			}
			return;
		}

		if (Object.keys(override).length > 0) {
			onPriceOverride(price.id, override);
		} else {
			onResetOverride(price.id);
		}
		onOpenChange(false);
	};

	const handleReset = () => {
		onResetOverride(price.id);
		setOverrideQuantity(undefined);
		setOverrideBillingModel(price.billing_model);

		// Reset amount and tiers based on price unit type
		if (isCustomPriceUnit) {
			setOverrideAmount(price.price_unit_amount || price.price_unit_config?.amount || '');
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
						unit_amount: '',
						flat_amount: '0',
						up_to: null,
					},
				]);
			}
		} else {
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
						unit_amount: '',
						flat_amount: '0',
						up_to: null,
					},
				]);
			}
		}

		// Reset transform_quantity to original value or default
		setOverrideTransformQuantity(price.transform_quantity || { divide_by: 1, round: 'up' });
		if (showEffectiveFrom) {
			setEffectiveFrom(undefined);
		}
		setIsOverridden(false);
	};

	const handleCancel = () => {
		const currentOverride = overriddenPrices[price.id];
		if (currentOverride) {
			// Restore from override based on price unit type
			if (isCustomPriceUnit) {
				setOverrideAmount(currentOverride.price_unit_amount || price.price_unit_amount || price.price_unit_config?.amount || '');
				setOverrideTiers(currentOverride.price_unit_tiers || price.price_unit_tiers || []);
			} else {
				setOverrideAmount(currentOverride.amount || price.amount);
				setOverrideTiers(currentOverride.tiers || price.tiers || []);
			}
			setOverrideQuantity(currentOverride.quantity);
			setOverrideBillingModel(currentOverride.billing_model || price.billing_model);
			setOverrideTransformQuantity(currentOverride.transform_quantity || { divide_by: 1, round: 'up' });
			if (showEffectiveFrom && currentOverride.effective_from) {
				setEffectiveFrom(new Date(currentOverride.effective_from));
			}
		} else {
			// Reset to original values based on price unit type
			if (isCustomPriceUnit) {
				setOverrideAmount(price.price_unit_amount || price.price_unit_config?.amount || '');
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
							unit_amount: '',
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			} else {
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
							unit_amount: '',
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			}
			setOverrideQuantity(undefined);
			setOverrideBillingModel(price.billing_model);
			// Reset to original transform_quantity or default
			setOverrideTransformQuantity(price.transform_quantity || { divide_by: 1, round: 'up' });
			if (showEffectiveFrom) {
				setEffectiveFrom(undefined);
			}
		}
		onOpenChange(false);
	};

	const hasChanges = () => {
		// Check if billing model has changed (including SLAB_TIERED conversion)
		const originalBillingModel = price.billing_model;
		const originalTierMode = price.tier_mode || TIER_MODE.VOLUME;

		let billingModelChanged: boolean;
		if (overrideBillingModel === 'SLAB_TIERED' && originalBillingModel === BILLING_MODEL.TIERED && originalTierMode === TIER_MODE.SLAB) {
			billingModelChanged = false; // Same as original
		} else if (
			overrideBillingModel === BILLING_MODEL.TIERED &&
			originalBillingModel === BILLING_MODEL.TIERED &&
			originalTierMode === TIER_MODE.VOLUME
		) {
			billingModelChanged = false; // Same as original
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
			(showEffectiveFrom && effectiveFrom !== undefined)
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

	const handleDialogOpenChange = (open: boolean) => {
		if (!open && isSaving) return;
		onOpenChange(open);
	};

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={handleDialogOpenChange}
			title={
				<div className='flex items-center gap-2'>
					<span>{t('priceDialogs.overrideTitle')}</span>
					<PremiumFeatureIcon side='right' align='center' sideOffset={10} />
				</div>
			}
			description={t('priceDialogs.modifyPricingDescription', { name: chargeDisplayName })}
			className={lineItem ? 'w-full max-w-4xl overflow-x-hidden ' : 'w-full max-w-lg sm:max-w-[32rem]'}>
			<div className='space-y-6 min-w-0'>
				<div className='space-y-4'>
					{/* Original Price Display */}
					<div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
						<div className='text-sm text-gray-600'>{t('priceDialogs.originalPrice')}</div>
						<div className='font-medium'>
							{displaySymbol}
							{originalFormatted}
						</div>
					</div>

					{/* Billing Model Override - Only show for USAGE price types */}
					{price.type === PRICE_TYPE.USAGE && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>{t('priceDialogs.billingModel')}</label>
							<Select
								value={overrideBillingModel}
								onChange={(value) => setOverrideBillingModel(value as BILLING_MODEL)}
								options={billingModelOptions}
								placeholder={t('priceDialogs.selectBillingModel')}
							/>
						</div>
					)}

					{/* Amount Override - only show if billing model is not TIERED or SLAB_TIERED */}
					{overrideBillingModel !== BILLING_MODEL.TIERED && overrideBillingModel !== 'SLAB_TIERED' && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>
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

					{/* Tiers Override - only show if billing model is TIERED or SLAB_TIERED */}
					{(overrideBillingModel === BILLING_MODEL.TIERED || overrideBillingModel === 'SLAB_TIERED') && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>{t('priceDialogs.tiers')}</label>
							<VolumeTieredPricingForm
								tieredPrices={
									overrideTiers.length > 0
										? overrideTiers.map((tier, index) => {
												// Calculate proper from and up_to values
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
									// Handle both function and direct value cases
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

									// Convert the PriceTier format to CreatePriceTier format
									// and properly handle the from/up_to values
									const convertedTiers = newTiers.map((tier) => {
										// Use the tier's own up_to value directly
										return {
											unit_amount: tier.unit_amount || '',
											flat_amount: tier.flat_amount || '0',
											up_to: tier.up_to,
										};
									});
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
							<label className='text-sm font-medium text-gray-700'>{t('priceDialogs.packageConfiguration')}</label>
							<div className='space-y-2'>
								<label className='text-sm text-gray-600'>{t('priceDialogs.unitsPerPackage')}</label>
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
									<div className='text-xs text-gray-500'>
										{t('priceDialogs.originalUnitsPerPackage', { count: price.transform_quantity.divide_by })}
									</div>
								)}
							</div>
						</div>
					)}

					{showEffectiveFrom && (
						<div className='space-y-2'>
							<DatePicker
								label={t('priceDialogs.effectiveFromOptional')}
								placeholder={t('priceDialogs.selectDateScheduledUpdate')}
								date={effectiveFrom}
								setDate={setEffectiveFrom}
								className='w-full'
							/>
							<p className='text-xs text-gray-500'>{t('priceDialogs.schedulePriceChangeHint')}</p>
						</div>
					)}

					{isOverridden && (
						<div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
							<div className='text-sm text-blue-700'>{t('priceDialogs.priceOverriddenNotice')}</div>
						</div>
					)}
				</div>

				{lineItem && (
					<SubscriptionChargeCommitmentSection
						meterId={meterId}
						currency={lineItem.currency}
						value={commitmentState}
						onChange={setCommitmentState}
						disabled={isSaving}
					/>
				)}

				<div className='flex gap-3 pt-4'>
					<Button variant='outline' onClick={handleCancel} className='flex-1' disabled={isSaving}>
						{t('priceDialogs.cancel')}
					</Button>
					{isOverridden && !lineItem && (
						<Button variant='outline' onClick={handleReset} className='flex-1' disabled={isSaving}>
							{t('priceDialogs.reset')}
						</Button>
					)}
					<Button
						onClick={handleOverride}
						className='flex-1'
						disabled={isSaving || (!hasChanges() && !hasCommitmentChanges())}
						isLoading={isSaving}>
						{lineItem || isOverridden ? t('priceDialogs.updateOverride') : t('priceDialogs.overridePrice')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default PriceOverrideDialog;
