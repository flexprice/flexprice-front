import { Select, DatePicker, Button, SelectOption, FormHeader, Label, Toggle, AddButton, Input } from '@/components/atoms';
import Preview from '@/components/organisms/Subscription/Preview';
import ChargeTable from '@/components/organisms/Subscription/PriceTable';
import UsageTable from '@/components/organisms/Subscription/UsageTable';
import { cn } from '@/lib/utils';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import CustomerApi from '@/api/CustomerApi';
import { PlanApi } from '@/api/PlanApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import { getCurrencySymbol, toSentenceCase } from '@/utils/common/helper_functions';
import { NormalizedPlan, normalizePlan } from '@/utils/models/transformed_plan';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiDocsContent } from '@/components/molecules';
import CreditGrantTable from '@/components/molecules/CreditGrant/CreditGrantTable';
import { invalidateQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { RouteNames } from '@/core/routes/Routes';
import useEnvironment from '@/hooks/useEnvironment';
import { BILLING_CYCLE, CREDIT_SCOPE, CreditGrant } from '@/models/Subscription';
import { CreateCustomerSubscriptionPayload } from '@/types/dto';
import { SubscriptionPhase } from '@/types/dto/Customer';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { Pencil } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { uniqueId } from 'lodash';

type Params = {
	id: string;
	subscription_id?: string;
};

enum SubscriptionPhaseState {
	EDIT = 'edit',
	SAVED = 'saved',
	NEW = 'new',
}

type SubscriptionFormState = {
	selectedPlan: string;
	prices: NormalizedPlan | null;
	billingPeriod: BILLING_PERIOD;
	currency: string;
	billingPeriodOptions: SelectOption[];
	startDate: Date | undefined;
	endDate: Date | undefined;
	billingCycle: BILLING_CYCLE;
	prorate_charges: boolean;

	// Subscription Phase
	phases: SubscriptionPhase[];
	selectedPhase: number;
	phaseStates: SubscriptionPhaseState[];
	isPhaseEditing: boolean;
	originalPhases: SubscriptionPhase[];
};

// Data Fetching Hooks
const usePlans = () => {
	return useQuery({
		queryKey: ['plans'],
		queryFn: async () => {
			const plansResponse = await PlanApi.getActiveExpandedPlan({ limit: 1000, offset: 0 });
			const normalizedPlans = plansResponse.map(normalizePlan);
			return normalizedPlans.filter((plan) => Object.keys(plan.charges).length > 0);
		},
	});
};

const useCustomerData = (customerId: string | undefined) => {
	return useQuery({
		queryKey: ['customerSubscription', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});
};

const useSubscriptionData = (subscription_id: string | undefined) => {
	return useQuery({
		queryKey: ['subscription', subscription_id],
		queryFn: async () => {
			const [details, usage] = await Promise.all([
				CustomerApi.getCustomerSubscriptionById(subscription_id!),
				SubscriptionApi.getSubscriptionUsage(subscription_id!),
			]);
			return { details, usage };
		},
		enabled: !!subscription_id,
	});
};

// Helper components
const BillingCycleSelector = ({
	value,
	onChange,
	disabled,
}: {
	value: BILLING_CYCLE;
	onChange: (value: BILLING_CYCLE) => void;
	disabled?: boolean;
}) => {
	const options = [
		{ label: 'Anniversary', value: BILLING_CYCLE.ANNIVERSARY },
		{ label: 'Calendar', value: BILLING_CYCLE.CALENDAR },
	];

	return (
		<div className='space-y-2'>
			<Label label='Subscription Cycle' />
			<div className='flex items-center space-x-2'>
				{options.map((option, index) => (
					<div
						key={index}
						data-state={value === option.value ? 'active' : 'inactive'}
						className={cn(
							'text-[15px] font-normal text-gray-500 px-3 py-1 rounded-md',
							'data-[state=active]:text-gray-900 data-[state=active]:bg-gray-100',
							'hover:text-gray-900 transition-colors',
							'data-[state=inactive]:border data-[state=inactive]:border-border data-[state=active]:border-primary',
							'bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
							'cursor-pointer',
						)}
						onClick={() => !disabled && onChange(option.value)}>
						{option.label}
					</div>
				))}
			</div>
		</div>
	);
};

// Phase Summary component

const SubscriptionForm = ({
	state,
	setState,
	plans,
	plansLoading,
	plansError,
	isDisabled,
}: {
	state: SubscriptionFormState;
	setState: React.Dispatch<React.SetStateAction<SubscriptionFormState>>;
	plans: NormalizedPlan[] | undefined;
	plansLoading: boolean;
	plansError: boolean;
	isDisabled: boolean;
}) => {
	const plansWithCharges = useMemo(() => {
		return (
			plans?.map((plan) => ({
				label: plan.name,
				value: plan.id,
			})) ?? []
		);
	}, [plans]);

	const handlePlanChange = (value: string) => {
		const selectedPlan = plans?.find((plan) => plan.id === value);

		if (!selectedPlan?.charges || Object.keys(selectedPlan.charges).length === 0) {
			toast.error('Invalid plan or no charges available.');
			return;
		}

		// reset phases
		const billingPeriods = Object.keys(selectedPlan.charges);
		const defaultBillingPeriod = billingPeriods.includes(state.billingPeriod) ? state.billingPeriod : billingPeriods[0];

		const currencies = Object.keys(selectedPlan.charges[defaultBillingPeriod] || {});
		const defaultCurrency = currencies.includes(state.currency) ? state.currency : currencies[0];

		// Create a new phase with the default values
		const newPhase = getEmptyPhase(state.billingCycle);

		// reset phases and add a new phase with the default values
		setState({
			...state,
			selectedPlan: value,
			prices: selectedPlan,
			billingPeriod: defaultBillingPeriod as BILLING_PERIOD,
			currency: defaultCurrency,
			billingPeriodOptions: billingPeriods.map((period) => ({
				label: toSentenceCase(period.replace('_', ' ')),
				value: period,
			})),
			phases: [newPhase],
			phaseStates: [SubscriptionPhaseState.EDIT], // Initial phase is in edit state
			selectedPhase: 0, // Select the only phase
			isPhaseEditing: true, // Set editing mode
			originalPhases: [newPhase], // Store original state
		});
	};

	const handleBillingPeriodChange = (value: string) => {
		const selectedPlan = state.prices;
		if (!selectedPlan?.charges[value]) {
			toast.error('Invalid billing period.');
			return;
		}

		const currencies = Object.keys(selectedPlan.charges[value]);
		const defaultCurrency = currencies.includes(state.currency) ? state.currency : currencies[0];

		// reset phases
		setState({
			...state,
			billingPeriod: value as BILLING_PERIOD,
			currency: defaultCurrency,
		});
	};

	// Get empty phase with proper billing cycle
	const getEmptyPhase = (billingCycle = BILLING_CYCLE.ANNIVERSARY): SubscriptionPhase => {
		return {
			billing_cycle: billingCycle,
			start_date: new Date(),
			end_date: null,
			line_items: [],
			credit_grants: [],
			prorate_charges: false,
			commitment_amount: 0,
			overage_factor: 1,
		};
	};

	const getEmptyCreditGrant = (): Partial<CreditGrant> => {
		return {
			id: uniqueId(),
			amount: 0,
			currency: state.currency,
			period: state.billingPeriod,
			name: 'Free Credits',
			scope: CREDIT_SCOPE.SUBSCRIPTION,
			cadence: BILLING_CADENCE.ONETIME,
			period_count: 1,
			plan_id: state.selectedPlan,
		};
	};

	// Phase selection - only allow if no phase is currently being edited
	const handlePhaseChange = (index: number) => {
		if (state.isPhaseEditing && state.selectedPhase !== index) {
			toast.error('Please save or cancel your current changes first');
			return;
		}

		setState((prev) => {
			// Update phaseStates to mark the selected phase as in edit mode
			const newPhaseStates = [...prev.phaseStates];
			newPhaseStates[index] = SubscriptionPhaseState.EDIT;

			return {
				...prev,
				selectedPhase: index,
				isPhaseEditing: true,
				phaseStates: newPhaseStates,
				// Store original state for cancel operation
				originalPhases: [...prev.phases],
			};
		});
	};

	// Save phase changes
	const savePhaseChanges = () => {
		const currentIndex = state.selectedPhase;

		setState((prev) => {
			const newPhaseStates = [...prev.phaseStates];
			newPhaseStates[currentIndex] = SubscriptionPhaseState.SAVED;

			return {
				...prev,
				isPhaseEditing: false,
				phaseStates: newPhaseStates,
			};
		});
	};

	// Cancel phase editing
	const cancelPhaseEditing = () => {
		setState((prev) => {
			// If the phase state is 'new', remove it instead of restoring
			if (prev.phaseStates[prev.selectedPhase] === SubscriptionPhaseState.NEW) {
				const filteredPhases = prev.phases.filter((_, i) => i !== prev.selectedPhase);
				const filteredPhaseStates = prev.phaseStates.filter((_, i) => i !== prev.selectedPhase);
				const newSelectedPhase = Math.max(0, prev.selectedPhase - 1);

				return {
					...prev,
					phases: filteredPhases,
					phaseStates: filteredPhaseStates,
					selectedPhase: newSelectedPhase,
					isPhaseEditing: false,
					originalPhases: [...filteredPhases],
				};
			}

			// Restore the original phase data
			const restoredPhases = [...prev.phases];
			if (prev.originalPhases[prev.selectedPhase]) {
				restoredPhases[prev.selectedPhase] = { ...prev.originalPhases[prev.selectedPhase] };
			}

			const newPhaseStates = [...prev.phaseStates];
			newPhaseStates[prev.selectedPhase] = SubscriptionPhaseState.SAVED;

			return {
				...prev,
				phases: restoredPhases,
				isPhaseEditing: false,
				phaseStates: newPhaseStates,
			};
		});
	};

	const addPhase = () => {
		// Don't allow adding a new phase if one is being edited, unless it's the only phase
		if (state.isPhaseEditing && state.phases.length > 1) {
			toast.error('Please save or cancel your current changes first');
			return;
		}

		setState((prev) => {
			// Check if the last phase has an end date
			const lastPhase = prev.phases[prev.phases.length - 1];
			if (!lastPhase.end_date) {
				toast.error('Please set an end date for the last phase before adding a new one');
				return prev;
			}

			const newPhase = getEmptyPhase(prev.billingCycle);
			// Set the start date of the new phase to the end date of the last phase
			if (prev.phases.length > 0) {
				if (lastPhase.end_date) {
					newPhase.start_date = new Date(lastPhase.end_date);
				}
			}

			const updatedPhases = [...prev.phases, newPhase];
			const newPhaseStates = [...prev.phaseStates];

			// If there's only one phase and it's in edit mode, save it first
			if (prev.phases.length === 1 && prev.isPhaseEditing) {
				newPhaseStates[0] = SubscriptionPhaseState.SAVED;
			}

			// Add the new phase state
			newPhaseStates.push(SubscriptionPhaseState.NEW);

			return {
				...prev,
				phases: updatedPhases,
				phaseStates: newPhaseStates,
				selectedPhase: updatedPhases.length - 1,
				isPhaseEditing: true,
				originalPhases: [...updatedPhases], // Store for cancellation
			};
		});
	};

	const removePhase = (index: number) => {
		// Don't allow removing a phase if any phase is being edited
		if (state.isPhaseEditing) {
			toast.error('Please save or cancel your current changes first');
			return;
		}

		setState((prev) => {
			if (prev.phases.length <= 1) {
				// Don't remove the last phase
				toast.error('At least one phase is required');
				return prev;
			}

			const newPhases = prev.phases.filter((_, i) => i !== index);
			const newPhaseStates = prev.phaseStates.filter((_, i) => i !== index);
			const newSelectedPhase = prev.selectedPhase >= index ? Math.max(0, prev.selectedPhase - 1) : prev.selectedPhase;

			// Ensure we adjust dates for phases after the removed phase
			if (index < newPhases.length - 1 && index > 0) {
				const prevPhase = newPhases[index - 1];
				const nextPhase = newPhases[index];
				// Connect the previous phase to the next phase
				if (nextPhase && prevPhase) {
					nextPhase.start_date = prevPhase.end_date || nextPhase.start_date;
				}
			}

			return {
				...prev,
				phases: newPhases,
				phaseStates: newPhaseStates,
				selectedPhase: newSelectedPhase,
				originalPhases: [...newPhases],
			};
		});
	};

	const updatePhase = (index: number, updates: Partial<SubscriptionPhase>) => {
		setState((prev) => {
			const newPhases = [...prev.phases];
			const currentPhase = { ...newPhases[index], ...updates };

			// Validate date sequencing
			if ('start_date' in updates && updates.start_date) {
				const startDate = new Date(updates.start_date);

				// If this phase has an end date, ensure start date is before end date
				if (currentPhase.end_date) {
					const endDate = new Date(currentPhase.end_date);
					if (startDate > endDate) {
						toast.error('Start date cannot be after end date');
						return prev;
					}
				}

				// If this isn't the first phase, ensure start date is not before previous phase's start date
				if (index > 0) {
					const prevPhase = newPhases[index - 1];
					const prevStartDate = new Date(prevPhase.start_date);
					if (startDate < prevStartDate) {
						toast.error('Phase start date cannot be before previous phase start date');
						return prev;
					}

					// Update previous phase's end date to match this phase's start date
					prevPhase.end_date = updates.start_date;
				}
			}

			if ('end_date' in updates) {
				if (updates.end_date) {
					const endDate = new Date(updates.end_date);

					// Ensure end date is after start date
					if (currentPhase.start_date) {
						const startDate = new Date(currentPhase.start_date);
						if (endDate < startDate) {
							toast.error('End date cannot be before start date');
							return prev;
						}
					}

					// If this isn't the last phase, update next phase's start date
					if (index < newPhases.length - 1) {
						const nextPhase = newPhases[index + 1];
						nextPhase.start_date = updates.end_date;
					}
				} else {
					// If end date is being removed (set to null/undefined)
					// and this is not the last phase, don't allow it
					if (index < newPhases.length - 1) {
						toast.error('Cannot remove end date for phases with a following phase');
						return prev;
					}
				}
			}

			newPhases[index] = currentPhase;
			return { ...prev, phases: newPhases };
		});
	};

	return (
		<div className='p-4 rounded-lg border border-gray-300 space-y-4'>
			<FormHeader title='Subscription Details' variant='sub-header' />

			{!plansLoading && (
				<Select
					value={state.selectedPlan}
					options={plansWithCharges}
					onChange={handlePlanChange}
					label='Plan*'
					disabled={isDisabled}
					placeholder='Select plan'
					error={plansError ? 'Failed to load plans' : undefined}
				/>
			)}

			{state.selectedPlan && state.billingPeriodOptions.length > 0 && (
				<Select
					key={state.billingPeriodOptions.map((opt) => opt.value).join(',')}
					value={state.billingPeriod}
					options={state.billingPeriodOptions}
					onChange={handleBillingPeriodChange}
					label='Billing Period*'
					disabled={isDisabled}
					placeholder='Select billing period'
				/>
			)}

			{state.selectedPlan && state.prices?.charges[state.billingPeriod] && (
				<Select
					key={Object.keys(state.prices.charges[state.billingPeriod]).join(',')}
					value={state.currency}
					options={Object.keys(state.prices.charges[state.billingPeriod]).map((currency) => ({
						label: currency.toUpperCase(),
						value: currency,
					}))}
					onChange={(value) => setState((prev) => ({ ...prev, currency: value }))}
					label='Select Currency*'
					placeholder='Select currency'
					disabled={isDisabled}
				/>
			)}

			{/* Subscription Phases Section */}
			{state.selectedPlan && (
				<div className='space-y-3 mt-4 pt-3 border-t border-gray-200'>
					<div className='flex items-center justify-between mb-2'>
						<Label label='Subscription Phases' />
					</div>

					{/* Map through phases and conditionally render edit or preview */}
					{state.phases.map((phase, index) => {
						const isSelected = index === state.selectedPhase;
						const isEditing = isSelected && state.isPhaseEditing;
						const startDate = phase.start_date ? new Date(phase.start_date as any).toLocaleDateString() : 'Not set';
						const endDate = phase.end_date ? new Date(phase.end_date as any).toLocaleDateString() : 'Forever';

						// If this phase is selected and in edit mode, render edit view
						if (isEditing) {
							return (
								<div key={index} className='space-y-6 rounded-md'>
									{/* charges */}
									{state.prices && state.selectedPlan && state.billingPeriod && state.currency && (
										<div className='mb-2'>
											<ChargeTable data={state.prices.charges[state.billingPeriod][state.currency]} />
										</div>
									)}

									{/* credit grants */}
									<CreditGrantTable
										getEmptyCreditGrant={getEmptyCreditGrant}
										data={phase.credit_grants || []}
										onChange={(data) => {
											updatePhase(index, { credit_grants: data });
										}}
										disabled={isDisabled}
									/>

									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div>
											<Label label='Start Date' />
											<DatePicker
												date={phase.start_date ? new Date(phase.start_date as any) : undefined}
												setDate={(date) => {
													if (date) {
														updatePhase(index, { start_date: date });
													}
												}}
												disabled={isDisabled || index > 0} // Disable if not the first phase
												maxDate={phase.end_date ? new Date(phase.end_date as any) : undefined}
											/>
										</div>
										<div>
											<Label label='End Date' />
											<DatePicker
												date={phase.end_date ? new Date(phase.end_date as any) : undefined}
												setDate={(date) => {
													updatePhase(index, { end_date: date ?? null });
												}}
												placeholder='Forever'
												disabled={isDisabled}
												minDate={phase.start_date ? new Date(phase.start_date as any) : undefined}
											/>
										</div>
									</div>

									<div>
										<BillingCycleSelector
											value={phase.billing_cycle ?? BILLING_CYCLE.ANNIVERSARY}
											onChange={(value) => {
												updatePhase(index, { billing_cycle: value });
											}}
											disabled={isDisabled}
										/>
									</div>

									<div className='mt-4'>
										<Label label='Prorate Charges' />
										<Toggle
											disabled
											description='Prorate Charges'
											checked={state.prorate_charges ?? false}
											onChange={(value) => setState((prev) => ({ ...prev, prorate_charges: value }))}
										/>
									</div>

									<div className='mt-4 flex items-center gap-2'>
										<span>
											<Input
												placeholder='1200'
												value={phase.commitment_amount?.toString() ?? ''}
												variant='formatted-number'
												label='Commitment Amount'
												inputPrefix={getCurrencySymbol(state.currency)}
												onChange={(e) => {
													if (e === '') {
														updatePhase(index, {
															commitment_amount: 0,
														});
													} else {
														updatePhase(index, {
															commitment_amount: parseFloat(e),
														});
													}
												}}
											/>
										</span>
										<span>
											<Input
												placeholder='1.3'
												value={phase.overage_factor?.toString() ?? ''}
												variant='formatted-number'
												label='Overage Factor'
												onChange={(e) => {
													if (e === '') {
														updatePhase(index, {
															overage_factor: 1,
														});
													} else {
														updatePhase(index, {
															overage_factor: parseFloat(e),
														});
													}
												}}
											/>
										</span>
									</div>

									{/* Save/Cancel Buttons - only show when editing and there's more than one phase */}
									{!isDisabled && state.phases.length > 1 && (
										<div className='flex items-center justify-end space-x-3 mt-3 pt-3'>
											<Button variant='outline' onClick={cancelPhaseEditing} className='min-w-[80px] text-sm py-1 px-3'>
												Cancel
											</Button>
											<Button onClick={savePhaseChanges} className='min-w-[80px] text-sm py-1 px-3'>
												Save
											</Button>
										</div>
									)}
								</div>
							);
						}

						// Otherwise render preview with reduced opacity when another phase is being edited
						return (
							<div
								key={index}
								className={`group flex items-center justify-between p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 mb-2 ${state.isPhaseEditing ? 'opacity-50 border-gray-300' : ''}`}>
								<div
									className={`flex-1 ${state.isPhaseEditing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
									onClick={() => !state.isPhaseEditing && handlePhaseChange(index)}>
									<div className='text-sm font-medium'>
										{startDate} → {endDate}
									</div>
									<div className='text-xs text-gray-500'>{state.prices?.name || 'Selected plan'} x 1</div>
								</div>

								{!isDisabled && !state.isPhaseEditing && (
									<span className='text-[#18181B] flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity'>
										<button onClick={() => handlePhaseChange(index)} className='p-1 hover:bg-gray-100 rounded-md'>
											<Pencil size={16} />
										</button>
										<div className='border-r h-[16px] border-[#E4E4E7]' />
										<button onClick={() => removePhase(index)} className='p-1 hover:bg-gray-100 rounded-md text-red-500'>
											<Trash2 size={16} />
										</button>
									</span>
								)}
							</div>
						);
					})}

					{/* Add Phase Button - always show but disable when editing except if only 1 phase*/}
					{!isDisabled && (
						<div className='flex justify-center mt-6'>
							<AddButton
								size='sm'
								label='Add Phase'
								variant='outline'
								onClick={addPhase}
								disabled={state.isPhaseEditing && state.phases.length > 1}
								className='w-full text-sm py-1.5'
							/>
						</div>
					)}
				</div>
			)}

			{state.startDate && state.endDate && (
				<div className='mt-4 p-3 bg-blue-50 rounded-md text-sm'>
					<p className='font-medium'>Subscription Period:</p>
					<p>From: {state.startDate.toLocaleDateString()}</p>
					<p>To: {state.endDate ? state.endDate.toLocaleDateString() : 'Forever'}</p>
				</div>
			)}
		</div>
	);
};

const CustomerSubscription: React.FC = () => {
	const { id: customerId, subscription_id } = useParams<Params>();
	const { isDevelopment } = useEnvironment();
	const navigate = useNavigate();
	const updateBreadcrumb = useBreadcrumbsStore((state) => state.updateBreadcrumb);

	// Fetch data using React Query
	const { data: plans, isLoading: plansLoading, isError: plansError } = usePlans();
	const { data: customerData } = useCustomerData(customerId);
	const { data: subscriptionData } = useSubscriptionData(subscription_id);

	// Local state
	const [subscriptionState, setSubscriptionState] = useState<SubscriptionFormState>({
		selectedPlan: '',
		prices: null,
		billingPeriod: BILLING_PERIOD.MONTHLY,
		currency: '',
		billingPeriodOptions: [],
		startDate: new Date(),
		endDate: undefined,
		billingCycle: BILLING_CYCLE.ANNIVERSARY,
		prorate_charges: false,
		phases: [],
		selectedPhase: 0,
		phaseStates: [],
		isPhaseEditing: false,
		originalPhases: [],
	});

	// Update breadcrumb when customer data changes
	useEffect(() => {
		if (customerData?.external_id) {
			updateBreadcrumb(2, customerData.external_id);
		}
	}, [customerData, updateBreadcrumb]);

	// Initialize subscription state when subscription data is available
	useEffect(() => {
		if (subscriptionData?.details && plans) {
			const planDetails = plans.find((plan) => plan.id === subscriptionData.details.plan_id);
			if (planDetails) {
				// Create initial phase
				const initialPhase: SubscriptionPhase = {
					billing_cycle: subscriptionData.details.billing_cycle as BILLING_CYCLE,
					start_date: new Date(subscriptionData.details.start_date),
					end_date: subscriptionData.details.end_date ? new Date(subscriptionData.details.end_date) : null,
					line_items: [],
					credit_grants: [],
					prorate_charges: false,
				};

				setSubscriptionState({
					selectedPlan: subscriptionData.details.plan_id,
					prices: planDetails,
					billingPeriod: subscriptionData.details.billing_period.toLowerCase() as BILLING_PERIOD,
					currency: subscriptionData.details.currency,
					billingPeriodOptions: Object.keys(planDetails.charges).map((period) => ({
						label: toSentenceCase(period.replace('_', ' ')),
						value: period,
					})),
					startDate: new Date(subscriptionData.details.start_date),
					endDate: subscriptionData.details.end_date ? new Date(subscriptionData.details.end_date) : undefined,
					billingCycle: subscriptionData.details.billing_cycle as BILLING_CYCLE,
					prorate_charges: false,
					phases: [initialPhase],
					selectedPhase: 0,
					phaseStates: [SubscriptionPhaseState.SAVED],
					isPhaseEditing: false,
					originalPhases: [initialPhase],
				});
			}
		}
	}, [subscriptionData, plans]);

	// Create subscription mutation
	const { mutate: createSubscription, isPending: isCreating } = useMutation({
		mutationKey: ['createSubscription'],
		mutationFn: async (data: CreateCustomerSubscriptionPayload) => {
			return await CustomerApi.createCustomerSubscription(data);
		},
		onSuccess: async () => {
			toast.success('Subscription created successfully');
			navigate(`${RouteNames.customers}/${customerId}`);

			if (isDevelopment) {
				invalidateQueries(['debug-customers', 'debug-subscriptions']);
			}
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Error creating subscription');
		},
	});

	const handleSubscriptionSubmit = () => {
		const { billingPeriod, selectedPlan, currency, startDate, endDate, billingCycle, phases } = subscriptionState;

		if (!billingPeriod || !selectedPlan) {
			toast.error('Please select a plan and billing period.');
			return;
		}

		if (!billingCycle) {
			toast.error('Please select a billing cycle.');
			return;
		}

		if (!startDate) {
			toast.error('Please select a start date.');
			return;
		}

		if (phases.length === 0) {
			toast.error('Please add at least one phase.');
			return;
		}

		// Check for any unsaved changes
		if (subscriptionState.isPhaseEditing) {
			toast.error('Please save your changes before submitting.');
			return;
		}

		const payload: CreateCustomerSubscriptionPayload = {
			billing_cadence: BILLING_CADENCE.RECURRING,
			billing_period: billingPeriod.toUpperCase() as BILLING_PERIOD,
			billing_period_count: 1,
			currency,
			customer_id: customerId!,
			invoice_cadence: INVOICE_CADENCE.ARREAR,
			plan_id: selectedPlan,
			start_date: startDate?.toISOString() ?? '',
			end_date: endDate?.toISOString() ?? null,
			lookup_key: '',
			trial_end: null,
			trial_start: null,
			billing_cycle: billingCycle,
			phases,
		};

		createSubscription(payload);
	};

	const navigateBack = () => navigate(`${RouteNames.customers}/${customerId}`);

	const showPreview = subscriptionState.selectedPlan && !subscriptionData?.usage;

	return (
		<div className={cn('flex gap-8 mt-5 relative mb-12')}>
			<ApiDocsContent tags={['Subscriptions']} />
			<div className='flex-[6] space-y-6 mb-12 overflow-y-auto pr-4'>
				{subscriptionData?.usage?.charges && subscriptionData.usage.charges.length > 0 && (
					<div>
						<UsageTable data={subscriptionData.usage} />
					</div>
				)}

				<SubscriptionForm
					state={subscriptionState}
					setState={setSubscriptionState}
					plans={plans}
					plansLoading={plansLoading}
					plansError={plansError}
					isDisabled={!!subscription_id}
				/>

				{subscriptionState.selectedPlan && !subscription_id && (
					<div className='flex items-center justify-start space-x-4'>
						<Button onClick={navigateBack} className='bg-gray-100 text-black px-4 py-2 rounded-md hover:bg-primary-dark'>
							Cancel
						</Button>
						<Button onClick={handleSubscriptionSubmit} isLoading={isCreating}>
							Add Subscription
						</Button>
					</div>
				)}
			</div>

			<div className='flex-[4]'>
				<div className='sticky top-6'>
					{showPreview && (
						<Preview
							billingCycle={subscriptionState.billingCycle}
							startDate={subscriptionState.startDate!}
							data={subscriptionState.prices?.charges[subscriptionState.billingPeriod][subscriptionState.currency] ?? []}
							selectedPlan={subscriptionState.prices}
							phases={subscriptionState.phases}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default CustomerSubscription;
