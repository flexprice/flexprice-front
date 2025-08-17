import { FC, useState, useEffect } from 'react';
import { Button, CheckboxRadioGroup, Input, Select, SelectOption, Spacer } from '@/components/atoms';
import { CurrencySelector } from '@/components/molecules';
import SelectMeter from './SelectMeter';
import { Meter } from '@/models/Meter';
import { formatBillingPeriodForPrice, getCurrencySymbol } from '@/utils/common/helper_functions';
import { billlingPeriodOptions, currencyOptions } from '@/constants/constants';
import VolumeTieredPricingForm from './VolumeTieredPricingForm';
import UsageChargePreview from './UsageChargePreview';
import { toast } from 'react-hot-toast';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_MODEL, TIER_MODE, PRICE_ENTITY_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { BILLING_PERIOD, PRICE_TYPE } from '@/models/Price';
import { PriceUnit } from '@/models/PriceUnit';
import { ENTITY_STATUS } from '@/models/base';
import { InternalPrice } from '../EntityChargesPage/EntityChargesPage';

interface Props {
	onAdd: (price: InternalPrice) => void;
	onUpdate: (price: InternalPrice) => void;
	onEditClicked: () => void;
	onDeleteClicked: () => void;
	price: Partial<InternalPrice>;
	entityType?: PRICE_ENTITY_TYPE;
	entityId?: string;
}

export interface PriceTier {
	from: number;
	up_to: number | null;
	flat_amount?: string;
	unit_amount?: string;
}

export enum PriceInternalState {
	EDIT = 'edit',
	NEW = 'new',
	SAVED = 'saved',
}
interface TieredPrice {
	from: number;
	up_to: number | null;
	unit_amount: string;
	flat_amount: string;
}

const billingModels: SelectOption[] = [
	{ value: BILLING_MODEL.FLAT_FEE, label: 'Flat Fee' },
	{ value: BILLING_MODEL.PACKAGE, label: 'Package' },
	{ value: BILLING_MODEL.TIERED, label: 'Volume Tiered' },
];

const UsagePricingForm: FC<Props> = ({
	onAdd,
	onUpdate,
	onEditClicked,
	onDeleteClicked,
	price,
	entityType = PRICE_ENTITY_TYPE.PLAN,
	entityId,
}) => {
	const [currency, setCurrency] = useState(price.currency || currencyOptions[0].value);
	const [selectedPricingUnit, setSelectedPricingUnit] = useState<PriceUnit | undefined>();
	const [billingModel, setBillingModel] = useState(price.billing_model || billingModels[0].value);
	const [meterId, setMeterId] = useState<string>(price.meter_id || '');
	const [activeMeter, setActiveMeter] = useState<Meter | null>(price.meter || null);
	const [tieredPrices, setTieredPrices] = useState<PriceTier[]>([
		{ from: 1, up_to: 1, unit_amount: '', flat_amount: '0' },
		{ from: 2, up_to: null, unit_amount: '', flat_amount: '0' },
	]);
	const [billingPeriod, setBillingPeriod] = useState(price.billing_period || billlingPeriodOptions[1].value);
	const [flatFee, setFlatFee] = useState<string>(price.amount || '');
	const [packagedFee, setPackagedFee] = useState<{ unit: string; price: string }>({
		unit: '',
		price: '',
	});

	const [errors, setErrors] = useState<Partial<Record<keyof InternalPrice, any>>>({});
	const [inputErrors, setInputErrors] = useState({
		flatModelError: '',
		packagedModelError: '',
		tieredModelError: '',
		invoiceCadenceError: '',
	});

	const [invoiceCadence, setInvoiceCadence] = useState(INVOICE_CADENCE.ARREAR);

	// Load price data when editing
	useEffect(() => {
		if (price.internal_state === 'edit') {
			setCurrency(price.currency || currencyOptions[0].value);
			setSelectedPricingUnit(price.pricing_unit);
			setBillingModel(price.billing_model || billingModels[0].value);
			setMeterId(price.meter_id || '');
			if (price.meter) {
				setActiveMeter({
					id: price.meter.id,
					name: price.meter.name,
				} as Meter);
			}
			setBillingPeriod(price.billing_period || billlingPeriodOptions[1].value);

			if (price.billing_model === BILLING_MODEL.FLAT_FEE) {
				setFlatFee(price.amount || '');
			} else if (price.billing_model === BILLING_MODEL.PACKAGE) {
				setPackagedFee({
					price: price.amount || '',
					unit: (price.transform_quantity as any)?.divide_by?.toString() || '',
				});
			} else if (price.billing_model === BILLING_MODEL.TIERED && Array.isArray(price.tiers)) {
				setTieredPrices(
					(price.tiers as unknown as TieredPrice[]).map((tier) => ({
						from: tier.from,
						up_to: tier.up_to,
						unit_amount: tier.unit_amount,
						flat_amount: tier.flat_amount,
					})),
				);
			}
		}
	}, [price]);

	const validate = () => {
		setErrors({});
		setInputErrors({
			flatModelError: '',
			packagedModelError: '',
			tieredModelError: '',
			invoiceCadenceError: '',
		});

		if (!meterId) {
			setErrors((prev) => ({ ...prev, meter_id: 'Feature is required' }));
			return false;
		}

		// Tiered pricing validation
		if (billingModel === billingModels[2].value) {
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

				// Validate unit amount is a valid decimal and greater than 0
				const unitAmount = parseFloat(tier.unit_amount);
				if (isNaN(unitAmount) || unitAmount <= 0) {
					setInputErrors((prev) => ({
						...prev,
						tieredModelError: `Unit amount must be greater than 0 for tier ${i + 1}`,
					}));
					toast.error(`Unit amount must be greater than 0 for tier ${i + 1}`);
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

				// Validate tier ranges
				if (tier.up_to !== null) {
					if (tier.from > tier.up_to) {
						setInputErrors((prev) => ({
							...prev,
							tieredModelError: `From value cannot be greater than up to in tier ${i + 1}`,
						}));
						toast.error(`From value cannot be greater than up to in tier ${i + 1}`);
						return false;
					}
				}

				// Check for overlapping tiers (except for the last tier which can have up_to as null)
				if (i < tieredPrices.length - 1 && tier.up_to !== null) {
					const nextTier = tieredPrices[i + 1];
					if (tier.up_to >= nextTier.from) {
						setInputErrors((prev) => ({
							...prev,
							tieredModelError: `Tier ${i + 1} overlaps with tier ${i + 2}`,
						}));
						toast.error(`Tier ${i + 1} overlaps with tier ${i + 2}`);
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
		if (price.internal_state === 'edit') {
			onDeleteClicked();
		} else {
			onDeleteClicked();
		}
	};

	const handleSubmit = () => {
		if (!validate()) return;

		// Determine the currency to send to backend
		const backendCurrency = selectedPricingUnit ? selectedPricingUnit.base_currency : currency;

		const basePrice: Partial<InternalPrice> = {
			meter_id: meterId,
			meter: activeMeter || undefined,
			currency: backendCurrency,
			billing_period: billingPeriod,
			billing_model: billingModel as BILLING_MODEL,
			type: PRICE_TYPE.USAGE,
			billing_period_count: 1,
			billing_cadence: BILLING_CADENCE.RECURRING,
			invoice_cadence: invoiceCadence as INVOICE_CADENCE,
			entity_type: entityType,
			entity_id: entityId || '',
			price_unit_type: selectedPricingUnit ? PRICE_UNIT_TYPE.CUSTOM : PRICE_UNIT_TYPE.FIAT,
			price_unit_config: selectedPricingUnit
				? {
						price_unit: selectedPricingUnit.code,
					}
				: undefined,
			pricing_unit: selectedPricingUnit,
		};

		let finalPrice: Partial<InternalPrice>;

		if (billingModel === billingModels[0].value) {
			if (selectedPricingUnit) {
				// For custom price units, put amount in price_unit_config
				finalPrice = {
					...basePrice,
					price_unit_config: {
						price_unit: selectedPricingUnit.code,
						amount: flatFee,
					},
				};
			} else {
				finalPrice = {
					...basePrice,
					amount: flatFee,
				};
			}
		} else if (billingModel === billingModels[1].value) {
			if (selectedPricingUnit) {
				// For custom price units, put amount in price_unit_config
				finalPrice = {
					...basePrice,
					amount: undefined, // Set to undefined since amount is in price_unit_config
					transform_quantity: {
						divide_by: Number(packagedFee.unit),
					},
					price_unit_config: {
						price_unit: selectedPricingUnit.code,
						amount: packagedFee.price,
					},
				};
			} else {
				finalPrice = {
					...basePrice,
					amount: packagedFee.price,
					transform_quantity: {
						divide_by: Number(packagedFee.unit),
					},
				};
			}
		} else {
			const adjustedTiers = tieredPrices.map((tier, index, array) => {
				if (!tier.up_to && index < array.length - 1) {
					const nextTier = array[index + 1];
					return {
						...tier,
						up_to: nextTier?.up_to ? nextTier.up_to - 1 : null,
					};
				}
				return tier;
			});

			if (selectedPricingUnit) {
				// For custom price units, put tiers in price_unit_config
				finalPrice = {
					...basePrice,
					tier_mode: TIER_MODE.VOLUME,
					price_unit_config: {
						price_unit: selectedPricingUnit.code,
						price_unit_tiers: adjustedTiers.map((tier) => ({
							up_to: tier.up_to ?? undefined,
							unit_amount: tier.unit_amount || '0',
							flat_amount: tier.flat_amount || '0',
						})),
					},
				};
			} else {
				finalPrice = {
					...basePrice,
					tiers: adjustedTiers.map((tier) => ({
						from: tier.from,
						up_to: tier.up_to ?? null,
						unit_amount: tier.unit_amount || '0',
						flat_amount: tier.flat_amount || '0',
					})) as unknown as NonNullable<InternalPrice['tiers']>,
					tier_mode: TIER_MODE.VOLUME,
				};
			}
		}
		// If we're editing an existing price, preserve its ID and other important fields
		if (price.internal_state === 'edit') {
			const finalPriceWithEdit: InternalPrice = {
				...price,
				...finalPrice,
				type: PRICE_TYPE.USAGE,
				meter_id: meterId,
				meter: activeMeter || price.meter,
				internal_state: PriceInternalState.SAVED,
				pricing_unit: selectedPricingUnit,
			};
			onUpdate(finalPriceWithEdit);
		} else {
			onAdd({
				...finalPrice,
				internal_state: PriceInternalState.SAVED,
				pricing_unit: selectedPricingUnit,
			} as InternalPrice);
		}
	};

	if (price.internal_state === 'saved') {
		return (
			<div className='mb-2 space-y-2'>
				<UsageChargePreview index={0} charge={price} onEdit={onEditClicked} onDelete={onDeleteClicked} pricingUnit={selectedPricingUnit} />
			</div>
		);
	}

	return (
		<div className='card mb-2'>
			<Spacer height={'8px'} />
			<SelectMeter
				error={errors.meter_id}
				onChange={(meter) => {
					setMeterId(meter.id);
					setActiveMeter(meter);
				}}
				value={meterId}
			/>
			<Spacer height='8px' />
			<CurrencySelector
				value={currency}
				label='Currency'
				onChange={(value, option) => {
					setCurrency(value);
					// Extract PriceUnit from CurrencyOption if it's a custom currency
					if (option?.currencyType === PRICE_UNIT_TYPE.CUSTOM && option.extras?.priceUnitId) {
						// We'll need to fetch the PriceUnit details here
						// For now, we'll create a basic PriceUnit object
						const pricingUnit: PriceUnit = {
							id: option.extras.priceUnitId,
							name: option.label,
							code: option.value,
							symbol: option.symbol || '',
							base_currency: option.extras.baseCurrency || '',
							conversion_rate: option.extras.conversionRate || 1,
							precision: option.extras.precision || 2,
							environment_id: '',
							created_at: '',
							updated_at: '',
							created_by: '',
							updated_by: '',
							tenant_id: '',
							status: ENTITY_STATUS.PUBLISHED,
						};
						setSelectedPricingUnit(pricingUnit);
					} else {
						setSelectedPricingUnit(undefined);
					}
				}}
				placeholder='Select currency'
				error={errors.currency}
			/>
			<Spacer height='8px' />
			<Select
				value={billingPeriod}
				options={billlingPeriodOptions}
				onChange={(value) => {
					setBillingPeriod(value as BILLING_PERIOD);
				}}
				label='Billing Period'
				placeholder='Select The Billing Period'
				error={errors.billing_period}
			/>
			<Spacer height={'8px'} />

			<Select
				value={billingModel}
				options={billingModels}
				onChange={setBillingModel}
				label='Billing Model'
				error={errors.billing_model}
				placeholder='Billing Model'
			/>
			<Spacer height='8px' />

			{billingModel === billingModels[0].value && (
				<div className='space-y-2'>
					<Input
						placeholder='0.00'
						variant='formatted-number'
						error={inputErrors.flatModelError}
						label='Price'
						value={flatFee}
						inputPrefix={selectedPricingUnit?.symbol || getCurrencySymbol(currency)}
						onChange={(e) => {
							// Validate decimal input
							const decimalRegex = /^\d*\.?\d*$/;
							if (decimalRegex.test(e) || e === '') {
								setFlatFee(e);
							}
						}}
						suffix={<span className='text-[#64748B]'>{`/ unit / ${formatBillingPeriodForPrice(billingPeriod)}`}</span>}
					/>
				</div>
			)}

			{billingModel === billingModels[1].value && (
				<div className='space-y-1'>
					<div className='flex w-full gap-2 items-end'>
						<Input
							variant='formatted-number'
							label='Price'
							placeholder='0.00'
							value={packagedFee.price}
							inputPrefix={selectedPricingUnit?.symbol || getCurrencySymbol(currency)}
							onChange={(e) => {
								// Validate decimal input
								const decimalRegex = /^\d*\.?\d*$/;
								if (decimalRegex.test(e) || e === '') {
									setPackagedFee({ ...packagedFee, price: e });
								}
							}}
						/>
						<div className='h-[50px] items-center flex gap-2'>
							<p className='text-[#18181B] font-medium'>per</p>
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
					{inputErrors.packagedModelError && <p className='text-red-500 text-sm'>{inputErrors.packagedModelError}</p>}
				</div>
			)}

			{billingModel === billingModels[2].value && (
				<div className='space-y-2'>
					<VolumeTieredPricingForm
						setTieredPrices={setTieredPrices}
						tieredPrices={tieredPrices}
						currency={currency}
						pricingUnit={selectedPricingUnit}
					/>
					{inputErrors.tieredModelError && <p className='text-red-500 text-sm'>{inputErrors.tieredModelError}</p>}
				</div>
			)}

			<Spacer height='16px' />
			<CheckboxRadioGroup
				title='Billing timing'
				value={invoiceCadence}
				checkboxItems={[
					{
						label: 'Advance',
						value: INVOICE_CADENCE.ADVANCE,
						description: 'Charge at the start of each billing cycle.',
						disabled: true,
					},
					{
						label: 'Arrear',
						value: INVOICE_CADENCE.ARREAR,
						description: 'Charge at the end of the billing cycle.',
					},
				]}
				onChange={(value) => {
					setInvoiceCadence(value as INVOICE_CADENCE);
				}}
				error={inputErrors.invoiceCadenceError}
			/>
			<Spacer height={'16px'} />
			<Spacer height='16px' />
			<div className='flex justify-end'>
				<Button onClick={handleCancel} variant='secondary' className='mr-4 text-zinc-900'>
					{price.internal_state === 'edit' ? 'Delete' : 'Cancel'}
				</Button>
				<Button onClick={handleSubmit} variant='default' className='mr-4 font-normal'>
					{price.internal_state === 'edit' ? 'Update' : 'Add'}
				</Button>
			</div>
		</div>
	);
};

export default UsagePricingForm;
