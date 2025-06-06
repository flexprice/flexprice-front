import { Button, Loader, Page } from '@/components/atoms';
import { Plan } from '@/models/Plan';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PlanApi } from '@/api/PlanApi';
import toast from 'react-hot-toast';
import { AddChargesButton, InternalPrice } from '@/components/organisms/PlanForm/SetupChargesSection';
import { billlingPeriodOptions } from '@/constants/constants';
import { currencyOptions } from '@/constants/constants';
import { RecurringChargesForm } from '@/components/organisms/PlanForm';
import UsagePricingForm from '@/components/organisms/PlanForm/UsagePricingForm';
import { RouteNames } from '@/core/routes/Routes';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { RectangleRadiogroup, RectangleRadiogroupOption } from '@/components/molecules';
import { Gauge, Repeat } from 'lucide-react';
// Types and constants
enum ChargeType {
	FIXED = 'FIXED',
	USAGE = 'USAGE',
}

type PriceState = 'new' | 'edit' | 'saved';

// Helper functions
const getEmptyPrice = (type: ChargeType): InternalPrice => ({
	amount: '',
	currency: currencyOptions[0].value,
	billing_period: billlingPeriodOptions[1].value,
	type,
	isEdit: true,
	billing_period_count: 1,
	invoice_cadence: 'ARREAR',
	billing_model: type === ChargeType.FIXED ? 'FLAT_FEE' : undefined,
	billing_cadence: 'RECURRING',
	internal_state: 'new' as PriceState,
});

const updatePriceInList = <T extends InternalPrice>(list: T[], index: number, updates: Partial<T>, state: PriceState = 'saved'): T[] => {
	return list.map((item, i) => (i === index ? { ...item, ...updates, internal_state: state } : item));
};

const chargeOptions: RectangleRadiogroupOption[] = [
	{
		label: 'Recurring Charges',
		value: ChargeType.FIXED,
		icon: Repeat,
		description: '	Billed on a fixed schedule (monthly, yearly, etc.)',
	},
	{
		label: 'Usage Charges',
		value: ChargeType.USAGE,
		icon: Gauge,
		description: 'Pay only for what customers actually use',
	},
];

const AddChargesPage = () => {
	// Hooks and state
	const { planId } = useParams<{ planId: string }>();
	const navigate = useNavigate();
	const { updateBreadcrumb } = useBreadcrumbsStore();
	const [tempPlan, setTempPlan] = useState<Partial<Plan>>({});
	const [recurringCharges, setRecurringCharges] = useState<InternalPrice[]>([]);
	const [usageCharges, setUsageCharges] = useState<InternalPrice[]>([]);
	// Data fetching
	const {
		data: planData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['plan', planId],
		queryFn: () => PlanApi.getPlanById(planId ?? ''),
		enabled: !!planId,
	});

	// Plan update mutation
	const { mutate: updatePlan, isPending } = useMutation({
		mutationFn: (plan: Partial<Plan>) => PlanApi.updatePlan(planId ?? '', plan),
		onSuccess: () => {
			toast.success('Plan updated successfully');
			navigate(`${RouteNames.plan}/${planId}`);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Error updating plan');
		},
	});

	// Effects
	useEffect(() => {
		if (planData?.name) {
			updateBreadcrumb(2, planData.name);
		}
	}, [planData, updateBreadcrumb]);

	useEffect(() => {
		if (planData) {
			setTempPlan(planData);
		}
	}, [planData]);

	// Event handlers
	const handleAddNewPrice = (type: ChargeType) => {
		const newPrice = getEmptyPrice(type);
		if (type === ChargeType.FIXED) {
			setRecurringCharges((prev) => [...prev, newPrice]);
		} else {
			setUsageCharges((prev) => [...prev, newPrice]);
		}
	};

	const handleSave = () => {
		const updatedPlan = {
			...tempPlan,
			prices: [...(planData?.prices ?? []), ...recurringCharges, ...usageCharges],
		};
		updatePlan(updatedPlan as Partial<Plan>);
	};

	// Derived state
	const isAnyPlanPriceEdit = [...recurringCharges, ...usageCharges].some(
		(price) => price.internal_state === 'edit' || price.internal_state === 'new',
	);

	// Loading and error states
	if (isLoading) return <Loader />;
	if (isError) {
		toast.error('Error fetching plan');
		return null;
	}

	return (
		<Page heading='Add Charges'>
			<div className='space-y-6'>
				<div className='p-6 rounded-xl border border-[#E4E4E7] space-y-4'>
					{/* Recurring Charges Section */}
					{recurringCharges.map((charge, index) => (
						<div key={index}>
							<RecurringChargesForm
								price={charge}
								onAdd={(charge) => {
									setRecurringCharges((prev) => updatePriceInList(prev, index, charge));
								}}
								onUpdate={(price) => {
									setRecurringCharges((prev) => updatePriceInList(prev, index, price));
								}}
								onDeleteClicked={() => {
									setRecurringCharges((prev) => prev.filter((_, i) => i !== index));
								}}
								onEditClicked={() => {
									setRecurringCharges((prev) => updatePriceInList(prev, index, {}, 'edit'));
								}}
							/>
						</div>
					))}

					{/* Usage Charges Section */}
					{usageCharges.map((charge, index) => (
						<div key={index}>
							<UsagePricingForm
								price={charge}
								onAdd={(charge) => {
									setUsageCharges((prev) => updatePriceInList(prev, index, charge));
								}}
								onUpdate={(charge) => {
									setUsageCharges((prev) => updatePriceInList(prev, index, charge));
								}}
								onEditClicked={() => {
									setUsageCharges((prev) => updatePriceInList(prev, index, {}, 'edit'));
								}}
								onDeleteClicked={() => {
									setUsageCharges((prev) => prev.filter((_, i) => i !== index));
								}}
							/>
						</div>
					))}

					{/* Add Charge Buttons */}

					{recurringCharges.length === 0 && usageCharges.length === 0 ? (
						<div>
							<RectangleRadiogroup
								title='Select Charge Type'
								options={chargeOptions}
								onChange={(value) => {
									handleAddNewPrice(value as ChargeType);
								}}
							/>
						</div>
					) : (
						<div className='flex gap-2'>
							<AddChargesButton onClick={() => handleAddNewPrice(ChargeType.FIXED)} label='Add Recurring Charges' />
							<AddChargesButton onClick={() => handleAddNewPrice(ChargeType.USAGE)} label='Add Usage Based Charges' />
						</div>
					)}
				</div>

				{/* Save Button */}
				<div className='flex justify-start'>
					<Button isLoading={isPending} disabled={isPending || isAnyPlanPriceEdit} onClick={handleSave}>
						Save
					</Button>
				</div>
			</div>
		</Page>
	);
};

export default AddChargesPage;
