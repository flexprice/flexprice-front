import { Button, Loader, Page } from '@/components/atoms';
import { Plan } from '@/models/Plan';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PlanApi } from '@/utils/api_requests/PlanApi';
import toast from 'react-hot-toast';
import UsageChargePreview from '@/components/organisms/PlanForm/UsageChargePreview';
import RecurringChargePreview from '@/components/organisms/PlanForm/RecurringChargePreview';
import { AddChargesButton, InternalPrice } from '@/components/organisms/PlanForm/SetupChargesSection';
import { billlingPeriodOptions } from '@/core/data/constants';
import { currencyOptions } from '@/core/data/constants';
import { RecurringChargesForm } from '@/components/organisms';
import UsagePricingForm from '@/components/organisms/PlanForm/UsagePricingForm';
import { RouteNames } from '@/core/routes/Routes';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';

enum ChargeType {
	FIXED = 'FIXED',
	USAGE = 'USAGE',
}

const AddChargesPage = () => {
	const { planId } = useParams<{ planId: string }>();

	const navigate = useNavigate();

	const {
		data: planData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['plan', planId],
		queryFn: () => PlanApi.getPlanById(planId ?? ''),
		enabled: !!planId,
	});

	const { updateBreadcrumb } = useBreadcrumbsStore();

	useEffect(() => {
		if (planData) {
			if (planData?.name) {
				updateBreadcrumb(2, planData.name);
			}
		}
	}, [planData, updateBreadcrumb]);

	useEffect(() => {
		if (planData) {
			setTempPlan(planData);
		}
	}, [planData]);

	const [recurringCharges, setRecurringCharges] = useState<InternalPrice[]>([]);
	const [usageCharges, setUsageCharges] = useState<InternalPrice[]>([]);

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
		internal_state: 'new',
	});

	const handleAddNewPrice = (type: ChargeType) => {
		const newPrice = getEmptyPrice(type);
		if (type === ChargeType.FIXED) {
			setRecurringCharges([...recurringCharges, newPrice]);
		} else {
			setUsageCharges([...usageCharges, newPrice]);
		}
	};

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

	const [tempPlan, setTempPlan] = useState<Partial<Plan>>(planData ?? {});

	const existingRecurringCharges = (tempPlan.prices ?? []).filter((price) => price.type === 'FIXED');
	const existingUsageCharges = (tempPlan.prices ?? []).filter((price) => price.type === 'USAGE');

	const canAddRecurringCharges = existingRecurringCharges?.length === 0 && recurringCharges.length === 0;

	const isAnyPlanPriceEdit = [...recurringCharges, ...usageCharges].some(
		(price) => price.internal_state === 'edit' || price.internal_state === 'new',
	);

	if (isLoading) return <Loader />;

	if (isError) {
		toast.error('Error fetching plan');
	}

	const handleSave = () => {
		const updatedPlan = {
			...tempPlan,
			prices: [...(planData?.prices ?? []), ...recurringCharges, ...usageCharges],
		};

		updatePlan(updatedPlan as Partial<Plan>);
	};

	return (
		<Page heading='Add Charges'>
			<div className='space-y-6'>
				{/* existing charges section */}
				<div className='p-6 rounded-xl border border-[#E4E4E7] space-y-4'>
					{existingRecurringCharges?.map((charge) => {
						return <RecurringChargePreview key={charge.id} charge={charge} disabled={true} />;
					})}

					{existingUsageCharges?.map((charge, index) => {
						return <UsageChargePreview key={charge.id} charge={charge} index={index} disabled={true} />;
					})}

					{recurringCharges.map((charge, index) => {
						return (
							<div key={index}>
								<RecurringChargesForm
									price={charge}
									onAdd={(charge) => {
										const newCharges = recurringCharges.map((p, i) => {
											if (index === i) {
												return { ...charge, internal_state: 'saved' };
											}
											return p;
										}) as InternalPrice[];

										setRecurringCharges(newCharges);
									}}
									onUpdate={(price) => {
										const newCharges = recurringCharges.map((p, i) => {
											if (index === i) {
												return { ...price, internal_state: 'saved' };
											}
											return p;
										}) as InternalPrice[];
										setRecurringCharges(newCharges);
									}}
									onDeleteClicked={() => {
										const newCharges = recurringCharges.filter((_p, i) => i !== index) as InternalPrice[];
										setRecurringCharges(newCharges);
									}}
									onEditClicked={() => {
										const newCharges = recurringCharges.map((p, i) => {
											if (index === i) {
												return { ...p, internal_state: 'edit' };
											}
											return p;
										}) as InternalPrice[];
										setRecurringCharges(newCharges);
									}}
								/>
							</div>
						);
					})}

					{usageCharges.map((charge, index) => {
						return (
							<div key={index}>
								<UsagePricingForm
									price={charge}
									onAdd={(charge) => {
										const newCharges = usageCharges.map((p, i) => {
											if (index === i) {
												return { ...charge, internal_state: 'saved' };
											}
											return p;
										}) as InternalPrice[];
										setUsageCharges(newCharges);
									}}
									onUpdate={(charge) => {
										const newCharges = usageCharges.map((p, i) => {
											if (index === i) {
												return { ...charge, internal_state: 'saved' };
											}
											return p;
										}) as InternalPrice[];
										setUsageCharges(newCharges);
									}}
									onEditClicked={() => {
										const newCharges = usageCharges.map((p, i) => {
											if (index === i) {
												return { ...p, internal_state: 'edit' };
											}
											return p;
										}) as InternalPrice[];
										setUsageCharges(newCharges);
									}}
									onDeleteClicked={() => {
										const newCharges = usageCharges.filter((_p, i) => i !== index) as InternalPrice[];
										setUsageCharges(newCharges);
									}}
								/>
							</div>
						);
					})}
					<div className='flex gap-2'>
						{canAddRecurringCharges && (
							<AddChargesButton onClick={() => handleAddNewPrice(ChargeType.FIXED)} label='Add Recurring Charges' />
						)}
						<AddChargesButton onClick={() => handleAddNewPrice(ChargeType.USAGE)} label='Add Usage Based Charges' />
					</div>
				</div>

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
