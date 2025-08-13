import { Button, Loader, Page } from '@/components/atoms';
import { Plan } from '@/models/Plan';
import Addon from '@/models/Addon';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PlanApi } from '@/api/PlanApi';
import AddonApi from '@/api/AddonApi';
import { PriceApi } from '@/api/PriceApi';
import { CreateBulkPriceRequest } from '@/types/dto';
import toast from 'react-hot-toast';
import { AddChargesButton, InternalPrice } from '@/components/organisms/PlanForm/SetupChargesSection';
import { billlingPeriodOptions, currencyOptions } from '@/constants/constants';
import { RecurringChargesForm } from '@/components/organisms/PlanForm';
import UsagePricingForm, { PriceInternalState } from '@/components/organisms/PlanForm/UsagePricingForm';
import { RouteNames } from '@/core/routes/Routes';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { RectangleRadiogroup, RectangleRadiogroupOption, RolloutChargesModal, RolloutOption } from '@/components/molecules';
import { Dialog } from '@/components/ui/dialog';
import { Gauge, Repeat } from 'lucide-react';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_MODEL, PRICE_TYPE, PRICE_ENTITY_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { logger } from '@/utils/common/Logger';
import SubscriptionApi from '@/api/SubscriptionApi';

// ===== TYPES & CONSTANTS =====

export enum ENTITY_TYPE {
	PLAN = 'PLAN',
	ADDON = 'ADDON',
}

const CHARGE_OPTIONS: RectangleRadiogroupOption[] = [
	{
		label: 'Recurring Charges',
		value: PRICE_TYPE.FIXED,
		icon: Repeat,
		description: 'Billed on a fixed schedule (monthly, yearly, etc.)',
	},
	{
		label: 'Usage Charges',
		value: PRICE_TYPE.USAGE,
		icon: Gauge,
		description: 'Pay only for what customers actually use',
	},
];

// ===== HELPER FUNCTIONS =====
const createEmptyPrice = (type: PRICE_TYPE): InternalPrice => ({
	amount: '',
	currency: currencyOptions[0].value,
	billing_period: billlingPeriodOptions[1].value,
	type: type,
	isEdit: true,
	billing_period_count: 1,
	invoice_cadence: INVOICE_CADENCE.ARREAR,
	billing_model: type === PRICE_TYPE.FIXED ? BILLING_MODEL.FLAT_FEE : undefined,
	billing_cadence: BILLING_CADENCE.RECURRING,
	internal_state: PriceInternalState.NEW,
});

const updatePriceInArray = <T extends InternalPrice>(
	array: T[],
	index: number,
	updates: Partial<T>,
	state: PriceInternalState = PriceInternalState.SAVED,
): T[] => {
	return array.map((item, i) => (i === index ? { ...item, ...updates, internal_state: state } : item));
};

// ===== STATE MANAGEMENT WITH REDUCER =====
type ChargesState = {
	tempEntity: Partial<Plan | Addon>;
	recurringCharges: InternalPrice[];
	usageCharges: InternalPrice[];
};

enum ChargeActionType {
	SET_TEMP_ENTITY = 'SET_TEMP_ENTITY',
	ADD_RECURRING_CHARGE = 'ADD_RECURRING_CHARGE',
	ADD_USAGE_CHARGE = 'ADD_USAGE_CHARGE',
	UPDATE_RECURRING_CHARGE = 'UPDATE_RECURRING_CHARGE',
	UPDATE_USAGE_CHARGE = 'UPDATE_USAGE_CHARGE',
	DELETE_RECURRING_CHARGE = 'DELETE_RECURRING_CHARGE',
	DELETE_USAGE_CHARGE = 'DELETE_USAGE_CHARGE',
}

type ChargesAction =
	| { type: ChargeActionType.SET_TEMP_ENTITY; payload: Partial<Plan | Addon> }
	| { type: ChargeActionType.ADD_RECURRING_CHARGE; payload: InternalPrice }
	| { type: ChargeActionType.ADD_USAGE_CHARGE; payload: InternalPrice }
	| {
			type: ChargeActionType.UPDATE_RECURRING_CHARGE;
			payload: { index: number; charge: Partial<InternalPrice>; state?: PriceInternalState };
	  }
	| { type: ChargeActionType.UPDATE_USAGE_CHARGE; payload: { index: number; charge: Partial<InternalPrice>; state?: PriceInternalState } }
	| { type: ChargeActionType.DELETE_RECURRING_CHARGE; payload: number }
	| { type: ChargeActionType.DELETE_USAGE_CHARGE; payload: number };

const initialState: ChargesState = {
	tempEntity: {},
	recurringCharges: [],
	usageCharges: [],
};

const chargesReducer = (state: ChargesState, action: ChargesAction): ChargesState => {
	switch (action.type) {
		case ChargeActionType.SET_TEMP_ENTITY:
			return { ...state, tempEntity: action.payload };

		case ChargeActionType.ADD_RECURRING_CHARGE:
			return {
				...state,
				recurringCharges: [...state.recurringCharges, action.payload],
			};

		case ChargeActionType.ADD_USAGE_CHARGE:
			return {
				...state,
				usageCharges: [...state.usageCharges, action.payload],
			};

		case ChargeActionType.UPDATE_RECURRING_CHARGE:
			return {
				...state,
				recurringCharges: updatePriceInArray(state.recurringCharges, action.payload.index, action.payload.charge, action.payload.state),
			};

		case ChargeActionType.UPDATE_USAGE_CHARGE:
			return {
				...state,
				usageCharges: updatePriceInArray(state.usageCharges, action.payload.index, action.payload.charge, action.payload.state),
			};

		case ChargeActionType.DELETE_RECURRING_CHARGE:
			return {
				...state,
				recurringCharges: state.recurringCharges.filter((_, i) => i !== action.payload),
			};

		case ChargeActionType.DELETE_USAGE_CHARGE:
			return {
				...state,
				usageCharges: state.usageCharges.filter((_, i) => i !== action.payload),
			};

		default:
			return state;
	}
};

// ===== MAIN COMPONENT =====
interface EntityChargesPageProps {
	entityType: ENTITY_TYPE;
	entityId: string;
	entityName?: string;
	onSuccess?: () => void;
}

const EntityChargesPage: React.FC<EntityChargesPageProps> = ({ entityType, entityId, entityName, onSuccess }) => {
	// ===== HOOKS & STATE =====
	const navigate = useNavigate();
	const { updateBreadcrumb } = useBreadcrumbsStore();
	const [state, dispatch] = useReducer(chargesReducer, initialState);
	const [showRolloutModal, setShowRolloutModal] = useState(false);

	// ===== DATA FETCHING =====
	const {
		data: entityData,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: [entityType.toLowerCase(), entityId],
		queryFn: async () => {
			if (entityType === ENTITY_TYPE.PLAN) {
				return await PlanApi.getPlanById(entityId);
			} else {
				return await AddonApi.GetAddonById(entityId);
			}
		},
		enabled: !!entityId,
	});

	// ===== EXISTING SUBSCRIPTIONS (only for plans) =====
	const { data: existingSubscriptions } = useQuery({
		queryKey: ['subscriptions', entityId],
		queryFn: () =>
			SubscriptionApi.listSubscriptions({
				plan_id: entityId,
				limit: 10,
			}),
		enabled: !!entityId && entityType === ENTITY_TYPE.PLAN,
	});

	// ===== MUTATIONS =====
	const { mutateAsync: createBulkPrices, isPending: isCreatingPrices } = useMutation({
		mutationFn: async (prices: CreateBulkPriceRequest) => {
			return await PriceApi.CreateBulkPrice(prices);
		},
		onError: (error: ServerError) => {
			toast.error(error?.error?.message || 'Error creating prices');
			setShowRolloutModal(false);
		},
	});

	const { mutateAsync: syncPlanCharges, isPending: isSyncing } = useMutation({
		mutationFn: () => PlanApi.synchronizePlanPricesWithSubscription(entityId),
		onError: (error: ServerError) => {
			toast.error(error?.error?.message || 'Error synchronizing charges with subscriptions');
		},
	});

	const isPending = isCreatingPrices || isSyncing;

	// ===== MEMOIZED VALUES =====
	const isAnyPriceInEditMode = useMemo(() => {
		return [...state.recurringCharges, ...state.usageCharges].some(
			(price) => price.internal_state === PriceInternalState.EDIT || price.internal_state === PriceInternalState.NEW,
		);
	}, [state.recurringCharges, state.usageCharges]);

	const hasAnyCharges = useMemo(() => {
		return state.recurringCharges.length > 0 || state.usageCharges.length > 0;
	}, [state.recurringCharges, state.usageCharges]);

	const canSave = useMemo(() => {
		return !isPending && !isAnyPriceInEditMode && hasAnyCharges;
	}, [isPending, isAnyPriceInEditMode, hasAnyCharges]);

	const priceEntityType = useMemo(() => {
		return entityType === ENTITY_TYPE.PLAN ? PRICE_ENTITY_TYPE.PLAN : PRICE_ENTITY_TYPE.ADDON;
	}, [entityType]);

	const routeName = useMemo(() => {
		return entityType === ENTITY_TYPE.PLAN ? RouteNames.plan : RouteNames.addonDetails;
	}, [entityType]);

	// ===== MEMOIZED CALLBACKS =====
	const handleAddNewPrice = useCallback((type: PRICE_TYPE) => {
		const newPrice = createEmptyPrice(type);

		if (type === PRICE_TYPE.FIXED) {
			dispatch({ type: ChargeActionType.ADD_RECURRING_CHARGE, payload: newPrice });
		} else {
			dispatch({ type: ChargeActionType.ADD_USAGE_CHARGE, payload: newPrice });
		}
	}, []);

	const handleSave = () => {
		if (entityType === ENTITY_TYPE.PLAN && existingSubscriptions?.items?.length && existingSubscriptions.items.length > 0) {
			// Show rollout modal for plans with existing subscriptions
			setShowRolloutModal(true);
		} else {
			// For addons or plans without subscriptions, update directly
			handleRolloutConfirm(RolloutOption.NEW_ONLY);
		}
	};

	const handleRolloutConfirm = useCallback(
		async (option: RolloutOption) => {
			// Prepare prices for bulk creation
			const allPrices = [...state.recurringCharges, ...state.usageCharges];

			if (allPrices.length === 0) {
				toast.error('No prices to create');
				return;
			}

			// Convert internal prices to CreatePriceRequest format, filtering out invalid ones
			const priceRequests = allPrices.map((price) => ({
				amount: price.amount!,
				currency: price.currency!,
				entity_type: priceEntityType,
				entity_id: entityId,
				type: price.type!,
				price_unit_type: price.price_unit_type || PRICE_UNIT_TYPE.FIAT,
				billing_period: price.billing_period!,
				billing_period_count: price.billing_period_count || 1,
				billing_model: price.billing_model!,
				billing_cadence: price.billing_cadence || BILLING_CADENCE.RECURRING,
				meter_id: price.meter_id,
				filter_values: price.filter_values || undefined,
				lookup_key: price.lookup_key,
				invoice_cadence: price.invoice_cadence || INVOICE_CADENCE.ARREAR,
				trial_period: price.trial_period,
				description: price.description,
				metadata: price.metadata || undefined,
				tier_mode: price.tier_mode,
				tiers:
					price.tiers?.map((tier) => ({
						up_to: tier.up_to,
						unit_amount: tier.unit_amount,
						flat_amount: tier.flat_amount,
					})) || undefined,
				transform_quantity: price.transform_quantity || undefined,
				price_unit_config: price.price_unit_config,
			}));

			const bulkPriceRequest: CreateBulkPriceRequest = {
				items: priceRequests,
			};

			setShowRolloutModal(false);

			try {
				// Create prices using bulk API
				await createBulkPrices(bulkPriceRequest);
				toast.success(`Prices created successfully for ${entityType.toLowerCase()}`);

				// If user selected to sync with existing subscriptions (only for plans)
				if (entityType === ENTITY_TYPE.PLAN && option === RolloutOption.EXISTING_ALSO) {
					await syncPlanCharges();
				}

				// Navigate to entity details page
				navigate(`${routeName}/${entityId}`);
				onSuccess?.();
			} catch (error) {
				logger.error('Error in rollout process:', error);
			}
		},
		[
			state.recurringCharges,
			state.usageCharges,
			priceEntityType,
			entityId,
			createBulkPrices,
			syncPlanCharges,
			navigate,
			entityType,
			routeName,
			onSuccess,
		],
	);

	const handleRolloutCancel = useCallback(() => {
		setShowRolloutModal(false);
	}, []);

	// Recurring charges handlers
	const handleRecurringChargeAdd = useCallback((index: number, charge: Partial<InternalPrice>) => {
		dispatch({
			type: ChargeActionType.UPDATE_RECURRING_CHARGE,
			payload: { index, charge, state: PriceInternalState.SAVED },
		});
	}, []);

	const handleRecurringChargeUpdate = useCallback((index: number, price: Partial<InternalPrice>) => {
		dispatch({
			type: ChargeActionType.UPDATE_RECURRING_CHARGE,
			payload: { index, charge: price, state: PriceInternalState.SAVED },
		});
	}, []);

	const handleRecurringChargeEdit = useCallback((index: number) => {
		dispatch({
			type: ChargeActionType.UPDATE_RECURRING_CHARGE,
			payload: { index, charge: {}, state: PriceInternalState.EDIT },
		});
	}, []);

	const handleRecurringChargeDelete = useCallback((index: number) => {
		dispatch({ type: ChargeActionType.DELETE_RECURRING_CHARGE, payload: index });
	}, []);

	// Usage charges handlers
	const handleUsageChargeAdd = useCallback((index: number, charge: Partial<InternalPrice>) => {
		dispatch({
			type: ChargeActionType.UPDATE_USAGE_CHARGE,
			payload: { index, charge, state: PriceInternalState.SAVED },
		});
	}, []);

	const handleUsageChargeUpdate = useCallback((index: number, charge: Partial<InternalPrice>) => {
		dispatch({
			type: ChargeActionType.UPDATE_USAGE_CHARGE,
			payload: { index, charge, state: PriceInternalState.SAVED },
		});
	}, []);

	const handleUsageChargeEdit = useCallback((index: number) => {
		dispatch({
			type: ChargeActionType.UPDATE_USAGE_CHARGE,
			payload: { index, charge: {}, state: PriceInternalState.EDIT },
		});
	}, []);

	const handleUsageChargeDelete = useCallback((index: number) => {
		dispatch({ type: ChargeActionType.DELETE_USAGE_CHARGE, payload: index });
	}, []);

	// ===== EFFECTS =====
	useEffect(() => {
		if (entityData?.name) {
			updateBreadcrumb(2, entityData.name);
		}
	}, [entityData?.name, updateBreadcrumb]);

	useEffect(() => {
		if (entityData) {
			dispatch({ type: ChargeActionType.SET_TEMP_ENTITY, payload: entityData });
		}
	}, [entityData]);

	// ===== ERROR HANDLING =====
	useEffect(() => {
		if (isError && error) {
			toast.error(`Error fetching ${entityType.toLowerCase()} data`);
		}
	}, [isError, error, entityType]);

	// ===== LOADING & ERROR STATES =====
	if (isLoading) return <Loader />;
	if (isError) return null;

	// ===== RENDER =====
	return (
		<Page heading={`Add Charges to ${entityName || entityType}`}>
			{/* Rollout Charges Modal (only for plans) */}
			{entityType === ENTITY_TYPE.PLAN && (
				<Dialog open={showRolloutModal} onOpenChange={setShowRolloutModal}>
					<RolloutChargesModal
						onCancel={handleRolloutCancel}
						onConfirm={handleRolloutConfirm}
						isLoading={isPending}
						planName={entityData?.name}
					/>
				</Dialog>
			)}

			<div className='space-y-6'>
				<div className='p-6 rounded-xl border border-[#E4E4E7] space-y-4'>
					{/* Recurring Charges Section */}
					{state.recurringCharges.map((charge, index) => (
						<div key={`recurring-${index}`}>
							<RecurringChargesForm
								price={charge}
								entityType={priceEntityType}
								entityId={entityId}
								onAdd={(charge) => handleRecurringChargeAdd(index, charge)}
								onUpdate={(price) => handleRecurringChargeUpdate(index, price)}
								onDeleteClicked={() => handleRecurringChargeDelete(index)}
								onEditClicked={() => handleRecurringChargeEdit(index)}
							/>
						</div>
					))}

					{/* Usage Charges Section */}
					{state.usageCharges.map((charge, index) => (
						<div key={`usage-${index}`}>
							<UsagePricingForm
								price={charge}
								entityType={priceEntityType}
								entityId={entityId}
								onAdd={(charge) => handleUsageChargeAdd(index, charge)}
								onUpdate={(charge) => handleUsageChargeUpdate(index, charge)}
								onEditClicked={() => handleUsageChargeEdit(index)}
								onDeleteClicked={() => handleUsageChargeDelete(index)}
							/>
						</div>
					))}

					{/* Add Charge Buttons */}
					{!hasAnyCharges ? (
						<div>
							<RectangleRadiogroup
								title='Select Charge Type'
								options={CHARGE_OPTIONS}
								onChange={(value) => handleAddNewPrice(value as PRICE_TYPE)}
								aria-label={`Select charge type for your ${entityType.toLowerCase()}`}
							/>
						</div>
					) : (
						<div className='flex gap-2' role='group' aria-label='Add charge options'>
							<AddChargesButton
								onClick={() => handleAddNewPrice(PRICE_TYPE.FIXED)}
								label='Add Recurring Charges'
								aria-label={`Add recurring charges to ${entityType.toLowerCase()}`}
							/>
							<AddChargesButton
								onClick={() => handleAddNewPrice(PRICE_TYPE.USAGE)}
								label='Add Usage Based Charges'
								aria-label={`Add usage-based charges to ${entityType.toLowerCase()}`}
							/>
						</div>
					)}
				</div>

				{/* Save Button */}
				<div className='flex justify-start'>
					<Button
						isLoading={isPending}
						disabled={!canSave}
						onClick={handleSave}
						aria-label={canSave ? `Save ${entityType.toLowerCase()} charges` : 'Cannot save - complete all charge forms first'}>
						Save
					</Button>
				</div>
			</div>
		</Page>
	);
};

export default EntityChargesPage;
