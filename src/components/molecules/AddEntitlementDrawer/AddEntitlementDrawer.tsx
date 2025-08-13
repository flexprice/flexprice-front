import { AddActionButton, Button, Checkbox, FormHeader, Input, Select, SelectFeature, Sheet, Spacer, Toggle } from '@/components/atoms';
import { getFeatureIcon } from '@/components/atoms/SelectFeature/SelectFeature';

import { BILLING_PERIOD } from '@/constants/constants';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Entitlement, ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { METER_USAGE_RESET_PERIOD } from '@/models/Meter';
import EntitlementApi from '@/api/EntitlementApi';
import { CreateBulkEntitlementRequest } from '@/types/dto/Entitlement';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { FC, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
	planId?: string;
	selectedFeatures?: Feature[];
	entitlements?: Entitlement[];
	entityType?: ENTITLEMENT_ENTITY_TYPE;
	entityId?: string;
}

interface ValidationErrors {
	usage_limit?: string;
	static_value?: string;
	usage_reset_period?: string;
	is_enabled?: string;
	general?: string;
	feature?: string;
}

// TODO: remove this after we ship the reset usage feature and use billlingPeriodOptions from constants.ts
const billlingPeriodOptions = [
	{ label: 'Daily', value: BILLING_PERIOD.DAILY },
	{ label: 'Monthly', value: BILLING_PERIOD.MONTHLY },
];

const AddEntitlementDrawer: FC<Props> = ({
	isOpen,
	onOpenChange,
	planId,
	selectedFeatures: disabledFeatures,
	entitlements: initialEntitlements,
	entityType = ENTITLEMENT_ENTITY_TYPE.PLAN,
	entityId,
}) => {
	const [entitlements, setEntitlements] = useState<Partial<Entitlement>[]>([]);
	const [errors, setErrors] = useState<ValidationErrors>({});
	const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>(disabledFeatures ?? []);
	const [showSelect, setShowSelect] = useState(true);
	const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
	const [tempEntitlement, setEntitlement] = useState<Partial<Entitlement>>({});

	// Get existing feature IDs from initial entitlements to prevent duplicates
	const existingFeatureIds = initialEntitlements?.map((ent) => ent.feature_id) || [];

	// Reset all states when drawer closes
	const resetState = () => {
		setEntitlements([]);
		setErrors({});
		setSelectedFeatures(disabledFeatures ?? []);
		setShowSelect(true);
		setActiveFeature(null);
		setEntitlement({});
	};

	// Get all feature IDs that are already selected or exist in initial entitlements
	const getAllExistingFeatureIds = () => {
		const selectedFeatureIds = selectedFeatures.map((feature) => feature.id);
		const initialFeatureIds = existingFeatureIds;
		return [...new Set([...selectedFeatureIds, ...initialFeatureIds])];
	};

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
	}, [isOpen, disabledFeatures]);

	const validateMeteredFeature = (): ValidationErrors => {
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
			if (!tempEntitlement.usage_reset_period || tempEntitlement.usage_reset_period === '') {
				newErrors.usage_reset_period = 'Usage reset period is required';
			}
		}

		return newErrors;
	};

	const validateStaticFeature = (): ValidationErrors => {
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

	const validateEntitlement = (): boolean => {
		if (!activeFeature) {
			setErrors({ feature: 'Please select a feature' });
			return false;
		}

		let validationErrors: ValidationErrors = {};

		switch (activeFeature.type) {
			case FEATURE_TYPE.METERED:
				validationErrors = validateMeteredFeature();
				break;
			case FEATURE_TYPE.STATIC:
				validationErrors = validateStaticFeature();
				break;
			case FEATURE_TYPE.BOOLEAN:
				// TODO: Add validation for boolean features if needed
				// validationErrors = validateBooleanFeature();
				break;
			default:
				validationErrors = { feature: 'Invalid feature type' };
		}

		setErrors(validationErrors);
		return Object.keys(validationErrors).length === 0;
	};

	const { mutate: createBulkEntitlements, isPending } = useMutation({
		mutationKey: ['createBulkEntitlements', entitlements],
		mutationFn: async () => {
			if (!entityId) {
				throw new Error('Entity ID is required');
			}

			// Convert entitlements to CreateEntitlementRequest format
			const entitlementRequests = entitlements.map((entitlement) => ({
				plan_id: planId,
				feature_id: entitlement.feature_id!,
				feature_type: entitlement.feature_type! as FEATURE_TYPE,
				is_enabled: entitlement.is_enabled,
				usage_limit: entitlement.usage_limit,
				usage_reset_period: entitlement.usage_reset_period as any,
				is_soft_limit: entitlement.is_soft_limit,
				static_value: entitlement.static_value,
				entity_type: entityType,
				entity_id: entityId,
			}));

			const bulkRequest: CreateBulkEntitlementRequest = {
				items: entitlementRequests,
			};

			return await EntitlementApi.CreateBulkEntitlement(bulkRequest);
		},
		onSuccess: () => {
			toast.success('Entitlements added successfully');
			handleDrawerClose(false);
			refetchQueries(['fetchPlan', planId || '']);
			refetchQueries(['fetchEntitlements', planId || '']);
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

	function handleAdd(): void {
		if (!activeFeature) return;

		if (!validateEntitlement()) {
			// toast.error('Please fix the validation errors');
			return;
		}

		// Check if feature is already in entitlements or initial entitlements
		const isFeatureAlreadyAdded =
			entitlements.some((ent) => ent.feature_id === activeFeature.id) || existingFeatureIds.includes(activeFeature.id);

		if (isFeatureAlreadyAdded) {
			setErrors({ feature: 'This feature is already added' });
			toast.error('This feature is already added');
			return;
		}

		setEntitlements([
			...entitlements,
			{
				...tempEntitlement,
				feature: activeFeature,
				feature_id: activeFeature.id,
				feature_type: activeFeature.type,
				is_enabled: activeFeature.type === FEATURE_TYPE.BOOLEAN ? true : undefined,
				entity_type: entityType,
				entity_id: entityId || '',
			},
		]);
		setEntitlement({});
		setActiveFeature(null);
		setErrors({});
	}

	// Clear errors when feature changes
	useEffect(() => {
		setErrors({});
	}, [activeFeature]);

	const handleCancel = () => {
		setShowSelect(true);
		setActiveFeature(null);
		setErrors({});
		// Remove the feature from selectedFeatures if it was added but not saved
		if (activeFeature) {
			setSelectedFeatures(selectedFeatures.filter((feature) => feature.id !== activeFeature.id));
		}
		setEntitlement({});
	};

	return (
		<div>
			<Sheet
				isOpen={isOpen}
				onOpenChange={handleDrawerClose}
				title={'Add Entitlement'}
				description={'Define the features that customers will be entitled to.'}>
				<div className='space-y-4 mt-6'>
					{errors.general && <div className='p-3 rounded-md bg-red-50 text-red-600 text-sm mb-4'>{errors.general}</div>}

					{entitlements.map((entitlement, index) => (
						<div key={index} className='rounded-md border !p-2 !px-3 flex w-full justify-between items-center'>
							<p className='text-[#18181B] text-sm font-medium'>{entitlement.feature?.name}</p>
							<button
								onClick={() => {
									setEntitlements(entitlements.filter((_, i) => i !== index));
									setSelectedFeatures(selectedFeatures.filter((feature) => feature.id !== entitlement.feature?.id));
								}}>
								<X className='size-4' />
							</button>
						</div>
					))}

					{showSelect && (
						<SelectFeature
							disabledFeatures={getAllExistingFeatureIds()}
							onChange={(feature) => {
								if (feature.type === FEATURE_TYPE.BOOLEAN) {
									// Automatically add boolean features
									setEntitlements([
										...entitlements,
										{
											feature: feature,
											feature_id: feature.id,
											feature_type: feature.type,
											is_enabled: true,
										},
									]);
									setSelectedFeatures([...selectedFeatures, feature]);
									setShowSelect(true);
									setErrors({});
								} else {
									// For non-boolean features, show the configuration form
									setActiveFeature(feature);
									setSelectedFeatures([...selectedFeatures, feature]);
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
							{errors.feature && <div className='p-3 rounded-md bg-red-50 text-red-600 text-sm mb-4'>{errors.feature}</div>}
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
											setEntitlement({
												...tempEntitlement,
												usage_limit: numValue,
											});
										}}
										suffix={<span className='text-muted-foreground text-xs font-sans'>{activeFeature.unit_plural || 'units'}</span>}
									/>
									<Spacer className='!my-4' />
									<Checkbox
										id='set-infinite'
										label='Set to infinite'
										checked={tempEntitlement.usage_limit === null}
										onCheckedChange={(e) => {
											setEntitlement({
												...tempEntitlement,
												usage_limit: e ? null : undefined,
												usage_reset_period: e ? null : undefined,
											});
										}}
									/>
									<Spacer className='!my-4' />
									<Select
										disabled={tempEntitlement.usage_limit === null || activeFeature.meter.reset_usage === METER_USAGE_RESET_PERIOD.NEVER}
										error={errors.usage_reset_period}
										label='Usage reset'
										placeholder='Select usage reset period'
										options={billlingPeriodOptions}
										description='The values get reset in the given interval'
										value={tempEntitlement.usage_reset_period ?? ''}
										onChange={(value) => {
											setEntitlement({
												...tempEntitlement,
												usage_reset_period: value,
											});
										}}
									/>
									<Spacer className='!my-4' />
									<Toggle
										checked={tempEntitlement.is_soft_limit ?? false}
										label='Soft Limit'
										description='If enabled, access is always granted, even if the limit is exceeded.'
										onChange={(value) => {
											setEntitlement({
												...tempEntitlement,
												is_soft_limit: value,
											});
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
											setEntitlement({
												...tempEntitlement,
												static_value: value === '' ? undefined : value,
											});
										}}
									/>
								</div>
							)}

							{/* boolean features */}
							{/* {activeFeature.type === FeatureType.boolean && (
								<div>
									<Toggle
										error={errors.is_enabled}
										checked={tempEntitlement.is_enabled ?? false}
										label='Enable Feature'
										onChange={(value) => {
											setEntitlement({
												...tempEntitlement,
												is_enabled: value,
											});
										}}
									/>
								</div>
							)} */}

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
					{!showSelect && !activeFeature && <AddActionButton onClick={() => setShowSelect(true)} label='Add another feature' />}
					<Button isLoading={isPending} onClick={handleSubmit} disabled={isPending}>
						Save
					</Button>
				</div>
			</Sheet>
		</div>
	);
};

export default AddEntitlementDrawer;
