import { Button, FormHeader, Spacer, Stepper } from '@/components/atoms';
import { PlanDetailsSection, SetupChargesSection } from '@/components/organisms';
import { ApiDocsContent } from '@/components/molecules';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Plan } from '@/models/Plan';
import { PlanApi } from '@/api/PlanApi';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
const CreatePlanPage = () => {
	const [activeStep, setActiveStep] = useState(0);
	const formSteps = [{ label: 'Plan Details' }, { label: 'Set up Charges' }];
	const navigate = useNavigate();

	const [tempPlan, setTempPlan] = useState<Partial<Plan>>({
		name: '',
		description: '',
		lookup_key: 'plan-',
		prices: [],
	});

	const setPlanField = <K extends keyof Plan>(field: K, value: Plan[K]) => {
		setTempPlan((prev) => ({ ...prev, [field]: value }));
	};

	const [errors, setErrors] = useState<Partial<Record<keyof Plan, string>>>({});

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

	const handleNext = () => {
		if (isPending) {
			return;
		}

		if (activeStep === formSteps.length - 1) {
			if (!validateSteps()) {
				return;
			}
			submitPlan();
			return;
		}
		if (!validateSteps()) {
			return;
		}
		setActiveStep((prev) => prev + 1);
	};

	const handleBack = () => {
		if (activeStep === 0) {
			return;
		}
		setActiveStep((prev) => prev - 1);
	};

	const validateSteps = () => {
		setErrors({});
		if (activeStep === 0) {
			if (!tempPlan.name) {
				setErrors({ name: 'Plan name is required' });
				return false;
			}
			if (!tempPlan.lookup_key) {
				setErrors({ lookup_key: 'Plan slug is required' });
				return false;
			}
		}
		// else if (activeStep === 1) {
		// 	if (!tempPlan.invoice_cadence) {
		// 		setErrors({ invoice_cadence: 'Billing Timing is required' });
		// 		return false;
		// 	}
		// 	if (metaData?.isTrialPeriod && !tempPlan.trial_period) {
		// 		setErrors({ trial_period: 'Trial period is required' });
		// 		return false;
		// 	}
		// }
		else if (activeStep === 1) {
			if (!tempPlan.prices || tempPlan.prices.length === 0) {
				setErrors({ prices: 'At least one price tier is required' });
				return false;
			}
		}

		return true;
	};

	return (
		<div className='p-6 w-full'>
			<FormHeader
				title={'Plan Details'}
				subtitle={'A Plan defines the features your customers have access to, the pricing structure, and the billing cadence.'}
				variant='form-title'
			/>
			<ApiDocsContent tags={['Plans']} />

			<Spacer height={'16px'} />

			<div className='w-2/3'>
				<Stepper activeStep={activeStep} steps={formSteps} />

				<Spacer height={'16px'} />

				{activeStep === 0 && <PlanDetailsSection plan={tempPlan} setPlanField={setPlanField} errors={errors} />}

				{activeStep === 1 && (
					// <BillingPrefferencesSection
					// 	plan={tempPlan}
					// 	setPlanField={setPlanField}
					// 	errors={errors}
					// />
					<SetupChargesSection plan={tempPlan} setPlanField={setPlanField} />
				)}

				{activeStep === 2 && <SetupChargesSection plan={tempPlan} setPlanField={setPlanField} />}

				<Spacer height={'16px'} />
				<div>
					{activeStep > 0 && (
						<Button onClick={handleBack} variant='secondary' className='mr-4 text-zinc-900'>
							Go Back
						</Button>
					)}
					<Button onClick={handleNext} variant='default' className='mr-4'>
						{formSteps.length - 1 === activeStep ? 'Save' : 'Next'}
					</Button>
				</div>
			</div>
			{/* <pre>{JSON.stringify(tempPlan, null, 2)}</pre> */}
		</div>
	);
};

export default CreatePlanPage;
