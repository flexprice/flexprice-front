import { Button, FormHeader, Spacer } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { PlanDetailsSection } from '@/components/organisms';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/tanstack/ReactQueryProvider';
import { Plan } from '@/models/Plan';
import { PlanApi } from '@/utils/api_requests/PlanApi';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreatePlanPage = () => {
	const navigate = useNavigate();

	const [tempPlan, setTempPlan] = useState<Partial<Plan>>({
		name: '',
		description: '',
		lookup_key: 'plan-',
		prices: [],
	});

	const [errors, setErrors] = useState<Partial<Record<keyof Plan, string>>>({});

	const setPlanField = <K extends keyof Plan>(field: K, value: Plan[K]) => {
		setTempPlan((prev) => ({ ...prev, [field]: value }));
	};

	const { mutate: submitPlan, isPending } = useMutation({
		mutationFn: async () => {
			return await PlanApi.createPlan({
				...tempPlan,
				invoice_cadence: 'ARREAR',
			} as Partial<Plan>);
		},
		async onSuccess() {
			toast.success('Plan created successfully');
			navigate(RouteNames.plan);
			await refetchQueries(['fetchPlans']);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to create plan');
		},
	});

	const validatePlan = () => {
		const newErrors: Partial<Record<keyof Plan, string>> = {};

		if (!tempPlan.name?.trim()) {
			newErrors.name = 'Plan name is required';
		}

		if (!tempPlan.lookup_key?.trim()) {
			newErrors.lookup_key = 'Plan slug is required';
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (isPending) return;
		if (validatePlan()) {
			submitPlan();
		}
	};

	return (
		<div className='p-6 w-full'>
			<ApiDocsContent tags={['Plans']} />
			<FormHeader
				title={'Plan Details'}
				subtitle={'A Plan defines the features your customers have access to, the pricing structure, and the billing cadence.'}
				variant='form-title'
			/>

			<Spacer height={'16px'} />

			<div className='w-2/3'>
				<PlanDetailsSection plan={tempPlan} setPlanField={setPlanField} errors={errors} />
				<Spacer height={'16px'} />
				<Button
					onClick={handleSubmit}
					variant='default'
					className='mr-4'
					disabled={isPending || !tempPlan.name?.trim() || !tempPlan.lookup_key?.trim()}
					isLoading={isPending}>
					Save
				</Button>
			</div>
		</div>
	);
};

export default CreatePlanPage;
