 
import { Select, DatePicker, FormHeader, Label, Toggle } from '@/components/atoms';
import ChargeTable from '@/components/organisms/Subscription/PriceTable';
import { cn } from '@/lib/utils';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { NormalizedPlan } from '@/utils/models/transformed_plan';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import CreditGrantTable from '@/components/molecules/CreditGrant/CreditGrantTable';
import { BILLING_CYCLE, SubscriptionPhase } from '@/models/Subscription';
import {
	CREDIT_GRANT_EXPIRATION_TYPE,
	CREDIT_GRANT_PERIOD,
	CREDIT_GRANT_PERIOD_UNIT,
	CREDIT_SCOPE,
	CreditGrant,
} from '@/models/CreditGrant';
import { BILLING_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { Pencil } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { uniqueId } from 'lodash';
import { SubscriptionFormState, SubscriptionPhaseState } from '@/pages/customer/customers/CustomerSubscription';

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
		const newPhase = getEmptyPhase();

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
		};
	};

	const getEmptyCreditGrant = (): Partial<CreditGrant> => {
		return {
			id: uniqueId(),
			credits: 0,
			currency: state.currency,
			period: CREDIT_GRANT_PERIOD.MONTHLY,
			name: 'Free Credits',
			scope: CREDIT_SCOPE.SUBSCRIPTION,
			cadence: BILLING_CADENCE.ONETIME,
			period_count: 1,
			plan_id: state.selectedPlan,
			expiration_type: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
			expiration_duration_unit: CREDIT_GRANT_PERIOD_UNIT.DAYS,
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
	// const savePhaseChanges = () => {
	// 	const currentIndex = state.selectedPhase;

	// 	setState((prev) => {
	// 		const newPhaseStates = [...prev.phaseStates];
	// 		newPhaseStates[currentIndex] = SubscriptionPhaseState.SAVED;

	// 		return {
	// 			...prev,
	// 			isPhaseEditing: false,
	// 			phaseStates: newPhaseStates,
	// 		};
	// 	});
	// };

	// Cancel phase editing
	// const cancelPhaseEditing = () => {
	// 	setState((prev) => {
	// 		// If the phase state is 'new', remove it instead of restoring
	// 		if (prev.phaseStates[prev.selectedPhase] === SubscriptionPhaseState.NEW) {
	// 			const filteredPhases = prev.phases.filter((_, i) => i !== prev.selectedPhase);
	// 			const filteredPhaseStates = prev.phaseStates.filter((_, i) => i !== prev.selectedPhase);
	// 			const newSelectedPhase = Math.max(0, prev.selectedPhase - 1);

	// 			return {
	// 				...prev,
	// 				phases: filteredPhases,
	// 				phaseStates: filteredPhaseStates,
	// 				selectedPhase: newSelectedPhase,
	// 				isPhaseEditing: false,
	// 				originalPhases: [...filteredPhases],
	// 			};
	// 		}

	// 		// Restore the original phase data
	// 		const restoredPhases = [...prev.phases];
	// 		if (prev.originalPhases[prev.selectedPhase]) {
	// 			restoredPhases[prev.selectedPhase] = { ...prev.originalPhases[prev.selectedPhase] };
	// 		}

	// 		const newPhaseStates = [...prev.phaseStates];
	// 		newPhaseStates[prev.selectedPhase] = SubscriptionPhaseState.SAVED;

	// 		return {
	// 			...prev,
	// 			phases: restoredPhases,
	// 			isPhaseEditing: false,
	// 			phaseStates: newPhaseStates,
	// 		};
	// 	});
	// };

	// const addPhase = () => {
	// 	// Don't allow adding a new phase if one is being edited, unless it's the only phase
	// 	if (state.isPhaseEditing && state.phases.length > 1) {
	// 		toast.error('Please save or cancel your current changes first');
	// 		return;
	// 	}

	// 	setState((prev) => {
	// 		// Check if the last phase has an end date
	// 		const lastPhase = prev.phases[prev.phases.length - 1];
	// 		if (!lastPhase.end_date) {
	// 			toast.error('Please set an end date for the last phase before adding a new one');
	// 			return prev;
	// 		}

	// 		const newPhase = getEmptyPhase();
	// 		// Set the start date of the new phase to the end date of the last phase
	// 		if (prev.phases.length > 0) {
	// 			if (lastPhase.end_date) {
	// 				newPhase.start_date = new Date(lastPhase.end_date);
	// 			}
	// 		}

	// 		const updatedPhases = [...prev.phases, newPhase];
	// 		const newPhaseStates = [...prev.phaseStates];

	// 		// If there's only one phase and it's in edit mode, save it first
	// 		if (prev.phases.length === 1 && prev.isPhaseEditing) {
	// 			newPhaseStates[0] = SubscriptionPhaseState.SAVED;
	// 		}

	// 		// Add the new phase state
	// 		newPhaseStates.push(SubscriptionPhaseState.NEW);

	// 		return {
	// 			...prev,
	// 			phases: updatedPhases,
	// 			phaseStates: newPhaseStates,
	// 			selectedPhase: updatedPhases.length - 1,
	// 			isPhaseEditing: true,
	// 			originalPhases: [...updatedPhases], // Store for cancellation
	// 		};
	// 	});
	// };

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
					{/* {state.phases.length > 0 && (
						<div className='flex items-center justify-between mb-2'>
							<Label label='Subscription Phases' />
						</div>
					)} */}

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
											checked={phase.prorate_charges ?? false}
											onChange={(value) => setState((prev) => ({ ...prev, prorate_charges: value }))}
										/>
									</div>

									{/* <div className='mt-4 flex items-center gap-2'>
										<span>
											<Input
												placeholder='1200'
												value={phase.commitment_amount?.toString() ?? ''}
												variant='formatted-number'
												label='Commitment Amount'
												inputPrefix={getCurrencySymbol(state.currency)}
												onChange={(e) => {
													updatePhase(index, {
														commitment_amount: e as any,
													});
												}}
											/>
										</span>
										<span>
											<Input
												placeholder='1.3'
												value={phase.overage_factor?.toString() ?? ''}
												variant='number'
												label='Overage Factor'
												onChange={(e) => {
													updatePhase(index, {
														overage_factor: e as any,
													});
												}}
											/>
										</span>
									</div> */}

									{/* Save/Cancel Buttons - only show when editing and there's more than one phase */}
									{/* {!isDisabled && state.phases.length > 1 && (
										<div className='flex items-center justify-end space-x-3 mt-3 pt-3'>
											<Button variant='outline' onClick={cancelPhaseEditing} className='min-w-[80px] text-sm py-1 px-3'>
												Cancel
											</Button>
											<Button onClick={savePhaseChanges} className='min-w-[80px] text-sm py-1 px-3'>
												Save
											</Button>
										</div>
									)} */}
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
					{/* {!isDisabled && (
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
					)} */}
				</div>
			)}
		</div>
	);
};

export default SubscriptionForm;
