import { useState, useEffect, useMemo } from 'react';
import { formatBillingPeriodForPrice, getCurrencySymbol } from '@/utils/common/helper_functions';
import { billlingPeriodOptions } from '@/constants/constants';
import { InternalPrice } from './SetupChargesSection';
import type { CreatePriceTier } from '@/models/Price';
import { PriceInternalState, PriceTier, billingModels } from './UsagePricingForm';
import VolumeTieredPricingForm from './VolumeTieredPricingForm';
import { CheckboxRadioGroup, FormHeader, Input, Spacer, Button, Select, DatePicker } from '@/components/atoms';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import RecurringChargePreview from './RecurringChargePreview';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD, PRICE_ENTITY_TYPE, PRICE_TYPE, PRICE_UNIT_TYPE, BILLING_MODEL, TIER_MODE } from '@/models/Price';
import SelectGroup from './SelectGroup';
import { Group } from '@/models/Group';
import { CurrencyPriceUnitSelector } from '@/components/molecules';
import { CurrencyPriceUnitSelection, isPriceUnitOption } from '@/types/common';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calculator } from 'lucide-react';
import { SubscriptionCalculatorContent } from '@/components/organisms/EntityChargesPage/SubscriptionCalculator';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Props {
	price: Partial<InternalPrice>;
	onAdd: (price: Partial<InternalPrice>) => void;
	onUpdate: (price: Partial<InternalPrice>) => void;
	onEditClicked: () => void;
	onDeleteClicked: () => void;
	entityType?: PRICE_ENTITY_TYPE;
	entityId?: string;
	entityName?: string;
	isSaving?: boolean;
}

// Tiers used when a tiered fixed charge form is first opened
const getDefaultTiers = (): PriceTier[] => [
	{ from: 0, up_to: 1, unit_amount: '', flat_amount: '0' },
	{ from: 1, up_to: null, unit_amount: '', flat_amount: '0' },
];

type StoredPriceTier = CreatePriceTier & { from?: number };

function mapStoredTiersToFormTiers(tiers: StoredPriceTier[]): PriceTier[] {
	let tierStart = 0;
	return tiers.map((tier) => {
		const formTier: PriceTier = {
			from: tier.from ?? tierStart,
			up_to: tier.up_to ?? null,
			unit_amount: tier.unit_amount,
			flat_amount: tier.flat_amount || '0',
		};
		if (tier.up_to != null) {
			tierStart = tier.up_to;
		}
		return formTier;
	});
}

function syncBillingModelFormStateFromPrice(
	price: Partial<InternalPrice>,
	setBillingModel: (value: string) => void,
	setPackagedFee: (value: { unit: string; price: string }) => void,
	setTieredPrices: (value: PriceTier[]) => void,
) {
	setBillingModel(price.billing_model || BILLING_MODEL.FLAT_FEE);

	if (price.billing_model === BILLING_MODEL.PACKAGE) {
		const packageAmount = price.amount ?? price.price_unit_config?.amount ?? '';
		setPackagedFee({
			price: packageAmount,
			unit: price.transform_quantity?.divide_by?.toString() || '',
		});
		return;
	}

	if (price.billing_model === BILLING_MODEL.TIERED) {
		const storedTiers =
			price.tiers && price.tiers.length > 0 ? (price.tiers as unknown as StoredPriceTier[]) : price.price_unit_config?.price_unit_tiers;

		if (storedTiers?.length) {
			setTieredPrices(mapStoredTiersToFormTiers(storedTiers));
			setBillingModel(price.tier_mode === TIER_MODE.SLAB ? 'SLAB_TIERED' : BILLING_MODEL.TIERED);
		}
	}
}

const RecurringChargesForm = ({
	price,
	onAdd,
	onUpdate,
	onEditClicked,
	onDeleteClicked,
	entityType = PRICE_ENTITY_TYPE.PLAN,
	entityId,
	entityName,
	isSaving = false,
}: Props) => {
	const { t } = useTranslation(['catalog', 'common']);
	// Helper function to compute default values for price state
	const computePriceDefaults = (priceProp: Partial<InternalPrice>, entityNameProp?: string) => {
		return {
			display_name: priceProp.display_name || entityNameProp || '',
			min_quantity: priceProp.min_quantity ?? (priceProp.type === PRICE_TYPE.FIXED ? 1 : undefined),
		};
	};

	const [localPrice, setLocalPrice] = useState<Partial<InternalPrice>>(() => ({
		...price,
		...computePriceDefaults(price, entityName),
	}));
	const [startDate, setStartDate] = useState<Date | undefined>(() => (price.start_date ? new Date(price.start_date) : undefined));
	const [errors, setErrors] = useState<Partial<Record<keyof InternalPrice, string>>>({});
	const [calculatorOpen, setCalculatorOpen] = useState(false);

	// Billing-model-specific state. `billingModel` holds the selector value which may be the
	// frontend-only 'SLAB_TIERED' option (maps to TIERED with SLAB tier_mode on submit).
	const [billingModel, setBillingModel] = useState<string>(price.billing_model || BILLING_MODEL.FLAT_FEE);
	const [packagedFee, setPackagedFee] = useState<{ unit: string; price: string }>({
		unit: price.transform_quantity?.divide_by?.toString() || '',
		price: price.billing_model === BILLING_MODEL.PACKAGE ? price.amount || '' : '',
	});
	const [tieredPrices, setTieredPrices] = useState<PriceTier[]>(getDefaultTiers);
	const [modelErrors, setModelErrors] = useState({ packagedModelError: '', tieredModelError: '' });

	// Hydrate form when editing an existing charge (avoid resetting in-progress new charge edits)
	useEffect(() => {
		if (price.internal_state !== PriceInternalState.EDIT) return;

		setStartDate(price.start_date ? new Date(price.start_date) : undefined);

		setLocalPrice((prev) => {
			const updated = { ...prev, ...price };

			if (price.display_name !== undefined && price.display_name !== null) {
				updated.display_name = price.display_name;
			} else if (entityName && (!prev.display_name || prev.display_name === '')) {
				updated.display_name = entityName;
			}

			if (price.type === PRICE_TYPE.FIXED) {
				updated.min_quantity = price.min_quantity !== undefined ? price.min_quantity : (prev.min_quantity ?? 1);
			} else if (price.min_quantity !== undefined) {
				updated.min_quantity = price.min_quantity;
			}

			if (price.price_unit_type !== undefined) {
				updated.price_unit_type = price.price_unit_type;
			}
			if (price.price_unit_config !== undefined) {
				updated.price_unit_config = price.price_unit_config;
			}

			return updated;
		});

		syncBillingModelFormStateFromPrice(price, setBillingModel, setPackagedFee, setTieredPrices);
	}, [price, entityName]);

	const isPackage = billingModel === BILLING_MODEL.PACKAGE;
	const isTiered = billingModel === BILLING_MODEL.TIERED || billingModel === 'SLAB_TIERED';
	const isFlatFee = billingModel === BILLING_MODEL.FLAT_FEE;
	const isCustomUnit = localPrice.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

	// Get the current currency/price unit value for the selector
	const currencyPriceUnitValue = useMemo(() => {
		if (localPrice.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && localPrice.price_unit_config?.price_unit) {
			return localPrice.price_unit_config.price_unit;
		}
		return localPrice.currency || '';
	}, [localPrice.currency, localPrice.price_unit_type, localPrice.price_unit_config]);

	// Get currency symbol for display (currency symbol for FIAT, price unit code for CUSTOM)
	const displayCurrencySymbol = useMemo(() => {
		if (localPrice.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && localPrice.price_unit_config?.price_unit) {
			return localPrice.price_unit_config.price_unit;
		}
		return getCurrencySymbol(localPrice.currency || '');
	}, [localPrice.currency, localPrice.price_unit_type, localPrice.price_unit_config]);

	// Handle currency/price unit selection
	const handleCurrencyPriceUnitChange = (selection: CurrencyPriceUnitSelection) => {
		if (selection.type === PRICE_UNIT_TYPE.FIAT) {
			// Currency selected (FIAT)
			setLocalPrice({
				...localPrice,
				currency: selection.data.code,
				price_unit_type: PRICE_UNIT_TYPE.FIAT,
				price_unit_config: undefined,
			});
		} else if (selection.type === PRICE_UNIT_TYPE.CUSTOM && isPriceUnitOption(selection.data)) {
			// Price unit selected (CUSTOM)
			setLocalPrice({
				...localPrice,
				currency: selection.data.base_currency,
				price_unit_type: PRICE_UNIT_TYPE.CUSTOM,
				price_unit_config: {
					price_unit: selection.data.code,
				},
			});
		}
	};

	const validate = () => {
		const newErrors: Partial<Record<keyof InternalPrice, string>> = {};
		const newModelErrors = { packagedModelError: '', tieredModelError: '' };

		if (!localPrice.billing_period) {
			newErrors.billing_period = 'Billing Period is required';
		}
		if (!localPrice.currency) {
			newErrors.currency = 'Currency is required';
		}
		if (localPrice.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && !localPrice.price_unit_config?.price_unit) {
			newErrors.price_unit_config = 'Price unit is required when using custom price unit';
		}
		if (!localPrice.invoice_cadence) {
			newErrors.invoice_cadence = 'Invoice Cadence is required';
		}
		if (localPrice.isTrialPeriod && !localPrice.trial_period_days) {
			newErrors.trial_period_days = 'Trial Period is required';
		}

		if (isFlatFee && !localPrice.amount) {
			newErrors.amount = 'Price is required';
		}

		if (isPackage) {
			if (packagedFee.price === '' || packagedFee.unit === '') {
				newModelErrors.packagedModelError = 'Invalid package fee';
			} else {
				const packagePrice = parseFloat(packagedFee.price);
				const packageUnit = parseInt(packagedFee.unit);
				if (isNaN(packagePrice) || packagePrice < 0) {
					newModelErrors.packagedModelError = 'Package price must be a valid number greater than or equal to 0';
				} else if (isNaN(packageUnit) || packageUnit <= 0) {
					newModelErrors.packagedModelError = 'Package unit must be a valid number greater than 0';
				}
			}
		}

		if (isTiered) {
			if (tieredPrices.length === 0) {
				newModelErrors.tieredModelError = 'Tiers are required when billing model is TIERED';
			} else {
				for (let i = 0; i < tieredPrices.length; i++) {
					const tier = tieredPrices[i];
					if (!tier.unit_amount || tier.unit_amount.trim() === '') {
						newModelErrors.tieredModelError = `Unit amount is required for tier ${i + 1}`;
						break;
					}
					const unitAmount = parseFloat(tier.unit_amount);
					if (isNaN(unitAmount) || unitAmount < 0) {
						newModelErrors.tieredModelError = `Unit amount must be greater than or equal to 0 for tier ${i + 1}`;
						break;
					}
					if (tier.flat_amount && tier.flat_amount.trim() !== '') {
						const flatAmount = parseFloat(tier.flat_amount);
						if (isNaN(flatAmount) || flatAmount < 0) {
							newModelErrors.tieredModelError = `Flat amount must be greater than or equal to 0 for tier ${i + 1}`;
							break;
						}
					}
					if (tier.up_to !== null && tier.from > tier.up_to) {
						newModelErrors.tieredModelError = `From value cannot be greater than up to in tier ${i + 1}`;
						break;
					}
				}
			}
		}

		setErrors(newErrors);
		setModelErrors(newModelErrors);

		const modelError = newModelErrors.packagedModelError || newModelErrors.tieredModelError;
		if (modelError) toast.error(modelError);

		return Object.keys(newErrors).length === 0 && !modelError;
	};

	const handleSubmit = () => {
		if (!validate()) return;

		const resolvedBillingModel = isTiered ? BILLING_MODEL.TIERED : (billingModel as BILLING_MODEL);

		// Build the per-model amount / transform_quantity / tiers for FIAT prices
		const amount = isFlatFee ? localPrice.amount : isPackage ? packagedFee.price : undefined;
		const transformQuantity = isPackage ? { divide_by: Number(packagedFee.unit) } : undefined;
		const tiers = isTiered
			? (tieredPrices.map((tier) => ({
					from: tier.from,
					up_to: tier.up_to ?? null,
					unit_amount: tier.unit_amount || '0',
					flat_amount: tier.flat_amount || '0',
				})) as unknown as NonNullable<InternalPrice['tiers']>)
			: undefined;
		const tierMode = isTiered ? (billingModel === 'SLAB_TIERED' ? TIER_MODE.SLAB : TIER_MODE.VOLUME) : undefined;

		// Build price_unit_config for custom price units based on billing model
		let priceUnitConfig = localPrice.price_unit_config;
		if (isCustomUnit && localPrice.price_unit_config) {
			if (isFlatFee) {
				priceUnitConfig = { ...localPrice.price_unit_config, amount: localPrice.amount };
			} else if (isPackage) {
				priceUnitConfig = { ...localPrice.price_unit_config, amount: packagedFee.price };
			} else if (isTiered) {
				priceUnitConfig = {
					...localPrice.price_unit_config,
					price_unit_tiers: tieredPrices.map((tier) => ({
						up_to: tier.up_to ?? null,
						unit_amount: tier.unit_amount || '0',
						flat_amount: tier.flat_amount || '0',
					})),
				};
			}
		}

		// Strip amount/tiers/tier_mode/transform_quantity off the base so we apply them explicitly below
		const { amount: _, tiers: __, tier_mode: ___, transform_quantity: ____, ...baseLocalPrice } = localPrice;

		const priceWithEntity: Partial<InternalPrice> = {
			...baseLocalPrice,
			type: localPrice.type ?? PRICE_TYPE.FIXED,
			billing_model: resolvedBillingModel,
			price_unit_config: priceUnitConfig,
			entity_type: entityType,
			entity_id: entityId || '',
			start_date: startDate ? startDate.toISOString() : undefined,
			transform_quantity: transformQuantity,
			// For CUSTOM price units, amount/tiers/tier_mode live in price_unit_config and must be omitted from the root
			...(isCustomUnit ? { amount: undefined, tiers: undefined, tier_mode: undefined } : { amount, tiers, tier_mode: tierMode }),
		};

		if (price.internal_state === PriceInternalState.EDIT) {
			onUpdate({ ...priceWithEntity, isEdit: false });
		} else {
			onAdd({ ...priceWithEntity, isEdit: false });
		}
	};

	const handleGroupChange = (group: Group | null) => {
		setLocalPrice({ ...localPrice, group_id: group?.id || undefined });
	};

	if (price.internal_state === PriceInternalState.SAVED) {
		return <RecurringChargePreview charge={price} onEditClicked={onEditClicked} onDeleteClicked={onDeleteClicked} />;
	}

	return (
		<div className='card'>
			<Input
				onChange={(value) => setLocalPrice({ ...localPrice, display_name: value })}
				value={localPrice.display_name || ''}
				variant='text'
				label={t('catalog:plans.organisms.priceForm.displayName')}
				placeholder={entityName || t('catalog:plans.organisms.priceForm.enterDisplayName')}
				error={errors.display_name}
			/>
			<Spacer height={'8px'} />
			<CurrencyPriceUnitSelector
				value={currencyPriceUnitValue}
				onChange={handleCurrencyPriceUnitChange}
				label={t('catalog:plans.organisms.priceForm.currency')}
				error={errors.currency || errors.price_unit_config}
			/>
			<Spacer height={'8px'} />
			<Select
				value={localPrice.billing_period}
				options={billlingPeriodOptions}
				onChange={(value) => setLocalPrice({ ...localPrice, billing_period: value as BILLING_PERIOD })}
				label={t('catalog:plans.organisms.priceForm.billingPeriod')}
				error={errors.billing_period}
			/>
			<Spacer height={'8px'} />
			<Select
				value={billingModel}
				options={billingModels}
				onChange={setBillingModel}
				label={t('catalog:plans.organisms.usageForm.billingModel')}
				placeholder={t('catalog:plans.organisms.usageForm.billingModelPlaceholder')}
			/>
			<Spacer height={'8px'} />

			{isFlatFee && (
				<Input
					onChange={(value) => setLocalPrice({ ...localPrice, amount: value })}
					value={localPrice.amount}
					variant='formatted-number'
					label={t('catalog:plans.organisms.priceForm.price')}
					placeholder={t('catalog:plans.organisms.priceForm.amountPlaceholderShort')}
					error={errors.amount}
					inputPrefix={displayCurrencySymbol}
					suffix={
						<div className='flex items-center gap-1.5'>
							<span className='text-content-slate-muted'>
								{t('catalog:plans.organisms.recurringForm.perBilling', {
									period: formatBillingPeriodForPrice(localPrice.billing_period || ''),
								})}
							</span>
							<Popover open={calculatorOpen} onOpenChange={setCalculatorOpen}>
								<PopoverTrigger asChild>
									<button
										type='button'
										aria-label={t('catalog:plans.organisms.recurringForm.calculatorAria')}
										className='inline-flex items-center justify-center rounded p-0.5 text-content-muted hover:bg-surface-shell hover:text-content-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
										onClick={(e) => {
											e.stopPropagation();
											setCalculatorOpen(true);
										}}>
										<Calculator className='size-4' />
									</button>
								</PopoverTrigger>
								<PopoverContent className='w-[360px]' align='end' sideOffset={8} onOpenAutoFocus={(e) => e.preventDefault()}>
									<SubscriptionCalculatorContent
										currency={localPrice.currency || 'USD'}
										initialAmount={localPrice.amount ?? ''}
										initialContractTerms='ANNUAL'
										planPeriod={(localPrice.billing_period as any) || 'ANNUAL'}
										onApply={(displayAmount) => {
											setLocalPrice((prev) => ({ ...prev, amount: displayAmount }));
											setCalculatorOpen(false);
										}}
									/>
								</PopoverContent>
							</Popover>
						</div>
					}
				/>
			)}

			{isPackage && (
				<div className='space-y-1'>
					<div className='flex w-full gap-2 items-end'>
						<Input
							variant='formatted-number'
							label={t('catalog:plans.organisms.priceForm.price')}
							placeholder={t('catalog:plans.organisms.usageForm.amountPlaceholder')}
							value={packagedFee.price}
							inputPrefix={displayCurrencySymbol}
							onChange={(e) => {
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
								const integerRegex = /^\d*$/;
								if (integerRegex.test(e) || e === '') {
									setPackagedFee({ ...packagedFee, unit: e });
								}
							}}
							suffix={`/ units / ${formatBillingPeriodForPrice(localPrice.billing_period || '')}`}
						/>
					</div>
					{modelErrors.packagedModelError && <p className='text-danger-bright text-sm'>{modelErrors.packagedModelError}</p>}
				</div>
			)}

			{isTiered && (
				<div className='space-y-2'>
					<VolumeTieredPricingForm
						setTieredPrices={setTieredPrices}
						tieredPrices={tieredPrices}
						currency={isCustomUnit ? localPrice.price_unit_config?.price_unit || localPrice.currency : localPrice.currency}
						tierMode={billingModel === 'SLAB_TIERED' ? TIER_MODE.SLAB : TIER_MODE.VOLUME}
					/>
					{modelErrors.tieredModelError && <p className='text-danger-bright text-sm'>{modelErrors.tieredModelError}</p>}
				</div>
			)}
			<Spacer height={'8px'} />
			<SelectGroup
				value={localPrice.group_id}
				onChange={handleGroupChange}
				label={t('catalog:plans.organisms.priceForm.group')}
				placeholder={t('catalog:plans.organisms.priceForm.groupPlaceholder')}
				description={t('catalog:plans.organisms.priceForm.groupDescription')}
				showLookupKey={false}
				hiddenIfEmpty
			/>
			<Spacer height={'16px'} />
			<DatePicker
				popoverTriggerClassName='w-full'
				className='w-full'
				popoverClassName='w-full'
				popoverContentClassName='w-full'
				date={startDate}
				setDate={setStartDate}
				label={t('catalog:plans.organisms.priceForm.startDateOptional')}
				placeholder={t('catalog:plans.organisms.priceForm.selectStartDate')}
			/>
			<Spacer height={'16px'} />
			<FormHeader title={t('catalog:plans.organisms.recurringForm.billingTiming')} variant='form-component-title' />
			{/* starting billing preffercences */}

			<CheckboxRadioGroup
				title='	'
				value={localPrice.invoice_cadence}
				checkboxItems={[
					{
						label: t('catalog:plans.organisms.recurringForm.invoiceCadenceAdvance'),
						value: INVOICE_CADENCE.ADVANCE,
						description: t('catalog:plans.organisms.recurringForm.invoiceCadenceAdvanceDesc'),
					},
					{
						label: t('catalog:plans.organisms.recurringForm.invoiceCadenceArrear'),
						value: INVOICE_CADENCE.ARREAR,
						description: t('catalog:plans.organisms.recurringForm.invoiceCadenceArrearDesc'),
					},
				]}
				onChange={(value) => {
					setLocalPrice({ ...localPrice, invoice_cadence: value as INVOICE_CADENCE });
					if (value === BILLING_CADENCE.ONETIME) {
						setLocalPrice({ ...localPrice, isTrialPeriod: false, trial_period_days: 0 });
					}
				}}
				error={errors.invoice_cadence}
			/>
			<Spacer height={'16px'} />
			{localPrice.type === PRICE_TYPE.FIXED && (
				<>
					<Input
						variant='number'
						error={errors.min_quantity}
						value={localPrice.min_quantity?.toString() || ''}
						onChange={(value) => {
							const numValue = value === '' ? undefined : Math.floor(Number(value));
							setLocalPrice({ ...localPrice, min_quantity: numValue });
						}}
						label={t('catalog:plans.organisms.recurringForm.minQuantity')}
						placeholder='1'
					/>
					<Spacer height={'16px'} />
				</>
			)}
			<div>
				<FormHeader title={t('catalog:plans.organisms.recurringForm.trialPeriodTitle')} variant='form-component-title' />
				<div className='flex items-center space-x-4 s'>
					<Switch
						id='airplane-mode'
						checked={localPrice.isTrialPeriod}
						onCheckedChange={(value) => {
							setLocalPrice({ ...localPrice, isTrialPeriod: value });
						}}
					/>
					<Label htmlFor='airplane-mode'>
						<p className='font-medium text-sm text-content-zinc-bold peer-checked:text-content-black'>
							{t('catalog:plans.organisms.recurringForm.trialToggleTitle')}
						</p>
						<Spacer height={'4px'} />
						<p className='text-sm font-normal text-content-zinc-muted peer-checked:text-content-secondary'>
							{t('catalog:plans.organisms.recurringForm.trialToggleHint')}
						</p>
					</Label>
				</div>
			</div>
			{localPrice.isTrialPeriod && (
				<div>
					<Spacer height={'8px'} />
					<Input
						variant='number'
						error={errors.trial_period_days}
						value={localPrice.trial_period_days}
						onChange={(value) => {
							setLocalPrice({ ...localPrice, trial_period_days: Number(value) });
						}}
						suffix='days'
						placeholder={t('catalog:plans.organisms.recurringForm.trialDaysPlaceholder')}
					/>
				</div>
			)}
			<Spacer height={'16px'} />
			<div className='flex justify-end'>
				<Button onClick={onDeleteClicked} variant='secondary' className='me-4 text-content-zinc-bold' disabled={isSaving}>
					{price.internal_state === PriceInternalState.EDIT ? t('common:actions.delete') : t('common:actions.cancel')}
				</Button>
				<Button onClick={handleSubmit} variant='default' className='me-4 font-normal' isLoading={isSaving} disabled={isSaving}>
					{price.internal_state === PriceInternalState.EDIT ? t('common:actions.update') : t('common:actions.add')}
				</Button>
			</div>
		</div>
	);
};

export default RecurringChargesForm;
