import { useState } from 'react';
import { Button, Label } from '@/components/atoms';
import PhaseForm, { PhaseFormData } from './PhaseForm';
import { SubscriptionPhaseCreateRequest } from '@/types/dto/Subscription';
import { Price } from '@/models/Price';
import { BILLING_PERIOD } from '@/constants/constants';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { Coupon } from '@/models/Coupon';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import { BILLING_MODEL, TIER_MODE } from '@/models/Price';

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
}) => {
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	const handleAddPhase = () => {
		if (disabled || editingIndex !== null || isCreating) return;

		// Check if adding a phase after index 0 - previous phase must have end_date
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
		const newPhases = phases.filter((_, i) => i !== index);
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
			newPhases[editingIndex] = phaseDTO;
			onChange(newPhases);
			setEditingIndex(null);
		}
	};

	const handleCancelEdit = () => {
		setEditingIndex(null);
		setIsCreating(false);
	};

	const getPhaseStartDate = (index: number): Date => {
		if (index === 0) {
			return subscriptionStartDate;
		}
		const prevPhase = phases[index - 1];
		return prevPhase.end_date ? new Date(prevPhase.end_date) : subscriptionStartDate;
	};

	const getNextPhaseStartDate = (index: number): Date | undefined => {
		if (index < phases.length - 1) {
			const nextPhase = phases[index + 1];
			return new Date(nextPhase.start_date);
		}
		return subscriptionEndDate;
	};

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<Label label='Subscription Phases' />
				{!disabled && !editingIndex && !isCreating && (
					<Button variant='outline' size='sm' onClick={handleAddPhase} className='text-sm'>
						Add Phase
					</Button>
				)}
			</div>

			{/* Existing Phases */}
			{phases.map((phase, index) => {
				const isEditing = editingIndex === index;
				const startDate = new Date(phase.start_date).toLocaleDateString();
				const endDate = phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'Forever';

				if (isEditing) {
					const isAfterFirstPhase = index > 0;
					const previousPhase = isAfterFirstPhase ? phases[index - 1] : null;
					const previousPhaseEndDate = previousPhase?.end_date ? new Date(previousPhase.end_date) : null;

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
							minStartDate={getPhaseStartDate(index)}
							maxEndDate={getNextPhaseStartDate(index)}
							disableStartDate={isAfterFirstPhase && previousPhaseEndDate !== null}
						/>
					);
				}

				return (
					<div
						key={index}
						className='group flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50'>
						<div className='flex items-center space-x-3'>
							<Calendar className='h-4 w-4 text-gray-500' />
							<div>
								<div className='text-sm font-medium'>
									{startDate} → {endDate}
								</div>
								<div className='text-xs text-gray-500'>
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
								<button onClick={() => handleEditPhase(index)} className='p-1 hover:bg-gray-100 rounded-md'>
									<Pencil size={16} />
								</button>
								<div className='border-r h-4 border-gray-300' />
								<button onClick={() => handleDeletePhase(index)} className='p-1 hover:bg-gray-100 rounded-md text-red-500'>
									<Trash2 size={16} />
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
					const previousPhaseEndDate =
						isAfterFirstPhase && phases[phases.length - 1].end_date ? new Date(phases[phases.length - 1].end_date!) : null;
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
							minStartDate={newPhaseStartDate}
							maxEndDate={subscriptionEndDate}
							disableStartDate={isAfterFirstPhase && previousPhaseEndDate !== null}
						/>
					);
				})()}

			{phases.length === 0 && !isCreating && (
				<div className='text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg'>
					<Calendar className='h-8 w-8 mx-auto mb-2 text-gray-400' />
					<p className='text-sm'>No phases configured</p>
					<p className='text-xs'>Add phases to customize subscription behavior over time</p>
				</div>
			)}
		</div>
	);
};

export default PhaseList;
