import { Price } from '@/models/Price';
import { FC, useState, useEffect } from 'react';
import { Button, CheckboxRadioGroup, Input, Select, SelectOption, Spacer } from '@/components/atoms';
import SelectMeter from './SelectMeter';
// import { Pencil, Trash2 } from 'lucide-react';
import { Meter } from '@/models/Meter';
import { formatBillingPeriodForPrice, getCurrencySymbol } from '@/utils/common/helper_functions';
import { billlingPeriodOptions, currencyOptions } from '@/constants/constants';
import VolumeTieredPricingForm from './VolumeTieredPricingForm';
import { InternalPrice } from './SetupChargesSection';
import UsageChargePreview from './UsageChargePreview';

interface Props {
	onAdd: (price: InternalPrice) => void;
	onUpdate: (price: InternalPrice) => void;
	onEditClicked: () => void;
	onDeleteClicked: () => void;
	price: Partial<InternalPrice>;
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

// TODO: Remove disabled once the feature is released
const billingModels: SelectOption[] = [
	{ value: 'FLAT_FEE', label: 'Flat Fee' },
	{ value: 'PACKAGE', label: 'Package (Coming Soon)', disabled: true },
	{ value: 'TIERED', label: 'Volume Tiered (Coming Soon)', disabled: true },
];

const UsagePricingForm: FC<Props> = ({ onAdd, onUpdate, onEditClicked, onDeleteClicked, price }) => {
	const [currency, setCurrency] = useState(price.currency || currencyOptions[0].value);
	const [billingModel, setBillingModel] = useState(price.billing_model || billingModels[0].value);
	const [meterId, setMeterId] = useState<string>(price.meter_id || '');
	const [activeMeter, setActiveMeter] = useState<Meter | null>(price.meter || null);
	const [tieredPrices, setTieredPrices] = useState<PriceTier[]>([
		{ from: 1, up_to: 1 },
		{ from: 2, up_to: null },
	]);
	const [billingPeriod, setBillingPeriod] = useState(price.billing_period || billlingPeriodOptions[1].value);
	const [flatFee, setFlatFee] = useState<string>(price.amount || '');
	const [packagedFee, setPackagedFee] = useState<{ unit: string; price: string }>({
		unit: '',
		price: '',
	});

	const [errors, setErrors] = useState<Partial<Record<keyof Price, any>>>({});
	const [inputErrors, setInputErrors] = useState({
		flatModelError: '',
		packagedModelError: '',
		tieredModelError: '',
		invoiceCadenceError: '',
	});

	const [invoiceCadence, setInvoiceCadence] = useState('ARREAR');

	// Load price data when editing
	useEffect(() => {
		if (price.internal_state === 'edit') {
			setCurrency(price.currency || currencyOptions[0].value);
			setBillingModel(price.billing_model || billingModels[0].value);
			setMeterId(price.meter_id || '');
			if (price.meter) {
				setActiveMeter({
					id: price.meter.id,
					name: price.meter.name,
				} as Meter);
			}
			setBillingPeriod(price.billing_period || billlingPeriodOptions[1].value);

			if (price.billing_model === 'FLAT_FEE') {
				setFlatFee(price.amount || '');
			} else if (price.billing_model === 'PACKAGE') {
				setPackagedFee({
					price: price.amount || '',
					unit: price.transform_quantity?.divide_by?.toString() || '',
				});
			} else if (price.billing_model === 'TIERED' && Array.isArray(price.tiers)) {
				setTieredPrices(
					(price.tiers as TieredPrice[]).map((tier) => ({
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

		if (billingModel === billingModels[2].value) {
			for (let i = 0; i < tieredPrices.length; i++) {
				const upTo = tieredPrices[i].up_to;
				if (tieredPrices[i].from > (upTo === null ? 999999 : upTo)) {
					setInputErrors((prev) => ({
						...prev,
						tieredModelError: `From value cannot be smaller than up to in row ${i + 1}`,
					}));
					return false;
				}
			}
		}

		if (billingModel === billingModels[1].value) {
			if (packagedFee.price === '' || packagedFee.unit === '') {
				setInputErrors((prev) => ({ ...prev, packagedModelError: 'Invalid package fee' }));
				return false;
			}
		}

		if (billingModel === billingModels[0].value) {
			if (!flatFee || Number(flatFee) < 0) {
				setInputErrors((prev) => ({ ...prev, flatModelError: 'Invalid flat fee' }));
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

		const basePrice: Partial<Price> = {
			meter_id: meterId,
			meter: activeMeter || undefined,
			currency,
			billing_period: billingPeriod,
			billing_model: billingModel,
			type: 'USAGE',
			billing_period_count: 1,
			billing_cadence: 'RECURRING',
			invoice_cadence: invoiceCadence,
		};

		let finalPrice: Partial<Price>;

		if (billingModel === billingModels[0].value) {
			finalPrice = {
				...basePrice,
				amount: flatFee,
			};
		} else if (billingModel === billingModels[1].value) {
			finalPrice = {
				...basePrice,
				amount: packagedFee.price,
				transform_quantity: {
					divide_by: Number(packagedFee.unit),
				},
			};
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

			finalPrice = {
				...basePrice,
				tiers: adjustedTiers.map((tier) => ({
					from: tier.from,
					up_to: tier.up_to ?? null,
					unit_amount: tier.unit_amount || '0',
					flat_amount: tier.flat_amount || '0',
				})) as unknown as NonNullable<Price['tiers']>,
				tier_mode: 'VOLUME',
			};
		}
		// If we're editing an existing price, preserve its ID and other important fields
		if (price.internal_state === 'edit') {
			const finalPriceWithEdit: InternalPrice = {
				...price,
				...finalPrice,
				type: 'USAGE',
				meter_id: meterId,
				meter: activeMeter || price.meter,
				internal_state: 'saved',
			};
			onUpdate(finalPriceWithEdit);
		} else {
			onAdd({
				...finalPrice,
				internal_state: 'saved',
			} as InternalPrice);
		}
	};

	if (price.internal_state === 'saved') {
		return (
			<div className='mb-2 space-y-2'>
				<UsageChargePreview charge={price} index={0} onEdit={onEditClicked} onDelete={onDeleteClicked} />
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
			<Select
				value={currency}
				options={currencyOptions}
				label='Currency'
				onChange={setCurrency}
				placeholder='Currency'
				error={errors.currency}
			/>
			<Spacer height='8px' />
			<Select
				value={billingPeriod}
				options={billlingPeriodOptions}
				onChange={(value) => {
					setBillingPeriod(value);
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
						placeholder='0'
						variant='formatted-number'
						error={inputErrors.flatModelError}
						label='Price'
						value={flatFee}
						inputPrefix={getCurrencySymbol(currency)}
						onChange={(e) => {
							setFlatFee(e);
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
							placeholder='0'
							value={packagedFee.price}
							inputPrefix={getCurrencySymbol(currency)}
							onChange={(e) => setPackagedFee({ ...packagedFee, price: e })}
						/>
						<div className='h-[50px] items-center flex gap-2'>
							<p className='text-[#18181B] font-medium'>per</p>
						</div>
						<Input
							value={packagedFee.unit}
							variant='integer'
							placeholder='0'
							onChange={(e) =>
								setPackagedFee({
									...packagedFee,
									unit: e,
								})
							}
							suffix={`/ units / ${formatBillingPeriodForPrice(billingPeriod)}`}
						/>
					</div>
					{inputErrors.packagedModelError && <p className='text-red-500 text-sm'>{inputErrors.packagedModelError}</p>}
				</div>
			)}

			{billingModel === billingModels[2].value && (
				<VolumeTieredPricingForm setTieredPrices={setTieredPrices} tieredPrices={tieredPrices} currency={currency} />
			)}

			<Spacer height='16px' />
			{/* !TODO: Remove disabled once the feature is released */}
			<CheckboxRadioGroup
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
