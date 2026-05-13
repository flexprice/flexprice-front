import { Button, Loader, Page } from '@/components/atoms';
import { Plan } from '@/models/Plan';
import Addon from '@/models/Addon';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PlanApi, AddonApi, PriceApi, CostSheetApi } from '@/api';
import { CreateBulkPriceRequest, CreatePriceRequest } from '@/types/dto';
import toast from 'react-hot-toast';
import { AddChargesButton, InternalPrice } from '@/components/organisms/PlanForm/SetupChargesSection';
import { currencyOptions } from '@/constants/constants';
import { RecurringChargesForm } from '@/components/organisms/PlanForm';
import UsagePricingForm, { PriceInternalState } from '@/components/organisms/PlanForm/UsagePricingForm';
import { RouteNames } from '@/core/routes/Routes';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { RectangleRadiogroup, RectangleRadiogroupOption } from '@/components/molecules';
import { Gauge, Repeat } from 'lucide-react';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_MODEL, PRICE_TYPE, PRICE_ENTITY_TYPE, PRICE_UNIT_TYPE, BILLING_PERIOD } from '@/models/Price';
import { logger } from '@/utils/common/Logger';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

// ===== TYPES & CONSTANTS =====

export enum ENTITY_TYPE {
	PLAN = 'PLAN',
	ADDON = 'ADDON',
	COST_SHEET = 'COSTSHEET',
}

// Using PriceInternalState enum instead of local type

const CHARGE_OPTIONS: RectangleRadiogroupOption[] = [
	{
		label: 'Fixed charges',
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
	billing_period: BILLING_PERIOD.MONTHLY,
	type: type,
	isEdit: true,
	billing_period_count: 1,
	invoice_cadence: INVOICE_CADENCE.ARREAR,
	billing_model: type === PRICE_TYPE.FIXED ? BILLING_MODEL.FLAT_FEE : undefined,
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
			} else if (entityType === ENTITY_TYPE.ADDON) {
				return await AddonApi.Get(entityId);
			} else {
				return await CostSheetApi.GetCostSheetById(entityId);
			}
		},
		enabled: !!entityId,
		retry: 2,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	// ===== MUTATIONS =====
	const { mutateAsync: createBulkPrices, isPending: isCreatingPrices } = useMutation({
		mutationFn: async (prices: CreateBulkPriceRequest) => {
			return await PriceApi.CreateBulkPrice(prices);
		},
	});

	const isPending = isCreatingPrices;

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
		if (entityType === ENTITY_TYPE.PLAN) return PRICE_ENTITY_TYPE.PLAN;
		if (entityType === ENTITY_TYPE.ADDON) return PRICE_ENTITY_TYPE.ADDON;
		return PRICE_ENTITY_TYPE.COST_SHEET;
	}, [entityType]);

	const routeName = useMemo(() => {
		if (entityType === ENTITY_TYPE.PLAN) return RouteNames.plan;
		if (entityType === ENTITY_TYPE.ADDON) return RouteNames.addonDetails;
		return RouteNames.costSheetDetails;
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

	const handleSaveConfirm = useCallback(async () => {
		// Prepare prices for bulk creation
		const allPrices = [...state.recurringCharges, ...state.usageCharges];

		if (allPrices.length === 0) {
			toast.error('No prices to create');
			return;
		}

		// Convert internal prices to CreatePriceRequest format, filtering out invalid ones
		const priceRequests = allPrices.map((price) => {
			const priceUnitType = price.price_unit_type || PRICE_UNIT_TYPE.FIAT;
			const request: CreatePriceRequest = {
				currency: price.currency!,
				entity_type: priceEntityType,
				entity_id: entityId,
				type: price.type!,
				price_unit_type: priceUnitType,
				billing_period: price.billing_period!,
				billing_period_count: price.billing_period_count || 1,
				billing_model: price.billing_model!,
				meter_id: price.meter_id,
				filter_values: price.filter_values || undefined,
				lookup_key: price.lookup_key,
				invoice_cadence: price.invoice_cadence || INVOICE_CADENCE.ARREAR,
				trial_period_days: price.trial_period_days,
				description: price.description,
				display_name: price.display_name,
				metadata: price.metadata || undefined,
				transform_quantity: price.transform_quantity || undefined,
				group_id: price.group_id,
				min_quantity: price.min_quantity,
				start_date: price.start_date ? new Date(price.start_date).toISOString() : undefined,
			};

			// Sanitize: explicitly set amount, tiers, and tier_mode based on price_unit_type
			if (priceUnitType === PRICE_UNIT_TYPE.FIAT) {
				// Only include amount if it's not empty string
				if (price.amount && price.amount.trim() !== '') {
					request.amount = price.amount;
				}
				request.tier_mode = price.tier_mode;
				request.tiers =
					price.tiers?.map((tier) => ({
						up_to: tier.up_to,
						unit_amount: tier.unit_amount,
						flat_amount: tier.flat_amount,
					})) || undefined;
			} else if (priceUnitType === PRICE_UNIT_TYPE.CUSTOM) {
				// Explicitly delete these fields for CUSTOM price units (don't send empty strings or undefined)
				// This ensures they are completely omitted from the request
				delete request.amount;
				delete request.tiers;
				delete request.tier_mode;
				// Include price_unit_config when price_unit_type is CUSTOM
				if (price.price_unit_config) {
					request.price_unit_config = price.price_unit_config;
				}
			}

			return request;
		});

		const bulkPriceRequest: CreateBulkPriceRequest = {
			items: priceRequests,
		};

		try {
			// Create prices using bulk API - wait for success response
			await createBulkPrices(bulkPriceRequest);
			toast.success(`Prices created successfully for ${entityType.toLowerCase()}`);
			refetchQueries(['fetchPlan', entityId]);
			if (entityType === ENTITY_TYPE.ADDON) {
				refetchQueries(['fetchAddon', entityId]);
			} else if (entityType === ENTITY_TYPE.COST_SHEET) {
				refetchQueries(['fetchCostSheet', entityId]);
			}

			navigate(`${routeName}/${entityId}`);
			onSuccess?.();
		} catch (error: unknown) {
			logger.error('Error saving charges:', error);
			const errorMessage =
				error instanceof Error
					? error.message || 'An error occurred while processing charges'
					: 'An error occurred while processing charges';
			toast.error(errorMessage);
		}
	}, [state.recurringCharges, state.usageCharges, priceEntityType, entityId, createBulkPrices, navigate, entityType, routeName, onSuccess]);

	// Fixed charges handlers
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
		<Page documentTitle={`Add Charges to ${entityName || entityType}`} heading={`Add Charges to ${entityName || entityType}`}>
			<div className='space-y-6'>
				{/* Fixed charges section */}
				{state.recurringCharges.map((charge, index) => (
					<div key={`recurring-${index}`}>
						<RecurringChargesForm
							price={charge}
							entityType={priceEntityType}
							entityId={entityId}
							entityName={entityData?.name || entityName}
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
							label='Add fixed charge'
							aria-label={`Add fixed charge to ${entityType.toLowerCase()}`}
						/>
						<AddChargesButton
							onClick={() => handleAddNewPrice(PRICE_TYPE.USAGE)}
							label='Add Usage Based Charges'
							aria-label={`Add usage-based charges to ${entityType.toLowerCase()}`}
						/>
					</div>
				)}

				{/* Save Button */}
				<div className='flex justify-start'>
					<Button
						isLoading={isPending}
						disabled={!canSave}
						onClick={handleSaveConfirm}
						aria-label={canSave ? `Save ${entityType.toLowerCase()} charges` : 'Cannot save - complete all charge forms first'}>
						Save
					</Button>
				</div>
			</div>
		</Page>
	);
};

export default EntityChargesPage;
