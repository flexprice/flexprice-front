import { Button, Checkbox, FormHeader, Input, Select, SelectFeature, Sheet, Spacer, Toggle } from '@/components/atoms';
import { getFeatureIcon } from '@/components/atoms/SelectFeature/SelectFeature';
import { AddChargesButton } from '@/components/organisms/PlanForm/SetupChargesSection';

import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Entitlement, ENTITLEMENT_ENTITY_TYPE, ENTITLEMENT_USAGE_RESET_PERIOD } from '@/models/Entitlement';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { METER_USAGE_RESET_PERIOD } from '@/models/Meter';
import EntitlementApi from '@/api/EntitlementApi';
import { CreateBulkEntitlementRequest, CreateEntitlementRequest } from '@/types/dto/Entitlement';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
	planId?: string;
	selectedFeatures?: Feature[];
	entitlements?: Entitlement[];
	entityType?: ENTITLEMENT_ENTITY_TYPE;
	entityId?: string;
	refetchQueryKeys?: string[];
}

interface ValidationErrors {
	usage_limit?: string;
	static_value?: string;
	usage_reset_period?: string;
	is_enabled?: string;
	general?: string;
	feature?: string;
}

// Constants moved outside component for better performance
const ENTITLEMENT_USAGE_RESET_PERIOD_OPTIONS = [
	{ label: 'Daily', value: ENTITLEMENT_USAGE_RESET_PERIOD.DAILY },
	{ label: 'Weekly', value: ENTITLEMENT_USAGE_RESET_PERIOD.WEEKLY },
	{ label: 'Monthly', value: ENTITLEMENT_USAGE_RESET_PERIOD.MONTHLY },
	{ label: 'Quarterly', value: ENTITLEMENT_USAGE_RESET_PERIOD.QUARTERLY },
	{ label: 'Half-Yearly', value: ENTITLEMENT_USAGE_RESET_PERIOD.HALF_YEARLY },
	{ label: 'Yearly', value: ENTITLEMENT_USAGE_RESET_PERIOD.ANNUAL },
	{ label: 'Never', value: ENTITLEMENT_USAGE_RESET_PERIOD.NEVER },
];

// Validation functions extracted for better reusability and testing
const validateMeteredFeature = (activeFeature: Feature | null, tempEntitlement: Partial<Entitlement>): ValidationErrors => {
	const newErrors: ValidationErrors = {};

	if (!activeFeature?.meter_id) {
		newErrors.feature = 'Feature must have an associated meter';
		return newErrors;
	}

	const isInfinite = tempEntitlement.usage_limit === null;
	const isResetNever = activeFeature?.meter?.reset_usage === METER_USAGE_RESET_PERIOD.NEVER;

	// If reset period is set to NEVER, usage limit is required (cannot be infinite)
	if (isResetNever) {
		if (tempEntitlement.usage_limit !== undefined && tempEntitlement.usage_limit !== null && tempEntitlement.usage_limit < 0) {
			newErrors.usage_limit = 'Usage limit cannot be negative';
		}
	} else {
		// Normal validation for usage limit when reset is not NEVER
		if (tempEntitlement.usage_limit === undefined) {
			newErrors.usage_limit = 'Usage limit is required';
		} else if (tempEntitlement.usage_limit !== null && tempEntitlement.usage_limit < 0) {
			newErrors.usage_limit = 'Usage limit cannot be negative';
		}
	}

	// If user sets to infinite, don't require usage reset period
	// If reset is NEVER, usage reset period is not applicable
	if (!isInfinite && !isResetNever) {
		if (!tempEntitlement.usage_reset_period) {
			newErrors.usage_reset_period = 'Usage reset period is required';
		}
	}

	return newErrors;
};

const validateStaticFeature = (tempEntitlement: Partial<Entitlement>): ValidationErrors => {
	const newErrors: ValidationErrors = {};

	const staticValue = tempEntitlement.static_value;
	if (staticValue === undefined || staticValue === null) {
		newErrors.static_value = 'Value is required';
	} else if (typeof staticValue === 'number' && staticValue < 0) {
		newErrors.static_value = 'Value cannot be negative';
	} else if (typeof staticValue === 'string' && !staticValue.trim()) {
		newErrors.static_value = 'Value cannot be empty';
	}

	return newErrors;
};

const validateEntitlement = (activeFeature: Feature | null, tempEntitlement: Partial<Entitlement>): ValidationErrors => {
	if (!activeFeature) {
		return { feature: 'Please select a feature' };
	}

	switch (activeFeature.type) {
		case FEATURE_TYPE.METERED:
			return validateMeteredFeature(activeFeature, tempEntitlement);
		case FEATURE_TYPE.STATIC:
			return validateStaticFeature(tempEntitlement);
		case FEATURE_TYPE.BOOLEAN:
			// Boolean features don't need additional validation
			return {};
		default:
			return { feature: 'Invalid feature type' };
	}
};

const AddEntitlementDrawer: FC<Props> = ({
	isOpen,
	onOpenChange,
	planId,
	selectedFeatures: disabledFeatures,
	entitlements: initialEntitlements,
	entityType = ENTITLEMENT_ENTITY_TYPE.PLAN,
	entityId,
	refetchQueryKeys,
}) => {
	const [entitlements, setEntitlements] = useState<Partial<Entitlement>[]>([]);
	const [errors, setErrors] = useState<ValidationErrors>({});
	const [, setSelectedFeatures] = useState<Feature[]>(disabledFeatures ?? []);

	const [showSelect, setShowSelect] = useState(true);
	const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
	const [tempEntitlement, setTempEntitlement] = useState<Partial<Entitlement>>({});

	// Memoize existing feature IDs to prevent unnecessary recalculations
	const existingFeatureIds = useMemo(() => initialEntitlements?.map((ent) => ent.feature_id) || [], [initialEntitlements]);

	// Reset all states when drawer closes
	const resetState = useCallback(() => {
		setEntitlements([]);
		setErrors({});
		setSelectedFeatures(disabledFeatures ?? []);
		setShowSelect(true);
		setActiveFeature(null);
		setTempEntitlement({});
	}, [disabledFeatures]);

	// Memoize already added feature IDs (from entitlements + initial entitlements)
	const alreadyAddedFeatureIds = useMemo(() => {
		const currentEntitlementFeatureIds = entitlements.map((ent) => ent.feature_id).filter(Boolean) as string[];
		return [...new Set([...currentEntitlementFeatureIds, ...existingFeatureIds])];
	}, [entitlements, existingFeatureIds]);

	// Handle drawer close
	const handleDrawerClose = (value: boolean) => {
		if (!value) {
			resetState();
		}
		onOpenChange(value);
	};

	// Reset states when drawer opens/closes
	useEffect(() => {
		if (isOpen) {
			setSelectedFeatures(disabledFeatures ?? []);
		} else {
			resetState();
		}
	}, [isOpen, disabledFeatures, resetState]);

	// Memoized validation function
	const validateCurrentEntitlement = useCallback((): boolean => {
		const validationErrors = validateEntitlement(activeFeature, tempEntitlement);
		setErrors(validationErrors);
		return Object.keys(validationErrors).length === 0;
	}, [activeFeature, tempEntitlement]);

	const { mutate: createBulkEntitlements, isPending } = useMutation({
		mutationKey: ['createBulkEntitlements', entitlements],
		mutationFn: async () => {
			if (!entityId) {
				throw new Error('Entity ID is required');
			}

			// Convert entitlements to CreateEntitlementRequest format
			const entitlementRequests: CreateEntitlementRequest[] = entitlements.map((entitlement) => ({
				plan_id: planId,
				feature_id: entitlement.feature_id!,
				feature_type: entitlement.feature_type! as FEATURE_TYPE,
				is_enabled: entitlement.is_enabled,
				usage_limit: entitlement.usage_limit,
				usage_reset_period: entitlement.usage_reset_period as ENTITLEMENT_USAGE_RESET_PERIOD | undefined,
				is_soft_limit: entitlement.is_soft_limit,
				static_value: entitlement.static_value,
				entity_type: entityType,
				entity_id: entityId,
			}));

			const bulkRequest: CreateBulkEntitlementRequest = {
				items: entitlementRequests,
			};

			return await EntitlementApi.createBulkEntitlement(bulkRequest);
		},
		onSuccess: () => {
			toast.success('Entitlements added successfully');
			handleDrawerClose(false);
			// Use provided refetch query keys or fall back to default plan behavior
			if (refetchQueryKeys) {
				refetchQueryKeys.forEach((queryKey) => {
					refetchQueries(queryKey);
				});
			} else {
				refetchQueries(['fetchPlan', planId || '']);
				refetchQueries(['fetchEntitlements', planId || '']);
			}
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to add entitlements. Please try again.');
			setErrors({ general: 'Failed to add entitlements. Please try again.' });
		},
	});

	const handleSubmit = () => {
		if (entitlements.length === 0) {
			setErrors({ general: 'Please add at least one entitlement' });
			toast.error('Please add at least one entitlement');
			return;
		}
		createBulkEntitlements();
	};

	const handleAdd = useCallback((): void => {
		if (!activeFeature) return;

		if (!validateCurrentEntitlement()) {
			return;
		}

		// Check if feature is already in entitlements or initial entitlements
		const isFeatureAlreadyAdded = alreadyAddedFeatureIds.includes(activeFeature.id);

		if (isFeatureAlreadyAdded) {
			setErrors({ feature: 'This feature is already added' });
			toast.error('This feature is already added');
			return;
		}

		const newEntitlement: Partial<Entitlement> = {
			...tempEntitlement,
			feature: activeFeature,
			feature_id: activeFeature.id,
			feature_type: activeFeature.type,
			is_enabled: activeFeature.type === FEATURE_TYPE.BOOLEAN ? true : undefined,
			entity_type: entityType,
			entity_id: entityId || '',
		};

		setEntitlements((prev) => [...prev, newEntitlement]);
		setTempEntitlement({});
		setActiveFeature(null);
		setErrors({});
	}, [activeFeature, validateCurrentEntitlement, alreadyAddedFeatureIds, tempEntitlement, entityType, entityId]);

	// Clear errors when feature changes
	useEffect(() => {
		setErrors({});
	}, [activeFeature]);

	// Memoized error display component
	const ErrorDisplay = useMemo(() => {
		if (!errors.general) return null;
		return <div className='p-3 rounded-md bg-red-50 text-red-600 text-sm mb-4'>{errors.general}</div>;
	}, [errors.general]);

	// Memoized feature error display component
	const FeatureErrorDisplay = useMemo(() => {
		if (!errors.feature) return null;
		return <div className='p-3 rounded-md bg-red-50 text-red-600 text-sm mb-4'>{errors.feature}</div>;
	}, [errors.feature]);

	const handleCancel = useCallback(() => {
		setShowSelect(true);
		setActiveFeature(null);
		setErrors({});
		// Remove the feature from selectedFeatures if it was added but not saved
		if (activeFeature) {
			setSelectedFeatures((prev) => prev.filter((feature) => feature.id !== activeFeature.id));
		}
		setTempEntitlement({});
	}, [activeFeature]);

	return (
		<div>
			<Sheet
				isOpen={isOpen}
				onOpenChange={handleDrawerClose}
				title={'Add Entitlement'}
				description={'Define the features that customers will be entitled to.'}>
				<div className='space-y-4 mt-6'>
					{ErrorDisplay}

					{entitlements.map((entitlement, index) => (
						<div
							key={`${entitlement.feature_id}-${index}`}
							className='rounded-md border !p-2 !px-3 flex w-full justify-between items-center'>
							<p className='text-[#18181B] text-sm font-medium'>{entitlement.feature?.name}</p>
							<button
								onClick={() => {
									setEntitlements((prev) => prev.filter((_, i) => i !== index));
									setSelectedFeatures((prev) => prev.filter((feature) => feature.id !== entitlement.feature?.id));
								}}>
								<X className='size-4' />
							</button>
						</div>
					))}

					{showSelect && (
						<SelectFeature
							disabledFeatures={alreadyAddedFeatureIds}
							onChange={(feature) => {
								if (feature.type === FEATURE_TYPE.BOOLEAN) {
									// Automatically add boolean features
									const booleanEntitlement: Partial<Entitlement> = {
										feature: feature,
										feature_id: feature.id,
										feature_type: feature.type,
										is_enabled: true,
									};
									setEntitlements((prev) => [...prev, booleanEntitlement]);
									setSelectedFeatures((prev) => [...prev, feature]);
									setShowSelect(true);
									setErrors({});
								} else {
									// For non-boolean features, show the configuration form
									setActiveFeature(feature);
									setSelectedFeatures((prev) => [...prev, feature]);
									setShowSelect(false);
									setErrors({});
								}
							}}
							label='Features'
							placeholder='Select feature'
							value={activeFeature?.id}
						/>
					)}

					{activeFeature && (
						<div className='card p-4'>
							{FeatureErrorDisplay}
							<div className='flex justify-between items-start gap-4'>
								<FormHeader title={activeFeature?.name} variant='sub-header' />
								<span className='mt-1'>{getFeatureIcon(activeFeature?.type)}</span>
							</div>

							{/* metered feature */}
							{activeFeature.type === FEATURE_TYPE.METERED && (
								<div>
									{/* {activeFeature.type === FeatureType.metered && activeFeature.meter_id && (
										<div className='w-full flex justify-between items-center'>
											<span className='text-muted-foreground text-sm font-sans'>Meter</span>
											<span className='text-[#09090B] text-sm font-sans'>{activeFeature.meter?.name}</span>
										</div>
									)} */}
									{/* <Spacer className='!my-6' /> */}
									<Input
										error={errors.usage_limit}
										label='Value'
										placeholder='Enter value'
										disabled={tempEntitlement.usage_limit === null}
										variant='formatted-number'
										value={tempEntitlement.usage_limit === null ? 'Unlimited' : tempEntitlement.usage_limit?.toString() || ''}
										onChange={(value) => {
											const numValue = value === '' ? undefined : Number(value);
											setTempEntitlement((prev) => ({
												...prev,
												usage_limit: numValue,
											}));
										}}
										suffix={<span className='text-muted-foreground text-xs font-sans'>{activeFeature.unit_plural || 'units'}</span>}
									/>
									<Spacer className='!my-4' />
									<Checkbox
										id='set-infinite'
										label='Set to infinite'
										checked={tempEntitlement.usage_limit === null}
										onCheckedChange={(e) => {
											setTempEntitlement((prev) => ({
												...prev,
												usage_limit: e ? null : undefined,
												usage_reset_period: e ? null : undefined,
											}));
										}}
									/>
									<Spacer className='!my-4' />
									<Select
										disabled={tempEntitlement.usage_limit === null || activeFeature.meter?.reset_usage === METER_USAGE_RESET_PERIOD.NEVER}
										error={errors.usage_reset_period}
										label='Usage reset'
										placeholder='Select usage reset period'
										options={ENTITLEMENT_USAGE_RESET_PERIOD_OPTIONS}
										description='The values get reset in the given interval'
										value={tempEntitlement.usage_reset_period ?? ''}
										onChange={(value) => {
											setTempEntitlement((prev) => ({
												...prev,
												usage_reset_period: value as ENTITLEMENT_USAGE_RESET_PERIOD,
											}));
										}}
									/>
									<Spacer className='!my-4' />
									<Toggle
										checked={tempEntitlement.is_soft_limit ?? false}
										label='Soft Limit'
										description='If enabled, access is always granted, even if the limit is exceeded.'
										onChange={(value) => {
											setTempEntitlement((prev) => ({
												...prev,
												is_soft_limit: value,
											}));
										}}
									/>
								</div>
							)}

							{/* static features */}
							{activeFeature.type === FEATURE_TYPE.STATIC && (
								<div>
									<Input
										error={errors.static_value}
										label='Value'
										value={tempEntitlement.static_value === undefined ? '' : tempEntitlement.static_value.toString()}
										placeholder='Enter value'
										onChange={(value) => {
											setTempEntitlement((prev) => ({
												...prev,
												static_value: value === '' ? undefined : value,
											}));
										}}
									/>
								</div>
							)}

							<div className='w-full mt-6 flex justify-end gap-2'>
								<Button onClick={handleCancel} variant={'outline'}>
									Cancel
								</Button>
								<Button onClick={handleAdd}>Add</Button>
							</div>
						</div>
					)}
				</div>

				<div className='!space-y-4 mt-4'>
					{!showSelect && !activeFeature && <AddChargesButton onClick={() => setShowSelect(true)} label='Add another feature' />}
					<Button isLoading={isPending} onClick={handleSubmit} disabled={isPending || (!showSelect && !!activeFeature)}>
						Save
					</Button>
				</div>
			</Sheet>
		</div>
	);
};

export default AddEntitlementDrawer;
