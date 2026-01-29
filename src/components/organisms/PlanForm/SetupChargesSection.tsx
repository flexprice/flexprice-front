import { FormHeader, Spacer } from '@/components/atoms';
import { IoRepeat } from 'react-icons/io5';
import { FiDatabase } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { Plan } from '@/models/Plan';
import { useState } from 'react';
import { BILLING_MODEL, Price, PRICE_TYPE, PRICE_UNIT_TYPE, PriceUnitConfig } from '@/models/Price';
import { BILLING_PERIOD, currencyOptions } from '@/constants/constants';
import RecurringChargesForm from './RecurringChargesForm';
import UsagePricingForm, { PriceInternalState } from './UsagePricingForm';
import { CirclePlus } from 'lucide-react';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { PRICE_ENTITY_TYPE } from '@/models/Price';

interface Props {
	plan: Partial<Plan>;
	setPlanField: <K extends keyof Plan>(field: K, value: Plan[K]) => void;
}

enum SubscriptionType {
	FIXED = 'FIXED',
	USAGE = 'USAGE',
}

export const subscriptionTypeOptions = [
	{
		value: SubscriptionType.FIXED,
		label: 'Recurring',
		icon: IoRepeat,
		description: 'Fixed pricing billed on a set schedule.',
	},

	{
		value: SubscriptionType.USAGE,
		label: 'Usage Based',
		icon: FiDatabase,
		description: 'Charges based on actual consumption.',
	},
];

interface AddChargesButtonProps {
	onClick: () => void;
	label: string;
	className?: string;
}

export const AddChargesButton = ({ onClick, label, className }: AddChargesButtonProps) => (
	<button
		onClick={onClick}
		className={cn(
			'shrink-0 cursor-pointer flex gap-2 items-center justify-center bg-[#F4F4F5] rounded-md px-4 h-9 min-w-[160px] text-left',
			className,
		)}>
		<CirclePlus size={16} className='shrink-0' />
		<span className='text-[#18181B] text-sm font-medium truncate'>{label}</span>
	</button>
);

export interface InternalPrice extends Partial<Price> {
	isEdit?: boolean;
	isTrialPeriod?: boolean;
	internal_state?: PriceInternalState;
	group_id?: string;
	price_unit_type?: PRICE_UNIT_TYPE;
	price_unit_config?: PriceUnitConfig;
}

const SetupChargesSection: React.FC<Props> = ({ plan, setPlanField }) => {
	const [subscriptionType, setSubscriptionType] = useState<string>();
	const [recurringCharges, setRecurringCharges] = useState<InternalPrice[]>(
		plan.prices?.filter((price) => price.type === PRICE_TYPE.FIXED) || [],
	);
	const [usageCharges, setUsageCharges] = useState<InternalPrice[]>(plan.prices?.filter((price) => price.type === PRICE_TYPE.USAGE) || []);

	const getEmptyPrice = (type: SubscriptionType): InternalPrice => ({
		amount: '',
		currency: currencyOptions[0].value,
		billing_period: BILLING_PERIOD.MONTHLY,
		type: type === SubscriptionType.FIXED ? PRICE_TYPE.FIXED : PRICE_TYPE.USAGE,
		isEdit: true,
		billing_period_count: 1,
		invoice_cadence: INVOICE_CADENCE.ARREAR,
		billing_model: type === SubscriptionType.FIXED ? BILLING_MODEL.FLAT_FEE : undefined,
		billing_cadence: BILLING_CADENCE.RECURRING,
		internal_state: PriceInternalState.NEW,
	});

	const handleSubscriptionTypeChange = (type: (typeof subscriptionTypeOptions)[0]) => {
		setSubscriptionType(type.value);
		if (type.value === SubscriptionType.FIXED && recurringCharges.length === 0) {
			setRecurringCharges([getEmptyPrice(SubscriptionType.FIXED)]);
		} else if (type.value === SubscriptionType.USAGE && usageCharges.length === 0) {
			setUsageCharges([getEmptyPrice(SubscriptionType.USAGE)]);
		}
	};

	const updatePlanPrices = (recurring: InternalPrice[], usage: InternalPrice[]) => {
		setPlanField('prices', [...recurring, ...usage] as unknown as Price[]);
	};

	const handleAddNewPrice = (type: SubscriptionType) => {
		const newPrice = getEmptyPrice(type);

		if (type === SubscriptionType.FIXED) {
			setRecurringCharges((prev) => {
				const updated = [...prev, newPrice];
				return updated;
			});
		} else {
			setUsageCharges((prev) => {
				const updated = [...prev, newPrice];
				return updated;
			});
		}
	};

	const isEditing = [...recurringCharges, ...usageCharges].some((p) => p.isEdit);
	const showAddButtons = Boolean(subscriptionType) && !isEditing;
	const canAddFixedPrices = showAddButtons && recurringCharges.length === 0;
	const canAddUsagePrices = showAddButtons;

	return (
		<div className='p-6 rounded-xl border border-[#E4E4E7]'>
			{/* Subscription Type Section */}
			{!recurringCharges.length && !usageCharges.length && (
				<div>
					<FormHeader title='Plan Charges' subtitle='Set how customers are charged for this plan.' variant='sub-header' />
					<FormHeader title='Choose a Pricing Model' variant='form-component-title' />
					<div className='w-full gap-4 grid grid-cols-2'>
						{subscriptionTypeOptions.map((type) => (
							<button
								key={type.value}
								onClick={() => handleSubscriptionTypeChange(type)}
								className={cn(
									'p-3 rounded-md border-2 w-full flex flex-col justify-center items-center',
									subscriptionType === type.value ? 'border-[#0F172A]' : 'border-[#E2E8F0]',
								)}>
								{type.icon && <type.icon size={24} className='text-[#020617]' />}
								<p className='text-[#18181B] font-medium mt-2'>{type.label}</p>
								<p className='text-sm text-muted-foreground'>{type.description}</p>
							</button>
						))}
					</div>
					<Spacer height='16px' />
				</div>
			)}

			{/* Fixed Price Forms */}
			{recurringCharges.length > 0 && (
				<div>
					<FormHeader title='Recurring Charges' variant='form-component-title' />
					{recurringCharges.map((price, index) => (
						<RecurringChargesForm
							key={index}
							price={price}
							entityType={PRICE_ENTITY_TYPE.PLAN}
							entityId={plan.id}
							entityName={plan.name}
							onAdd={(newPrice) => {
								setRecurringCharges((prevCharges) => {
									const newCharges = prevCharges.map((p, i) => {
										if (index === i) {
											const updatedPrice = {
												...newPrice,
												internal_state: PriceInternalState.SAVED,
												amount: newPrice.amount || '', // Ensure amount is never undefined
											};
											return updatedPrice;
										}
										return p;
									});

									updatePlanPrices(newCharges, usageCharges);
									return newCharges;
								});
							}}
							onUpdate={(newPrice) => {
								const newCharges = recurringCharges.map((p, i) => {
									if (index === i) {
										const updatedPrice = {
											...newPrice,
											internal_state: PriceInternalState.SAVED,
											amount: newPrice.amount || '', // Ensure amount is never undefined
										};
										return updatedPrice;
									}
									return p;
								});

								setRecurringCharges(newCharges);
								updatePlanPrices(newCharges, usageCharges);
							}}
							onEditClicked={() => {
								const newCharges = recurringCharges.map((p, i) => {
									if (index === i) {
										const updatedPrice = {
											...p,
											internal_state: PriceInternalState.EDIT,
										};
										return updatedPrice;
									}
									return p;
								});

								setRecurringCharges(newCharges);
							}}
							onDeleteClicked={() => {
								const newCharges = recurringCharges.filter((_, i) => i !== index);

								setRecurringCharges(newCharges);
								updatePlanPrices(newCharges, usageCharges);
							}}
						/>
					))}
				</div>
			)}

			{/* Usage Price Forms */}
			{usageCharges.length > 0 && (
				<div className='mt-6'>
					<FormHeader title='Usage Based Charges' variant='form-component-title' />
					{usageCharges.map((price, index) => (
						<UsagePricingForm
							key={index}
							price={price}
							entityType={PRICE_ENTITY_TYPE.PLAN}
							entityId={plan.id}
							onAdd={(newPrice) => {
								const newCharges = usageCharges.map((p, i) => {
									if (index === i) {
										return { ...newPrice, internal_state: PriceInternalState.SAVED };
									}
									return p;
								});
								setUsageCharges(newCharges);
								updatePlanPrices(recurringCharges, newCharges);
							}}
							onUpdate={(newPrice) => {
								const newCharges = usageCharges.map((p, i) => {
									if (index === i) {
										return { ...newPrice, internal_state: PriceInternalState.SAVED };
									}
									return p;
								});
								setUsageCharges(newCharges);
								updatePlanPrices(recurringCharges, newCharges);
							}}
							onEditClicked={() => {
								const newCharges = usageCharges.map((p, i) => {
									if (index === i) {
										return { ...p, internal_state: PriceInternalState.EDIT };
									}
									return p;
								});
								setUsageCharges(newCharges);
							}}
							onDeleteClicked={() => {
								const newCharges = usageCharges.filter((_, i) => i !== index);
								setUsageCharges(newCharges);
								updatePlanPrices(recurringCharges, newCharges);
							}}
						/>
					))}
				</div>
			)}

			{/* Add Charges Buttons */}
			{showAddButtons && (
				<div className='mt-6'>
					{canAddFixedPrices && (
						<AddChargesButton onClick={() => handleAddNewPrice(SubscriptionType.FIXED)} label='Add Recurring Charges' />
					)}
					{canAddUsagePrices && (
						<>
							{canAddFixedPrices && <Spacer height='8px' />}
							<AddChargesButton onClick={() => handleAddNewPrice(SubscriptionType.USAGE)} label='Add Usage Based Charges' />
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default SetupChargesSection;
