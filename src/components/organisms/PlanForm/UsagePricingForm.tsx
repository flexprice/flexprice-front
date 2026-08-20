import { Price } from '@/models/Price';
import { FC, useState, useEffect, useMemo, type ReactNode } from 'react';
import { Button, Input, Select, SelectOption, Spacer, DatePicker } from '@/components/atoms';
import SelectFeature from '@/components/atoms/SelectFeature/SelectFeature';
import SelectGroup from './SelectGroup';
// import { Pencil, Trash2 } from 'lucide-react';
import { Group } from '@/models/Group';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { formatBillingPeriodForPrice, getCurrencySymbol } from '@/utils/common/helper_functions';
import { billlingPeriodOptions, currencyOptions, priceBucketSizeOptions } from '@/constants/constants';
import { BUCKET_SIZE } from '@/models/Meter';
import VolumeTieredPricingForm from './VolumeTieredPricingForm';
import { InternalPrice } from './SetupChargesSection';
import UsageChargePreview from './UsageChargePreview';
import { toast } from 'react-hot-toast';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_MODEL, TIER_MODE, PRICE_ENTITY_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { BILLING_PERIOD, PRICE_TYPE } from '@/models/Price';
import { useQuery } from '@tanstack/react-query';
import FeatureApi from '@/api/FeatureApi';
import { ENTITY_STATUS } from '@/models/base';
import { CurrencyPriceUnitSelector } from '@/components/molecules';
import { CurrencyPriceUnitSelection, isPriceUnitOption } from '@/types/common';
import { useTranslation } from 'react-i18next';

/**
 * Enum for internal price states to avoid typos and provide better type safety
 */
export enum PriceInternalState {
	NEW = 'new',
	EDIT = 'edit',
	SAVED = 'saved',
}
interface Props {
	onAdd: (price: InternalPrice) => void;
	onUpdate: (price: InternalPrice) => void;
	onEditClicked: () => void;
	onDeleteClicked: () => void;
	price: Partial<InternalPrice>;
	entityType?: PRICE_ENTITY_TYPE;
	entityId?: string;
	onMeterChange?: (feature: Feature | null) => void;
	/** Rendered after form fields and before the action buttons */
	formFooter?: ReactNode;
	isSaving?: boolean;
}

export interface PriceTier {
	from: number;
	up_to: number | null;
	flat_amount?: string;
	unit_amount?: string;
}

interface TieredPrice {
	from: number;
	up_to: number | null;
	unit_amount: string;
	flat_amount: string;
}

/**
 * Only a non-last tier's up_to should ever be null - VolumeTieredPricingForm renders that as ∞,
 * which is only meaningful for the true last tier. Backend data should already guarantee this,
 * but normalize defensively on load anyway: a stray null on a non-last tier (e.g. from an older
 * client/API path) would otherwise render as unbounded on a row that isn't actually last. The
 * last tier's own up_to is left as-is (it may legitimately be a finite boundary, not just null).
 */
const normalizeTiers = (tiers: TieredPrice[]): PriceTier[] =>
	tiers.map((tier, index) => {
		const isLast = index === tiers.length - 1;
		if (isLast) {
			return { from: tier.from, up_to: tier.up_to, unit_amount: tier.unit_amount, flat_amount: tier.flat_amount };
		}
		return {
			from: tier.from,
			up_to: tier.up_to === null ? (tiers[index + 1]?.from ?? tier.from) : tier.up_to,
			unit_amount: tier.unit_amount,
			flat_amount: tier.flat_amount,
		};
	});

// TODO: Remove disabled once the feature is released
export const billingModels: SelectOption[] = [
	{
		value: BILLING_MODEL.FLAT_FEE,
		label: 'Flat Fee',
		description: 'Charge a fixed amount for each unit of usage.',
	},
	{
		value: BILLING_MODEL.PACKAGE,
		label: 'Package',
		description: 'Charge by package, bundle or group of units.',
	},
	{
		value: BILLING_MODEL.TIERED,
		label: 'Volume Tiered',
		description: 'All units price based on final tier reached.',
	},
	{
		value: 'SLAB_TIERED',
		label: 'Slab Tiered',
		description: 'Tiers apply progressively as quantity increases.',
	}, // Maps to TIERED with SLAB tier_mode
];

// ONETIME isn't offered for usage charges (they're inherently metered/recurring), but older prices
// may still have it saved — fall back to MONTHLY rather than leaving the Select without a matching option.
const normalizeUsageBillingPeriod = (billingPeriod?: BILLING_PERIOD): BILLING_PERIOD =>
	billingPeriod && billingPeriod !== BILLING_PERIOD.ONETIME ? billingPeriod : BILLING_PERIOD.MONTHLY;

const UsagePricingForm: FC<Props> = ({
	onAdd,
	onUpdate,
	onEditClicked,
	onDeleteClicked,
	price,
	entityType = PRICE_ENTITY_TYPE.PLAN,
	entityId,
	onMeterChange,
	formFooter,
	isSaving = false,
}) => {
	const { t } = useTranslation(['catalog', 'common']);
	const [currency, setCurrency] = useState(price.currency || currencyOptions[0].value);
	const [priceUnitType, setPriceUnitType] = useState<PRICE_UNIT_TYPE>(price.price_unit_type || PRICE_UNIT_TYPE.FIAT);
	const [priceUnitConfig, setPriceUnitConfig] = useState(price.price_unit_config);
	const [billingModel, setBillingModel] = useState(price.billing_model || billingModels[0].value);
	const [selectedFeature, setSelectedFeature] = useState<Feature | undefined>(undefined);
	const [groupId, setGroupId] = useState<string | undefined>(price.group_id);
	const [displayName, setDisplayName] = useState<string>(price.display_name || '');
	const [tieredPrices, setTieredPrices] = useState<PriceTier[]>([
		{ from: 0, up_to: 1, unit_amount: '', flat_amount: '0' },
		{ from: 1, up_to: null, unit_amount: '', flat_amount: '0' },
	]);
	const [billingPeriod, setBillingPeriod] = useState(normalizeUsageBillingPeriod(price.billing_period));
	const [flatFee, setFlatFee] = useState<string>(price.amount || '');
	const [packagedFee, setPackagedFee] = useState<{ unit: string; price: string }>({
		unit: '',
		price: '',
	});
	const [startDate, setStartDate] = useState<Date | undefined>(price.start_date ? new Date(price.start_date) : undefined);
	const [bucketSize, setBucketSize] = useState<BUCKET_SIZE | ''>(price.bucket_size ?? '');

	const [errors, setErrors] = useState<Partial<Record<keyof Price, any>>>({});
	const [inputErrors, setInputErrors] = useState({
		flatModelError: '',
		packagedModelError: '',
		tieredModelError: '',
	});

	// Query to find feature by meter_id when editing
	const { data: featuresData } = useQuery({
		queryKey: ['fetchFeatureByMeterId', price.meter_id],
		queryFn: async () => {
			if (!price.meter_id) return null;
			const features = await FeatureApi.listFeatures({
				status: ENTITY_STATUS.PUBLISHED,
				meter_ids: [price.meter_id],
			});
			return features.items[0] || null;
		},
		enabled: !!price.meter_id && price.internal_state === PriceInternalState.EDIT,
	});

	// Get the current currency/price unit value for the selector
	const currencyPriceUnitValue = useMemo(() => {
		if (priceUnitType === PRICE_UNIT_TYPE.CUSTOM && priceUnitConfig?.price_unit) {
			return priceUnitConfig.price_unit;
		}
		return currency;
	}, [currency, priceUnitType, priceUnitConfig]);

	// Get currency symbol for display
	const displayCurrencySymbol = useMemo(() => {
		if (priceUnitType === PRICE_UNIT_TYPE.CUSTOM && priceUnitConfig?.price_unit) {
			return priceUnitConfig.price_unit; // Return price unit code (e.g., "BTC", "TOK")
		}
		return getCurrencySymbol(currency || ''); // Return currency symbol for FIAT
	}, [currency, priceUnitType, priceUnitConfig]);

	// Handle currency/price unit selection
	const handleCurrencyPriceUnitChange = (selection: CurrencyPriceUnitSelection) => {
		if (selection.type === PRICE_UNIT_TYPE.FIAT) {
			// Currency selected (FIAT)
			setCurrency(selection.data.code);
			setPriceUnitType(PRICE_UNIT_TYPE.FIAT);
			setPriceUnitConfig(undefined);
		} else if (selection.type === PRICE_UNIT_TYPE.CUSTOM && isPriceUnitOption(selection.data)) {
			// Price unit selected (CUSTOM)
			setCurrency(selection.data.base_currency);
			setPriceUnitType(PRICE_UNIT_TYPE.CUSTOM);
			setPriceUnitConfig({
				price_unit: selection.data.code,
			});
		}
	};

	// Load price data when editing
	useEffect(() => {
		if (price.internal_state === PriceInternalState.EDIT) {
			setCurrency(price.currency || currencyOptions[0].value);
			setPriceUnitType(price.price_unit_type || PRICE_UNIT_TYPE.FIAT);
			setPriceUnitConfig(price.price_unit_config);
			setBillingModel(price.billing_model || billingModels[0].value);
			// Set display_name from price or feature name (will be set when feature is loaded)
			setDisplayName(price.display_name || '');
			setBillingPeriod(normalizeUsageBillingPeriod(price.billing_period));
			setStartDate(price.start_date ? new Date(price.start_date) : undefined);
			setBucketSize(price.bucket_size ?? '');

			if (price.billing_model === BILLING_MODEL.FLAT_FEE) {
				setFlatFee(price.amount || '');
			} else if (price.billing_model === BILLING_MODEL.PACKAGE) {
				setPackagedFee({
					price: price.amount || '',
					unit: price.transform_quantity?.divide_by?.toString() || '',
				});
			} else if (price.billing_model === BILLING_MODEL.TIERED && Array.isArray(price.tiers)) {
				setTieredPrices(normalizeTiers(price.tiers as unknown as TieredPrice[]));

				// Set the appropriate billing model based on tier_mode
				if (price.tier_mode === TIER_MODE.SLAB) {
					setBillingModel(billingModels[3].value); // SLAB_TIERED
				} else {
					setBillingModel(billingModels[2].value); // Volume Tiered (default)
				}
			}
		}
	}, [price]);

	// Set selectedFeature when feature is found by meter_id
	useEffect(() => {
		if (featuresData && price.internal_state === PriceInternalState.EDIT) {
			setSelectedFeature(featuresData);
			onMeterChange?.(featuresData);
			// Set display_name from feature name if not already set
			if (!displayName && featuresData.name) {
				setDisplayName(featuresData.name);
			}
		}
	}, [featuresData, price.internal_state, onMeterChange, displayName]);

	// Update display_name when feature changes
	useEffect(() => {
		if (selectedFeature?.name && !displayName) {
			setDisplayName(selectedFeature.name);
		}
	}, [selectedFeature?.name, displayName]);

	const validate = () => {
		setErrors({});
		setInputErrors({
			flatModelError: '',
			packagedModelError: '',
			tieredModelError: '',
		});

		if (!selectedFeature?.meter_id) {
			setErrors((prev) => ({ ...prev, meter_id: 'Feature is required' }));
			return false;
		}

		// Tiered pricing validation
		if (billingModel === billingModels[2].value || billingModel === billingModels[3].value) {
			// Check if tiers are provided
			if (tieredPrices.length === 0) {
				setInputErrors((prev) => ({
					...prev,
					tieredModelError: 'Tiers are required when billing model is TIERED',
				}));
				toast.error('Tiers are required when billing model is TIERED');
				return false;
			}

			// Validate each tier
			for (let i = 0; i < tieredPrices.length; i++) {
				const tier = tieredPrices[i];

				// Validate unit amount is provided and valid
				if (!tier.unit_amount || tier.unit_amount.trim() === '') {
					setInputErrors((prev) => ({
						...prev,
						tieredModelError: `Unit amount is required for tier ${i + 1}`,
					}));
					toast.error(`Unit amount is required for tier ${i + 1}`);
					return false;
				}

				// Validate unit amount is a valid decimal and greater than or equal to 0
				const unitAmount = parseFloat(tier.unit_amount);
				if (isNaN(unitAmount) || unitAmount < 0) {
					setInputErrors((prev) => ({
						...prev,
						tieredModelError: `Unit amount must be greater than or equal to 0 for tier ${i + 1}`,
					}));
					toast.error(`Unit amount must be greater than or equal to 0 for tier ${i + 1}`);
					return false;
				}

				// Validate flat amount if provided
				if (tier.flat_amount && tier.flat_amount.trim() !== '') {
					const flatAmount = parseFloat(tier.flat_amount);
					if (isNaN(flatAmount) || flatAmount < 0) {
						setInputErrors((prev) => ({
							...prev,
							tieredModelError: `Flat amount must be greater than or equal to 0 for tier ${i + 1}`,
						}));
						toast.error(`Flat amount must be greater than or equal to 0 for tier ${i + 1}`);
						return false;
					}
				}

				// Every non-last tier must have a real numeric boundary - VolumeTieredPricingForm allows
				// the field to sit empty transiently while the user is retyping it (backspace, then
				// digits), so an empty string can still be here if they navigate away before finishing.
				const isLastTier = i === tieredPrices.length - 1;
				if (!isLastTier && typeof tier.up_to !== 'number') {
					setInputErrors((prev) => ({
						...prev,
						tieredModelError: `Up to value is required for tier ${i + 1}`,
					}));
					toast.error(`Up to value is required for tier ${i + 1}`);
					return false;
				}

				// Validate tier ranges
				if (typeof tier.up_to === 'number') {
					if (tier.from > tier.up_to) {
						setInputErrors((prev) => ({
							...prev,
							tieredModelError: `From value cannot be greater than up to in tier ${i + 1}`,
						}));
						toast.error(`From value cannot be greater than up to in tier ${i + 1}`);
						return false;
					}
				}
			}
		}

		// Package pricing validation
		if (billingModel === billingModels[1].value) {
			if (packagedFee.price === '' || packagedFee.unit === '') {
				setInputErrors((prev) => ({ ...prev, packagedModelError: 'Invalid package fee' }));
				return false;
			}

			// Validate package price is a valid decimal
			const packagePrice = parseFloat(packagedFee.price);
			if (isNaN(packagePrice) || packagePrice < 0) {
				setInputErrors((prev) => ({ ...prev, packagedModelError: 'Package price must be a valid number greater than or equal to 0' }));
				return false;
			}

			// Validate package unit is a valid integer greater than 0
			const packageUnit = parseInt(packagedFee.unit);
			if (isNaN(packageUnit) || packageUnit <= 0) {
				setInputErrors((prev) => ({ ...prev, packagedModelError: 'Package unit must be a valid number greater than 0' }));
				return false;
			}
		}

		// Flat fee validation
		if (billingModel === billingModels[0].value) {
			if (!flatFee || flatFee.trim() === '') {
				setInputErrors((prev) => ({ ...prev, flatModelError: 'Flat fee is required' }));
				return false;
			}

			const flatFeeAmount = parseFloat(flatFee);
			if (isNaN(flatFeeAmount) || flatFeeAmount < 0) {
				setInputErrors((prev) => ({ ...prev, flatModelError: 'Flat fee must be a valid number greater than or equal to 0' }));
				return false;
			}
		}

		return true;
	};

	const handleCancel = () => {
		if (price.internal_state === PriceInternalState.EDIT) {
			onDeleteClicked();
		} else {
			onDeleteClicked();
		}
	};

	const handleSubmit = () => {
		if (!validate()) return;

		// Build price_unit_config for custom price units based on billing model
		let finalPriceUnitConfig = priceUnitConfig;
		if (priceUnitType === PRICE_UNIT_TYPE.CUSTOM && priceUnitConfig) {
			if (billingModel === billingModels[0].value) {
				// FLAT_FEE: Set amount in price_unit_config
				finalPriceUnitConfig = {
					...priceUnitConfig,
					amount: flatFee,
				};
			} else if (billingModel === billingModels[1].value) {
				// PACKAGE: Set amount in price_unit_config
				finalPriceUnitConfig = {
					...priceUnitConfig,
					amount: packagedFee.price,
				};
			} else if (billingModel === billingModels[2].value || billingModel === billingModels[3].value) {
				// TIERED: Set price_unit_tiers in price_unit_config
				finalPriceUnitConfig = {
					...priceUnitConfig,
					price_unit_tiers: tieredPrices.map((tier) => ({
						up_to: tier.up_to ?? null,
						unit_amount: tier.unit_amount || '0',
						flat_amount: tier.flat_amount || '0',
					})),
				};
			}
		}

		const basePrice: Partial<Price> = {
			meter_id: selectedFeature?.meter_id || '',
			meter: selectedFeature?.meter || undefined,
			currency,
			price_unit_type: priceUnitType,
			price_unit_config: finalPriceUnitConfig,
			billing_period: billingPeriod,
			billing_model: billingModel as BILLING_MODEL,
			type: PRICE_TYPE.USAGE,
			billing_period_count: 1,
			invoice_cadence: INVOICE_CADENCE.ARREAR,
			entity_type: entityType,
			entity_id: entityId || '',
			group_id: groupId,
			start_date: startDate ? startDate.toISOString() : undefined,
			display_name: displayName || selectedFeature?.name || '',
			bucket_size: bucketSize || undefined,
		};

		let finalPrice: Partial<Price>;

		if (billingModel === billingModels[0].value) {
			// FLAT_FEE: For FIAT, set amount directly; for CUSTOM, amount is in price_unit_config
			finalPrice = {
				...basePrice,
				...(priceUnitType === PRICE_UNIT_TYPE.FIAT ? { amount: flatFee } : {}),
			};
		} else if (billingModel === billingModels[1].value) {
			// PACKAGE: For FIAT, set amount directly; for CUSTOM, amount is in price_unit_config
			finalPrice = {
				...basePrice,
				...(priceUnitType === PRICE_UNIT_TYPE.FIAT ? { amount: packagedFee.price } : {}),
				transform_quantity: {
					divide_by: Number(packagedFee.unit),
				},
			};
		} else if (billingModel === billingModels[2].value || billingModel === billingModels[3].value) {
			// TIERED: For FIAT, set tiers and tier_mode directly; for CUSTOM, tiers are in price_unit_config
			finalPrice = {
				...basePrice,
				billing_model: BILLING_MODEL.TIERED,
				...(priceUnitType === PRICE_UNIT_TYPE.FIAT
					? {
							tiers: tieredPrices.map((tier) => ({
								from: tier.from,
								up_to: tier.up_to ?? null,
								unit_amount: tier.unit_amount || '0',
								flat_amount: tier.flat_amount || '0',
							})) as unknown as NonNullable<Price['tiers']>,
							tier_mode: billingModel === billingModels[2].value ? TIER_MODE.VOLUME : TIER_MODE.SLAB,
						}
					: {}),
			};
		} else {
			// Default case - should not happen with current billing models
			finalPrice = basePrice;
		}
		// If we're editing an existing price, preserve its ID and other important fields
		if (price.internal_state === PriceInternalState.EDIT) {
			// Exclude amount, tiers, and tier_mode from price spread when price_unit_type is CUSTOM
			const { amount: _, tiers: __, tier_mode: ___, ...priceWithoutAmountTiers } = price;

			const finalPriceWithEdit: InternalPrice = {
				...(priceUnitType === PRICE_UNIT_TYPE.CUSTOM ? priceWithoutAmountTiers : price),
				...finalPrice,
				type: PRICE_TYPE.USAGE,
				meter_id: selectedFeature?.meter_id || price.meter_id || '',
				meter: selectedFeature?.meter || price.meter,
				internal_state: PriceInternalState.SAVED,
				// Sanitize: explicitly set amount, tiers, and tier_mode to undefined when price_unit_type is CUSTOM
				...(priceUnitType === PRICE_UNIT_TYPE.CUSTOM
					? {
							amount: undefined,
							tiers: undefined,
							tier_mode: undefined,
						}
					: {}),
			};

			onUpdate(finalPriceWithEdit);
		} else {
			onAdd({
				...finalPrice,
				internal_state: PriceInternalState.SAVED,
				// Sanitize: explicitly set amount, tiers, and tier_mode to undefined when price_unit_type is CUSTOM
				...(priceUnitType === PRICE_UNIT_TYPE.CUSTOM
					? {
							amount: undefined,
							tiers: undefined,
							tier_mode: undefined,
						}
					: {}),
			} as InternalPrice);
		}
	};

	if (price.internal_state === PriceInternalState.SAVED) {
		return (
			<div className='mb-2 space-y-2'>
				<UsageChargePreview charge={price} index={0} onEdit={onEditClicked} onDelete={onDeleteClicked} />
			</div>
		);
	}

	return (
		<div className='card mb-2'>
			<Spacer height={'8px'} />
			<SelectFeature
				featureTypes={[FEATURE_TYPE.METERED]}
				error={errors.meter_id}
				onChange={(feature) => {
					if (feature) {
						setSelectedFeature(feature);
						onMeterChange?.(feature);
						// Auto-fill display_name with feature name if empty
						if (!displayName) {
							setDisplayName(feature.name);
						}
					} else {
						setSelectedFeature(undefined);
						onMeterChange?.(null);
					}
				}}
				value={selectedFeature?.id}
				label={t('catalog:plans.organisms.usageForm.feature')}
				placeholder={t('catalog:plans.organisms.usageForm.selectMeteredFeature')}
			/>
			<Spacer height='8px' />
			<Input
				onChange={(value) => setDisplayName(value)}
				value={displayName}
				variant='text'
				label={t('catalog:plans.organisms.priceForm.displayName')}
				placeholder={selectedFeature?.name || t('catalog:plans.organisms.priceForm.enterDisplayName')}
				error={errors.display_name}
			/>
			<Spacer height='8px' />

			<CurrencyPriceUnitSelector
				value={currencyPriceUnitValue}
				onChange={handleCurrencyPriceUnitChange}
				label={t('catalog:plans.organisms.priceForm.currency')}
				error={errors.currency}
			/>
			<Spacer height='8px' />
			<Select
				value={billingPeriod}
				options={billlingPeriodOptions.filter((option) => option.value !== BILLING_PERIOD.ONETIME)}
				onChange={(value) => {
					setBillingPeriod(value as BILLING_PERIOD);
				}}
				label={t('catalog:plans.organisms.priceForm.billingPeriod')}
				placeholder={t('catalog:plans.organisms.usageForm.selectBillingPeriod')}
				error={errors.billing_period}
			/>
			<Spacer height={'8px'} />

			<Select
				value={billingModel}
				options={billingModels}
				onChange={setBillingModel}
				label={t('catalog:plans.organisms.usageForm.billingModel')}
				error={errors.billing_model}
				placeholder={t('catalog:plans.organisms.usageForm.billingModelPlaceholder')}
			/>
			<Spacer height='8px' />

			<Select
				value={bucketSize}
				options={priceBucketSizeOptions}
				onChange={(value) => setBucketSize(value as BUCKET_SIZE)}
				label={t('catalog:plans.organisms.usageForm.bucketSize')}
				placeholder={t('catalog:plans.organisms.usageForm.bucketSizePlaceholder')}
				description={t('catalog:plans.organisms.usageForm.bucketSizeDescription')}
			/>
			<Spacer height='8px' />

			{billingModel === billingModels[0].value && (
				<div className='space-y-2'>
					<Input
						placeholder={t('catalog:plans.organisms.usageForm.amountPlaceholder')}
						variant='formatted-number'
						error={inputErrors.flatModelError}
						label={t('catalog:plans.organisms.priceForm.price')}
						value={flatFee}
						inputPrefix={displayCurrencySymbol}
						onChange={(e) => {
							// Validate decimal input
							const decimalRegex = /^\d*\.?\d*$/;
							if (decimalRegex.test(e) || e === '') {
								setFlatFee(e);
							}
						}}
						suffix={<span className='text-content-slate-muted'>{`/ unit / ${formatBillingPeriodForPrice(billingPeriod)}`}</span>}
					/>
				</div>
			)}

			{billingModel === billingModels[1].value && (
				<div className='space-y-1'>
					<div className='flex w-full gap-2 items-end'>
						<Input
							variant='formatted-number'
							label={t('catalog:plans.organisms.priceForm.price')}
							placeholder={t('catalog:plans.organisms.usageForm.amountPlaceholder')}
							value={packagedFee.price}
							inputPrefix={displayCurrencySymbol}
							onChange={(e) => {
								// Validate decimal input
								const decimalRegex = /^\d*\.?\d*$/;
								if (decimalRegex.test(e) || e === '') {
									setPackagedFee({ ...packagedFee, price: e });
								}
							}}
						/>
						<div className='h-[50px] items-center flex gap-2'>
							<p className='text-content-zinc-bold font-medium'>{t('catalog:plans.organisms.usageForm.per')}</p>
						</div>
						<Input
							value={packagedFee.unit}
							variant='integer'
							placeholder='0'
							onChange={(e) => {
								// Validate integer input
								const integerRegex = /^\d*$/;
								if (integerRegex.test(e) || e === '') {
									setPackagedFee({
										...packagedFee,
										unit: e,
									});
								}
							}}
							suffix={`/ units / ${formatBillingPeriodForPrice(billingPeriod)}`}
						/>
					</div>
					{inputErrors.packagedModelError && <p className='text-danger-bright text-sm'>{inputErrors.packagedModelError}</p>}
				</div>
			)}

			{(billingModel === billingModels[2].value || billingModel === billingModels[3].value) && (
				<div className='space-y-2'>
					<Spacer height='8px' />
					<VolumeTieredPricingForm
						setTieredPrices={setTieredPrices}
						tieredPrices={tieredPrices}
						currency={priceUnitType === PRICE_UNIT_TYPE.CUSTOM ? priceUnitConfig?.price_unit || currency : currency}
						tierMode={billingModel === billingModels[2].value ? TIER_MODE.VOLUME : TIER_MODE.SLAB}
					/>
					{inputErrors.tieredModelError && <p className='text-danger-bright text-sm'>{inputErrors.tieredModelError}</p>}
				</div>
			)}
			<Spacer height='8px' />
			<SelectGroup
				value={groupId}
				onChange={(group: Group | null) => setGroupId(group?.id)}
				label={t('catalog:plans.organisms.priceForm.group')}
				placeholder={t('catalog:plans.organisms.priceForm.groupPlaceholder')}
				description={t('catalog:plans.organisms.priceForm.groupDescription')}
				showLookupKey={false}
				hiddenIfEmpty
			/>
			<Spacer height={'16px'} />
			{/* <Spacer height='12px' /> */}
			{/* <CheckboxRadioGroup
				title='Billing timing'
				value={invoiceCadence}
				checkboxItems={[
					{
						label: 'Advance',
						value: 'ADVANCE',
						description: 'Charge at the start of each billing cycle.',
						disabled: true,
					},
					{
						label: 'Arrear',
						value: 'ARREAR',
						description: 'Charge at the end of the billing cycle.',
					},
				]}
				onChange={(value) => {
					setInvoiceCadence(value);
				}}
				error={inputErrors.invoiceCadenceError}
			/> */}
			<Spacer height={'16px'} />
			<DatePicker
				date={startDate}
				popoverTriggerClassName='w-full'
				className='w-full'
				popoverClassName='w-full'
				popoverContentClassName='w-full'
				setDate={setStartDate}
				label={t('catalog:plans.organisms.priceForm.startDateOptional')}
				placeholder={t('catalog:plans.organisms.priceForm.selectStartDate')}
			/>

			{formFooter}

			<Spacer height={'16px'} />
			<div className='flex justify-end'>
				<Button onClick={handleCancel} variant='secondary' className='me-4 text-content-zinc-bold' disabled={isSaving}>
					{price.internal_state === PriceInternalState.EDIT ? t('common:actions.delete') : t('common:actions.cancel')}
				</Button>
				<Button onClick={handleSubmit} variant='default' className='me-4 font-normal' isLoading={isSaving} disabled={isSaving}>
					{price.internal_state === PriceInternalState.EDIT ? t('common:actions.update') : t('common:actions.add')}
				</Button>
			</div>
		</div>
	);
};

export default UsagePricingForm;
