import { useState } from 'react';
import { Button } from '@/components/atoms';
import PhaseForm, { PhaseFormData } from './PhaseForm';
import { SubscriptionPhaseCreateRequest } from '@/types/dto/Subscription';
import { Price } from '@/models/Price';
import { BILLING_PERIOD } from '@/constants/constants';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { Coupon } from '@/models/Coupon';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import { BILLING_MODEL, TIER_MODE } from '@/models/Price';
import { convertSubscriptionToPhaseData } from '@/utils/subscription/phaseConversion';
import { formatDateShort } from '@/utils/common/helper_functions';

interface PhaseListProps {
	phases: SubscriptionPhaseCreateRequest[];
	onChange: (phases: SubscriptionPhaseCreateRequest[]) => void;
	prices: Price[];
	billingPeriod: BILLING_PERIOD;
	currency: string;
	disabled?: boolean;
	subscriptionStartDate: Date;
	subscriptionEndDate?: Date;
	allCoupons?: Coupon[];
	// Subscription-level data for conversion to first phase
	subscriptionData?: {
		startDate: string;
		endDate?: string;
		linkedCoupon: Coupon | null;
		lineItemCoupons: Record<string, Coupon>;
		priceOverrides: Record<string, ExtendedPriceOverride>;
	};
	// Callback when converting to phases (first add)
	onConvertToPhases?: () => void;
	// Callback when converting back to subscription (last phase deleted)
	onConvertBackToSubscription?: (subscriptionData: {
		startDate: string;
		endDate?: string;
		linkedCoupon: Coupon | null;
		lineItemCoupons: Record<string, Coupon>;
		priceOverrides: Record<string, ExtendedPriceOverride>;
	}) => void;
}

const PhaseList: React.FC<PhaseListProps> = ({
	phases,
	onChange,
	prices,
	billingPeriod,
	currency,
	disabled = false,
	subscriptionStartDate,
	subscriptionEndDate,
	allCoupons = [],
	subscriptionData,
	onConvertToPhases,
	onConvertBackToSubscription,
}) => {
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	const handleAddPhase = () => {
		if (disabled || editingIndex !== null || isCreating) return;

		// First phase: Convert subscription data to phases
		if (phases.length === 0) {
			// Validate that subscription end date is set
			if (!subscriptionEndDate) {
				toast.error('Please set a subscription end date before adding phases.');
				return;
			}

			if (!subscriptionData) {
				toast.error('Subscription data is not available.');
				return;
			}

			// Convert subscription data to first phase
			const firstPhaseData = convertSubscriptionToPhaseData(subscriptionData);
			const firstPhaseDTO = convertPhaseFormToDTO(firstPhaseData);

			// Add first phase to the array
			onChange([firstPhaseDTO]);

			// Notify parent that we've converted to phases
			if (onConvertToPhases) {
				onConvertToPhases();
			}

			// Set creating mode for second phase
			setIsCreating(true);
			return;
		}

		// Subsequent phases: Check if previous phase has end_date
		if (phases.length > 0) {
			const lastPhase = phases[phases.length - 1];
			if (!lastPhase.end_date) {
				toast.error('Please set an end date for the previous phase before adding a new phase.');
				return;
			}
		}

		setIsCreating(true);
	};

	const handleEditPhase = (index: number) => {
		if (disabled || editingIndex !== null || isCreating) return;
		setEditingIndex(index);
	};

	const handleDeletePhase = (index: number) => {
		if (disabled || editingIndex !== null || isCreating) return;

		// Create a copy of phases without the deleted phase
		const newPhases = phases.filter((_, i) => i !== index);

		// If this is the last remaining phase, convert it back to subscription-level data
		if (newPhases.length === 1) {
			const lastPhase = newPhases[0];

			// Convert the last phase back to subscription data
			const phaseFormData = convertDTOToPhaseForm(lastPhase, allCoupons);

			const subscriptionDataToRestore = {
				startDate: phaseFormData.start_date.toISOString(),
				endDate: phaseFormData.end_date ? phaseFormData.end_date.toISOString() : undefined,
				linkedCoupon: phaseFormData.coupons.length > 0 ? phaseFormData.coupons[0] : null,
				lineItemCoupons: phaseFormData.line_item_coupons,
				priceOverrides: phaseFormData.priceOverrides,
			};

			// Clear all phases and restore subscription data
			onChange([]);

			// Notify parent to restore subscription-level fields
			if (onConvertBackToSubscription) {
				onConvertBackToSubscription(subscriptionDataToRestore);
			}

			return;
		}

		// If there's a previous phase (index > 0), update its end_date to the deleted phase's end_date
		if (index > 0 && phases[index]) {
			const deletedPhase = phases[index];
			const previousPhaseIndex = index - 1;

			// Update the previous phase's end_date to the deleted phase's end_date
			newPhases[previousPhaseIndex] = {
				...newPhases[previousPhaseIndex],
				end_date: deletedPhase.end_date,
			};
		}

		onChange(newPhases);
	};

	// Helper to convert PhaseFormData to SubscriptionPhaseCreateRequest
	const convertPhaseFormToDTO = (phaseFormData: PhaseFormData): SubscriptionPhaseCreateRequest => {
		return {
			start_date: phaseFormData.start_date.toISOString(),
			end_date: phaseFormData.end_date ? phaseFormData.end_date.toISOString() : undefined,
			coupons: phaseFormData.coupons.length > 0 ? phaseFormData.coupons.map((c) => c.id) : undefined,
			line_item_coupons:
				Object.keys(phaseFormData.line_item_coupons).length > 0
					? Object.fromEntries(Object.entries(phaseFormData.line_item_coupons).map(([priceId, coupon]) => [priceId, [coupon.id]]))
					: undefined,
			override_line_items:
				Object.keys(phaseFormData.priceOverrides).length > 0
					? Object.entries(phaseFormData.priceOverrides).map(([priceId, override]) => {
							// Convert SLAB_TIERED to TIERED + SLAB for backend
							let billingModel = override.billing_model;
							let tierMode = override.tier_mode;

							if (override.billing_model === 'SLAB_TIERED') {
								billingModel = BILLING_MODEL.TIERED;
								tierMode = TIER_MODE.SLAB;
							} else if (override.billing_model === BILLING_MODEL.TIERED) {
								tierMode = TIER_MODE.VOLUME;
							}

							return {
								price_id: priceId,
								...(override.amount !== undefined && { amount: parseFloat(override.amount) }),
								...(override.quantity !== undefined && { quantity: override.quantity }),
								...(billingModel !== undefined && { billing_model: billingModel as BILLING_MODEL }),
								...(tierMode !== undefined && { tier_mode: tierMode }),
								...(override.tiers !== undefined && { tiers: override.tiers }),
								...(override.transform_quantity !== undefined && { transform_quantity: override.transform_quantity }),
							};
						})
					: undefined,
			metadata: Object.keys(phaseFormData.metadata).length > 0 ? phaseFormData.metadata : undefined,
		};
	};

	// Helper to convert SubscriptionPhaseCreateRequest to PhaseFormData
	const convertDTOToPhaseForm = (phase: SubscriptionPhaseCreateRequest, allCoupons: Coupon[]): PhaseFormData => {
		// Convert coupon IDs to Coupon objects
		const phaseCoupons: Coupon[] =
			phase.coupons?.map((couponId) => allCoupons.find((c) => c.id === couponId)).filter((c): c is Coupon => c !== undefined) || [];

		const phaseLineItemCoupons: Record<string, Coupon> = {};
		if (phase.line_item_coupons) {
			Object.entries(phase.line_item_coupons).forEach(([priceId, couponIds]) => {
				if (couponIds?.[0]) {
					const coupon = allCoupons.find((c) => c.id === couponIds[0]);
					if (coupon) phaseLineItemCoupons[priceId] = coupon;
				}
			});
		}

		// Convert override_line_items to ExtendedPriceOverride format
		const priceOverrides: Record<string, ExtendedPriceOverride> = {};
		if (phase.override_line_items) {
			phase.override_line_items.forEach((override) => {
				// Convert TIERED + SLAB back to SLAB_TIERED for UI
				let billingModel: BILLING_MODEL | 'SLAB_TIERED' | undefined = override.billing_model;
				if (override.billing_model === BILLING_MODEL.TIERED && override.tier_mode === TIER_MODE.SLAB) {
					billingModel = 'SLAB_TIERED';
				}

				priceOverrides[override.price_id] = {
					price_id: override.price_id,
					amount: override.amount?.toString(),
					quantity: override.quantity,
					billing_model: billingModel,
					tier_mode: override.tier_mode,
					tiers: override.tiers,
					transform_quantity: override.transform_quantity,
				};
			});
		}

		return {
			start_date: new Date(phase.start_date),
			end_date: phase.end_date ? new Date(phase.end_date) : null,
			coupons: phaseCoupons,
			line_item_coupons: phaseLineItemCoupons,
			priceOverrides,
			metadata: phase.metadata || {},
		};
	};

	const handleSavePhase = (phaseFormData: PhaseFormData) => {
		const phaseDTO = convertPhaseFormToDTO(phaseFormData);

		if (isCreating) {
			// Adding new phase
			onChange([...phases, phaseDTO]);
			setIsCreating(false);
		} else if (editingIndex !== null) {
			// Updating existing phase
			const newPhases = [...phases];
			const oldPhase = newPhases[editingIndex];

			// Check if start_date or end_date was updated
			const hasPreviousPhase = editingIndex > 0;
			const hasNextPhase = editingIndex < phases.length - 1;
			const startDateChanged = oldPhase.start_date !== phaseDTO.start_date;
			const endDateChanged = oldPhase.end_date !== phaseDTO.end_date;

			// Handle start_date change
			if (hasPreviousPhase && startDateChanged) {
				const previousPhase = newPhases[editingIndex - 1];
				const newStartDate = new Date(phaseDTO.start_date);

				// Validate: new start_date must be after previous phase's start_date
				const previousPhaseStartDate = new Date(previousPhase.start_date);
				if (newStartDate <= previousPhaseStartDate) {
					toast.error("Phase start date must be after the previous phase's start date.");
					return;
				}

				// Update current phase
				newPhases[editingIndex] = phaseDTO;

				// Update previous phase's end_date to match current phase's start_date
				newPhases[editingIndex - 1] = {
					...previousPhase,
					end_date: phaseDTO.start_date,
				};
			} else {
				// Update current phase
				newPhases[editingIndex] = phaseDTO;
			}

			// Handle end_date change (only if start_date wasn't changed to avoid double updates)
			if (hasNextPhase && endDateChanged && phaseDTO.end_date && !startDateChanged) {
				const nextPhase = newPhases[editingIndex + 1];
				const newEndDate = new Date(phaseDTO.end_date);

				// Validate: new end_date must be before next phase's end_date (if it exists)
				if (nextPhase.end_date) {
					const nextPhaseEndDate = new Date(nextPhase.end_date);
					if (newEndDate >= nextPhaseEndDate) {
						toast.error("Phase end date must be before the next phase's end date.");
						return;
					}
				}

				// Update next phase's start_date to match current phase's end_date
				newPhases[editingIndex + 1] = {
					...nextPhase,
					start_date: phaseDTO.end_date,
				};
			}

			onChange(newPhases);
			setEditingIndex(null);
		}
	};

	const handleCancelEdit = () => {
		setEditingIndex(null);
		setIsCreating(false);
	};

	return (
		<div className='space-y-6'>
			{phases.length > 0 && (
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-base font-semibold text-gray-900'>Subscription Phases</h3>
				</div>
			)}

			{/* Existing Phases */}
			{phases.map((phase, index) => {
				const isEditing = editingIndex === index;
				const startDate = formatDateShort(phase.start_date);
				const endDate = phase.end_date ? formatDateShort(phase.end_date) : 'Forever';

				if (isEditing) {
					const isAfterFirstPhase = index > 0;
					const previousPhase = isAfterFirstPhase ? phases[index - 1] : null;
					const previousPhaseStartDate = previousPhase ? new Date(previousPhase.start_date) : subscriptionStartDate;
					const hasNextPhase = index < phases.length - 1;
					const nextPhase = hasNextPhase ? phases[index + 1] : null;
					const nextPhaseEndDate = nextPhase?.end_date ? new Date(nextPhase.end_date) : subscriptionEndDate;

					// Convert DTO to PhaseFormData
					const phaseFormData = convertDTOToPhaseForm(phase, allCoupons);

					return (
						<PhaseForm
							key={`edit-${index}`}
							initialData={phaseFormData}
							prices={prices}
							billingPeriod={billingPeriod}
							currency={currency}
							disabled={disabled}
							onSave={handleSavePhase}
							onCancel={handleCancelEdit}
							isEditing={true}
							minStartDate={previousPhaseStartDate}
							maxEndDate={nextPhaseEndDate}
						/>
					);
				}

				return (
					<div
						key={index}
						className='group flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors'>
						<div className='flex items-center space-x-3'>
							<Calendar className='h-5 w-5 text-gray-400' />
							<div>
								<div className='text-sm font-medium text-gray-900'>
									{startDate} → {endDate}
								</div>
								<div className='text-xs text-gray-500 mt-1'>
									Phase {index + 1}
									{phase.coupons && phase.coupons.length > 0 && (
										<span className='ml-2 text-blue-600'>
											• {phase.coupons.length} coupon{phase.coupons.length > 1 ? 's' : ''}
										</span>
									)}
									{phase.line_item_coupons && Object.keys(phase.line_item_coupons).length > 0 && (
										<span className='ml-2 text-green-600'>
											• {Object.keys(phase.line_item_coupons).length} line item coupon
											{Object.keys(phase.line_item_coupons).length > 1 ? 's' : ''}
										</span>
									)}
								</div>
							</div>
						</div>

						{!disabled && editingIndex === null && !isCreating && (
							<div className='flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity'>
								<button
									onClick={() => handleEditPhase(index)}
									className='p-2 hover:bg-gray-100 rounded-md transition-colors'
									title='Edit phase'>
									<Pencil size={16} className='text-gray-600' />
								</button>
								<div className='border-r h-4 border-gray-300' />
								<button
									onClick={() => handleDeletePhase(index)}
									className='p-2 hover:bg-red-50 rounded-md transition-colors'
									title='Delete phase'>
									<Trash2 size={16} className='text-red-500' />
								</button>
							</div>
						)}
					</div>
				);
			})}

			{/* New Phase Form */}
			{isCreating &&
				(() => {
					const isAfterFirstPhase = phases.length > 0;
					const previousPhase = isAfterFirstPhase ? phases[phases.length - 1] : null;
					const previousPhaseStartDate = previousPhase ? new Date(previousPhase.start_date) : subscriptionStartDate;
					const previousPhaseEndDate = previousPhase?.end_date ? new Date(previousPhase.end_date) : null;
					const newPhaseStartDate = previousPhaseEndDate || subscriptionStartDate;

					return (
						<PhaseForm
							initialData={{
								start_date: newPhaseStartDate,
								end_date: null,
								coupons: [],
								line_item_coupons: {},
								priceOverrides: {},
								metadata: {},
							}}
							prices={prices}
							billingPeriod={billingPeriod}
							currency={currency}
							disabled={disabled}
							onSave={handleSavePhase}
							onCancel={handleCancelEdit}
							isEditing={false}
							minStartDate={previousPhaseStartDate}
							maxEndDate={subscriptionEndDate}
						/>
					);
				})()}

			{/* Add Phase Button - Stripe Style */}
			{!disabled && (
				<Button
					onClick={handleAddPhase}
					variant='outline'
					className='w-full !mt-4'
					disabled={disabled || editingIndex !== null || isCreating}>
					+ Add phase
				</Button>
			)}
		</div>
	);
};

export default PhaseList;
