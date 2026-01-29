import { Button, Card, CodePreview, FormHeader, Input, Page, Select, SelectOption, Spacer, Textarea } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import EventFilter, { EventFilterData } from '@/components/molecules/EventFilter';
import { AddChargesButton } from '@/components/organisms/PlanForm/SetupChargesSection';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { cn } from '@/lib/utils';
import { FEATURE_TYPE } from '@/models/Feature';
import { BUCKET_SIZE, METER_AGGREGATION_TYPE, METER_USAGE_RESET_PERIOD } from '@/models/Meter';
import FeatureApi from '@/api/FeatureApi';
import { CreateFeatureRequest, CreateMeterRequest } from '@/types/dto';
import { useMutation } from '@tanstack/react-query';
import { Gauge, SquareCheckBig, Wrench } from 'lucide-react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Feature type options constant
const FEATURE_TYPE_OPTIONS: SelectOption[] = [
	{
		label: 'Metered',
		description: 'Functionality with varying usage that needs to be measured i.e. API calls, llm tokens, etc.',
		suffixIcon: <Gauge className='size-4' />,
		value: FEATURE_TYPE.METERED,
	},
	{
		label: 'Boolean',
		description: 'Functionality that customers can either have access to or not i.e. SSO, CRM Integration, etc.',
		suffixIcon: <SquareCheckBig className='size-4' />,
		value: FEATURE_TYPE.BOOLEAN,
	},

	{
		label: 'Static',
		description: 'Functionality that can be configured for a customer i.e. log retention period, support tier, etc.',
		suffixIcon: <Wrench className='size-4' />,
		value: FEATURE_TYPE.STATIC,
	},
];

// Usage reset options constant
// const USAGE_RESET_OPTIONS = [
// 	{
// 		label: 'Periodic',
// 		description: 'Resets aggregation at the start of each billing cycle e.g., monthly API call limits.',
// 		value: METER_USAGE_RESET_PERIOD.BILLING_PERIOD,
// 		icon: LuRefreshCw,
// 	},
// 	{
// 		label: 'Cumulative',
// 		description: 'Tracks total usage continuously across billing periods e.g., file storage over time.',
// 		value: METER_USAGE_RESET_PERIOD.NEVER,
// 		icon: LuCircleFadingPlus,
// 	},
// ];

// Aggregation options constant
const AGGREGATION_OPTIONS: SelectOption[] = [
	{
		label: 'Sum',
		value: METER_AGGREGATION_TYPE.SUM,
		description: 'Sum a defined property for incoming events.',
	},
	{
		label: 'Count',
		value: METER_AGGREGATION_TYPE.COUNT,
		description: 'Count the number of times an incoming event occurs.',
	},
	{
		label: 'Count Unique',
		value: METER_AGGREGATION_TYPE.COUNT_UNIQUE,
		description: 'Count the number of unique value of a defined property for incoming events.',
	},
	{
		label: 'Sum with Multiplier',
		value: METER_AGGREGATION_TYPE.SUM_WITH_MULTIPLIER,
		description: 'Sum a defined property for incoming events with a multiplier.',
	},
	{
		label: 'Latest',
		value: METER_AGGREGATION_TYPE.LATEST,
		description: 'Get the latest value of a defined property for incoming events.',
	},
	{
		label: 'Max',
		value: METER_AGGREGATION_TYPE.MAX,
		description: 'Get the maximum value of a defined property for incoming events.',
	},
	{
		label: 'Weighted Sum',
		value: METER_AGGREGATION_TYPE.WEIGHTED_SUM,
		description: 'Sum a defined property for incoming events with weight-based aggregation.',
	},
	{
		label: 'Average',
		value: METER_AGGREGATION_TYPE.AVG,
		description: 'Get the average value of a defined property for incoming events.',
	},
];

const BUCKET_SIZE_OPTIONS: SelectOption[] = [
	{
		label: 'Minute',
		value: BUCKET_SIZE.WindowSizeMinute,
	},
	{
		label: '15 Minute',
		value: BUCKET_SIZE.WindowSize15Min,
	},
	{
		label: '30 Minute',
		value: BUCKET_SIZE.WindowSize30Min,
	},
	{
		label: 'Hour',
		value: BUCKET_SIZE.WindowSizeHour,
	},
	{
		label: '3 Hour',
		value: BUCKET_SIZE.WindowSize3Hour,
	},
	{
		label: '6 Hour',
		value: BUCKET_SIZE.WindowSize6Hour,
	},
	{
		label: '12 Hour',
		value: BUCKET_SIZE.WindowSize12Hour,
	},
	{
		label: 'Day',
		value: BUCKET_SIZE.WindowSizeDay,
	},
	{
		label: 'Week',
		value: BUCKET_SIZE.WindowSizeWeek,
	},
];

// Validation schemas
const FEATURE_SCHEMA = z.object({
	name: z.string().nonempty('Feature name is required'),
	description: z.string().optional(),
	lookup_key: z.string().optional(),
	type: z.enum([FEATURE_TYPE.BOOLEAN, FEATURE_TYPE.METERED, FEATURE_TYPE.STATIC]).optional(),
	meter_id: z.string().optional(),
	unit_singular: z.string().optional(),
	unit_plural: z.string().optional(),
});

// Types
interface FeatureFormState {
	showDescription: boolean;
	showLookupKey: boolean;
	showUnitName: boolean;
	showEventFilters: boolean;
	showBucketSize: boolean;
}

type FeatureFormData = Omit<CreateFeatureRequest, 'name' | 'type' | 'meter'> & {
	name?: string;
	type?: FEATURE_TYPE;
	meter?: Partial<CreateMeterRequest>;
};

type FeatureErrors = Partial<Record<keyof CreateFeatureRequest, string>>;
type MeterErrors = Partial<Record<keyof CreateMeterRequest | 'aggregation_type' | 'aggregation_field' | 'aggregation_multiplier', string>>;

// Custom hook for feature form logic
const useFeatureForm = () => {
	const [data, setData] = useState<FeatureFormData>({});
	const [errors, setErrors] = useState<FeatureErrors>({});
	const [formState, setFormState] = useState<FeatureFormState>({
		showDescription: false,
		showLookupKey: false,
		showUnitName: false,
		showEventFilters: false,
		showBucketSize: false,
	});

	const updateFeatureData = useCallback((updates: Partial<FeatureFormData>) => {
		setData((prev) => ({ ...prev, ...updates }));
	}, []);

	const updateFormState = useCallback((updates: Partial<FeatureFormState>) => {
		setFormState((prev) => ({ ...prev, ...updates }));
	}, []);

	const [meterErrors, setMeterErrors] = useState<MeterErrors>({});

	const validateFeature = useCallback((featureData: FeatureFormData) => {
		const result = FEATURE_SCHEMA.safeParse(featureData);

		if (!result.success) {
			const newErrors: FeatureErrors = {};
			result.error.errors.forEach((error) => {
				const field = error.path[0] as keyof CreateFeatureRequest;
				newErrors[field] = error.message;
			});
			setErrors(newErrors);
			return false;
		}

		setErrors({});
		return true;
	}, []);

	const validateMeter = useCallback((meterData: Partial<CreateMeterRequest> | undefined): boolean => {
		if (!meterData) return false;

		const errors: Record<string, string> = {};

		if (!meterData.event_name?.trim()) {
			errors.event_name = 'Event Name is required';
		}

		if (!meterData.aggregation?.type) {
			errors.aggregation_type = 'Aggregation type is required';
		}

		// Only validate field if aggregation type is not COUNT
		if (meterData.aggregation?.type !== METER_AGGREGATION_TYPE.COUNT) {
			if (!meterData.aggregation?.field?.trim()) {
				errors.aggregation_field = 'Aggregation field is required for this aggregation type';
			}
		}

		if (meterData.aggregation?.type === METER_AGGREGATION_TYPE.SUM_WITH_MULTIPLIER) {
			if (!meterData.aggregation?.multiplier || meterData.aggregation.multiplier <= 0) {
				errors.aggregation_multiplier = 'Multiplier must be greater than 0';
			}
		}

		const hasErrors = Object.keys(errors).length > 0;
		if (hasErrors) {
			const newMeterErrors: MeterErrors = {};
			Object.entries(errors).forEach(([key, message]) => {
				newMeterErrors[key as keyof MeterErrors] = message;
			});
			setMeterErrors(newMeterErrors);
		} else {
			setMeterErrors({});
		}

		return !hasErrors;
	}, []);

	return {
		data,
		errors,
		meterErrors,
		formState,
		updateFeatureData,
		updateFormState,
		validateFeature,
		validateMeter,
	};
};

// Feature Details Section Component
const FeatureDetailsSection = ({
	data,
	errors,
	formState,
	onUpdateFeature,
	onUpdateFormState,
}: {
	data: FeatureFormData;
	errors: FeatureErrors;
	formState: FeatureFormState;
	onUpdateFeature: (updates: Partial<FeatureFormData>) => void;
	onUpdateFormState: (updates: Partial<FeatureFormState>) => void;
}) => {
	const handleNameChange = useCallback(
		(name: string) => {
			onUpdateFeature({
				name,
				meter: data.meter ? { ...data.meter, name } : undefined,
			});
		},
		[onUpdateFeature, data.meter],
	);

	const handleTypeChange = useCallback(
		(type: string) => {
			onUpdateFeature({ type: type as FEATURE_TYPE });

			// Initialize meter with default values when type is metered
			if (type === FEATURE_TYPE.METERED) {
				onUpdateFeature({
					meter: {
						name: data.name || '',
						event_name: '',
						aggregation: {
							type: METER_AGGREGATION_TYPE.SUM,
							field: '',
						},
						reset_usage: METER_USAGE_RESET_PERIOD.BILLING_PERIOD,
					},
				});
			} else {
				onUpdateFeature({ meter: undefined });
			}
		},
		[onUpdateFeature, data.name],
	);

	const handleUnitSingularChange = useCallback(
		(unit_singular: string) => {
			onUpdateFeature({
				unit_singular,
				unit_plural: unit_singular + 's',
			});
		},
		[onUpdateFeature],
	);

	const isMeteredType = data.type === FEATURE_TYPE.METERED;

	return (
		<Card className='p-6 rounded-xl border border-[#E4E4E7]'>
			<Input
				label='Name*'
				placeholder='Enter a name for the feature'
				value={data.name || ''}
				error={errors.name}
				onChange={handleNameChange}
			/>

			<Spacer height='16px' />

			<div className='w-full min-w-[200px] overflow-hidden'>
				<Select
					label='Type*'
					options={FEATURE_TYPE_OPTIONS}
					className='w-full overflow-hidden'
					value={data.type}
					onChange={handleTypeChange}
				/>
			</div>

			<Spacer height='16px' />

			{/* Optional fields: vertical order — opening Lookup Key pushes Unit name & Feature description below */}
			<div className='flex flex-col gap-4'>
				{/* 1. Lookup Key — button or input */}
				{!formState.showLookupKey ? (
					<div className='flex flex-wrap items-center gap-2'>
						<AddChargesButton label='Lookup Key' onClick={() => onUpdateFormState({ showLookupKey: true })} />
						{isMeteredType && !formState.showUnitName ? (
							<AddChargesButton label='Unit name' onClick={() => onUpdateFormState({ showUnitName: true })} />
						) : null}
						{!formState.showDescription ? (
							<AddChargesButton label='Feature description' onClick={() => onUpdateFormState({ showDescription: true })} />
						) : null}
					</div>
				) : (
					<Input
						label='Lookup Key'
						placeholder='Enter a unique lookup key (optional)'
						value={data.lookup_key || ''}
						error={errors.lookup_key}
						onChange={(lookup_key) => onUpdateFeature({ lookup_key })}
					/>
				)}

				{/* 2. Unit name (metered) & Feature description — only below when Lookup Key is open */}
				{formState.showLookupKey && (
					<>
						{isMeteredType && (
							<>
								{!formState.showUnitName ? (
									<div className='flex flex-wrap items-center gap-2'>
										<AddChargesButton label='Unit name' onClick={() => onUpdateFormState({ showUnitName: true })} />
										{!formState.showDescription ? (
											<AddChargesButton label='Feature description' onClick={() => onUpdateFormState({ showDescription: true })} />
										) : null}
									</div>
								) : (
									<>
										<FormHeader variant='form-component-title' title='Unit Name' />
										<div className='gap-4 grid grid-cols-2'>
											<Input placeholder='singular' value={data.unit_singular || ''} onChange={handleUnitSingularChange} />
											<Input
												placeholder='plural'
												value={data.unit_plural || ''}
												onChange={(unit_plural) => onUpdateFeature({ unit_plural })}
											/>
										</div>
										<FormHeader
											variant='form-component-title'
											subtitle='If the unit name changes when the value is plural, please provide the names of the units'
										/>
										{!formState.showDescription ? (
											<div className='flex flex-wrap items-center gap-2'>
												<AddChargesButton label='Feature description' onClick={() => onUpdateFormState({ showDescription: true })} />
											</div>
										) : null}
									</>
								)}
							</>
						)}
						{!isMeteredType && !formState.showDescription && (
							<div className='flex flex-wrap items-center gap-2'>
								<AddChargesButton label='Feature description' onClick={() => onUpdateFormState({ showDescription: true })} />
							</div>
						)}
						{(!isMeteredType || formState.showUnitName) && formState.showDescription ? (
							<Textarea
								label='Feature Description'
								placeholder='Enter description'
								value={data.description || ''}
								error={errors.description}
								className='!min-h-32'
								onChange={(description) => onUpdateFeature({ description })}
							/>
						) : null}
					</>
				)}

				{/* When Lookup Key not open: Unit name (metered) and Feature description in their own rows */}
				{!formState.showLookupKey && isMeteredType && formState.showUnitName && (
					<>
						<FormHeader variant='form-component-title' title='Unit Name' />
						<div className='gap-4 grid grid-cols-2'>
							<Input placeholder='singular' value={data.unit_singular || ''} onChange={handleUnitSingularChange} />
							<Input placeholder='plural' value={data.unit_plural || ''} onChange={(unit_plural) => onUpdateFeature({ unit_plural })} />
						</div>
						<FormHeader
							variant='form-component-title'
							subtitle='If the unit name changes when the value is plural, please provide the names of the units'
						/>
						{!formState.showDescription ? (
							<div className='flex flex-wrap items-center gap-2'>
								<AddChargesButton label='Feature description' onClick={() => onUpdateFormState({ showDescription: true })} />
							</div>
						) : null}
					</>
				)}
				{!formState.showLookupKey && formState.showDescription && (
					<Textarea
						label='Feature Description'
						placeholder='Enter description'
						value={data.description || ''}
						error={errors.description}
						className='!min-h-32'
						onChange={(description) => onUpdateFeature({ description })}
					/>
				)}
			</div>
		</Card>
	);
};

// Event Details Section Component
const EventDetailsSection = ({
	meter,
	meterErrors,
	formState,
	onUpdateFeature,
	onUpdateFormState,
}: {
	meter: Partial<CreateMeterRequest> | undefined;
	meterErrors: MeterErrors;
	formState: FeatureFormState;
	onUpdateFeature: (updates: Partial<FeatureFormData>) => void;
	onUpdateFormState: (updates: Partial<FeatureFormState>) => void;
}) => {
	const handleEventNameChange = useCallback(
		(event_name: string) => {
			onUpdateFeature({
				meter: {
					...meter,
					event_name,
				},
			});
		},
		[onUpdateFeature, meter],
	);

	const handleFiltersChange = useCallback(
		(filters: React.SetStateAction<EventFilterData[]>) => {
			const newFilters = typeof filters === 'function' ? filters(meter?.filters || []) : filters;
			onUpdateFeature({
				meter: {
					...meter,
					filters: newFilters,
				},
			});
		},
		[onUpdateFeature, meter],
	);

	return (
		<Card className='card'>
			<Input
				value={meter?.event_name || ''}
				placeholder='tokens_total'
				label='Event Name*'
				description='A unique identifier for the event used to filter and measure usage e.g. user_signup, api_calls, etc.'
				error={meterErrors.event_name}
				onChange={handleEventNameChange}
			/>
			<Spacer height='20px' />

			<div className='flex flex-col gap-2 min-h-[52px]'>
				{!formState.showEventFilters ? (
					<AddChargesButton
						label='Event filters'
						onClick={() => onUpdateFormState({ showEventFilters: true })}
						className='self-start min-w-[160px] h-9'
					/>
				) : null}
				{formState.showEventFilters ? (
					<>
						<FormHeader
							title='Event Filters'
							subtitle='Filter events based on specific properties e.g., region, user type or custom attributes to refine tracking.'
							variant='form-component-title'
						/>

						<div>
							<EventFilter eventFilters={meter?.filters || []} setEventFilters={handleFiltersChange} error={meterErrors.filters} />
						</div>
					</>
				) : null}
			</div>
		</Card>
	);
};

// Aggregation Section Component
const AggregationSection = ({
	meter,
	meterErrors,
	formState,
	onUpdateFeature,
	onUpdateFormState,
}: {
	meter: Partial<CreateMeterRequest> | undefined;
	meterErrors: MeterErrors;
	formState: FeatureFormState;
	onUpdateFeature: (updates: Partial<FeatureFormData>) => void;
	onUpdateFormState: (updates: Partial<FeatureFormState>) => void;
}) => {
	const handleAggregationTypeChange = useCallback(
		(type: string) => {
			onUpdateFeature({
				meter: {
					...meter,
					aggregation: {
						...meter?.aggregation,
						type: type as METER_AGGREGATION_TYPE,
						field: meter?.aggregation?.field ?? '',
					},
				},
			});
		},
		[onUpdateFeature, meter],
	);

	const handleAggregationFieldChange = useCallback(
		(field: string) => {
			onUpdateFeature({
				meter: {
					...meter,
					aggregation: {
						...meter?.aggregation,
						type: meter?.aggregation?.type || METER_AGGREGATION_TYPE.SUM,
						field,
					},
				},
			});
		},
		[onUpdateFeature, meter],
	);

	const [multiplierInput, setMultiplierInput] = useState(meter?.aggregation?.multiplier?.toString() || '');

	useEffect(() => {
		// only update local state if the prop value actually changed externally
		const currentValue = meter?.aggregation?.multiplier?.toString() || '';
		if (currentValue !== multiplierInput) {
			setMultiplierInput(currentValue);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [meter?.aggregation?.multiplier]);

	const handleMultiplierChange = useCallback(
		(value: string) => {
			// Allow only valid numeric/decimal input
			if (/^\d*\.?\d*$/.test(value)) {
				setMultiplierInput(value);

				const num = parseFloat(value);
				onUpdateFeature({
					meter: {
						...meter,
						aggregation: {
							...(meter?.aggregation ?? { type: METER_AGGREGATION_TYPE.SUM }),
							multiplier: !isNaN(num) ? num : undefined,
						},
					},
				});
			}
		},
		[onUpdateFeature, meter],
	);

	const handleWindowSizeChange = useCallback(
		(type: string) => {
			onUpdateFeature({
				meter: {
					...meter,
					aggregation: {
						...(meter?.aggregation ?? { type: METER_AGGREGATION_TYPE.SUM }),
						bucket_size: type as BUCKET_SIZE,
					},
				},
			});
		},
		[onUpdateFeature, meter],
	);

	const showFieldInput = meter?.aggregation?.type !== METER_AGGREGATION_TYPE.COUNT;
	const showMultiplierInput = meter?.aggregation?.type === METER_AGGREGATION_TYPE.SUM_WITH_MULTIPLIER;

	return (
		<div className='card'>
			<Card className='flex flex-col gap-4'>
				<Select
					options={AGGREGATION_OPTIONS}
					value={meter?.aggregation?.type || AGGREGATION_OPTIONS[0].value}
					onChange={handleAggregationTypeChange}
					description='Choose how values are aggregated.'
					label='Aggregation Function*'
					placeholder='SUM'
					error={meterErrors.aggregation_type}
					hideSelectedTick={true}
				/>

				{showFieldInput && (
					<Input
						value={meter?.aggregation?.field || ''}
						disabled={meter?.aggregation?.type === METER_AGGREGATION_TYPE.COUNT}
						onChange={handleAggregationFieldChange}
						label='Aggregation Field*'
						placeholder='tokens'
						description='Specify the property in the event data that will be aggregated. e.g. tokens, messages_sent, storage_used.'
						error={meterErrors.aggregation_field}
					/>
				)}

				{showMultiplierInput && (
					<Input
						value={multiplierInput}
						onChange={handleMultiplierChange}
						label='Aggregation Multiplier*'
						placeholder='1'
						description='Specify the multiplier for the aggregation. e.g. 1.5, 0.25, or 1000.'
						error={meterErrors.aggregation_multiplier}
					/>
				)}

				<div className='flex flex-col gap-2 min-h-[52px]'>
					{!formState.showBucketSize ? (
						<AddChargesButton
							label='Bucket size'
							onClick={() => onUpdateFormState({ showBucketSize: true })}
							className='self-start min-w-[160px] h-9'
						/>
					) : null}
					{formState.showBucketSize ? (
						<Select
							options={BUCKET_SIZE_OPTIONS}
							onChange={handleWindowSizeChange}
							label='Bucket Size'
							placeholder=''
							description='The size of the window to aggregate over. eg. 15MIN, 30MIN, HOUR, etc.'
							value={meter?.aggregation?.bucket_size || undefined}
						/>
					) : null}
				</div>
			</Card>

			{/* <div className='!mt-6'>
				<RadioGroup
					items={USAGE_RESET_OPTIONS}
					selected={USAGE_RESET_OPTIONS.find((item) => item.value === meter?.reset_usage)}
					title='Usage Reset'
					onChange={handleResetUsageChange}
				/>
			</div> */}
		</div>
	);
};

// Code Preview Section Component
const CodePreviewSection = ({ meter }: { meter: Partial<CreateMeterRequest> | undefined }) => {
	const staticDate = useMemo(() => {
		const start = new Date(2020, 0, 1);
		const end = new Date();
		return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
	}, []);

	const staticEventId = useMemo(() => {
		return 'event_' + uuidv4().replace(/-/g, '').slice(0, 10);
	}, []);

	const curlCommand = useMemo(() => {
		if (!meter) return '';

		const filterProperties = (meter.filters || [])
			.filter((filter) => filter.key && filter.key.trim() !== '')
			.map((filter) => `\n\t\t\t "${filter.key}" : "${filter.values[0] || 'FILTER_VALUE'}"`)
			.join(',');

		const aggregationField = meter.aggregation?.field ? `,\n\t\t\t "${meter.aggregation.field}":"__VALUE__"` : '';

		return `curl --request POST \\
	--url https://api.cloud.flexprice.io/v1/events \\
	--header 'Content-Type: application/json' \\
	--header 'x-api-key: <your_api_key>' \\
	--data '{
		"event_id": "${staticEventId}",
		"event_name": "${meter.event_name || '__MUST_BE_DEFINED__'}",
		"external_customer_id": "__CUSTOMER_ID__",
		"properties": {${filterProperties}${aggregationField}
		},
		"source": "api",
		"timestamp": "${staticDate}"
	}'`;
	}, [meter, staticEventId, staticDate]);

	return (
		<div className='sticky top-16 float-right'>
			<CodePreview title='Event Example' className='sticky top-0' code={curlCommand} language='js' />
		</div>
	);
};

// Main Component
const AddFeaturePage = () => {
	const navigate = useNavigate();
	const { data, errors, meterErrors, formState, updateFeatureData, updateFormState, validateFeature, validateMeter } = useFeatureForm();

	const { isPending, mutate: createFeature } = useMutation({
		mutationFn: async (featureData: FeatureFormData = data) => {
			// Build CreateMeterRequest with proper structure if metered
			const meterRequest: CreateMeterRequest | undefined =
				featureData.type === FEATURE_TYPE.METERED && featureData.meter
					? {
							name: featureData.meter.name || featureData.name || '',
							event_name: featureData.meter.event_name || '',
							aggregation: {
								type: featureData.meter.aggregation?.type || METER_AGGREGATION_TYPE.SUM,
								field: featureData.meter.aggregation?.field || '',
								multiplier: featureData.meter.aggregation?.multiplier,
								bucket_size: featureData.meter.aggregation?.bucket_size,
							},
							reset_usage: featureData.meter.reset_usage || METER_USAGE_RESET_PERIOD.BILLING_PERIOD,
							filters: featureData.meter.filters?.filter((filter) => filter.key !== '' && filter.values.length > 0),
						}
					: undefined;

			const sanitizedData: CreateFeatureRequest = {
				name: featureData.name!,
				description: featureData.description,
				lookup_key: featureData.lookup_key,
				type: featureData.type!,
				meter: meterRequest,
				metadata: featureData.metadata,
				unit_singular: featureData.unit_singular,
				unit_plural: featureData.unit_plural,
			};

			return await FeatureApi.createFeature(sanitizedData);
		},
		onSuccess: async () => {
			await refetchQueries(['fetchFeatures']);
			navigate(RouteNames.features);
			toast.success('Feature created successfully');
		},
		onError: (error: ServerError) => {
			const errorMessage = error.error?.message || 'An error occurred while creating feature. Please try again.';
			toast.error(errorMessage);
		},
	});

	const handleSubmit = useCallback(() => {
		// Validate feature data first
		if (!validateFeature(data)) {
			return;
		}

		// If type is metered, validate meter data
		if (data.type === FEATURE_TYPE.METERED) {
			if (!validateMeter(data.meter)) {
				return;
			}
		}

		createFeature(data);
	}, [data, validateFeature, validateMeter, createFeature]);

	const isCtaDisabled = useMemo(() => {
		return (
			!data.name ||
			!data.type ||
			isPending ||
			(data.type === FEATURE_TYPE.METERED &&
				(!data.meter?.event_name ||
					!data.meter?.aggregation?.type ||
					(data.meter.aggregation.type !== METER_AGGREGATION_TYPE.COUNT && !data.meter.aggregation?.field)))
		);
	}, [data.name, data.type, data.meter, isPending]);

	const isMeteredType = data.type === FEATURE_TYPE.METERED;
	return (
		<Page type='left-aligned'>
			<ApiDocsContent tags={['Features']} />
			<p className='text-2xl font-medium'>Create Feature</p>

			<Spacer height='16px' />

			<div className={cn('flex gap-6 relative !mb-24', isMeteredType && 'w-full')}>
				<div className='flex-[6] gap-7'>
					<FeatureDetailsSection
						data={data}
						errors={errors}
						formState={formState}
						onUpdateFeature={updateFeatureData}
						onUpdateFormState={updateFormState}
					/>

					<Spacer height='26px' />

					{isMeteredType && (
						<div className='w-full'>
							<EventDetailsSection
								meter={data.meter}
								meterErrors={meterErrors}
								formState={formState}
								onUpdateFeature={updateFeatureData}
								onUpdateFormState={updateFormState}
							/>

							<Spacer height='26px' />

							<AggregationSection
								meter={data.meter}
								meterErrors={meterErrors}
								formState={formState}
								onUpdateFeature={updateFeatureData}
								onUpdateFormState={updateFormState}
							/>

							<Spacer height='26px' />
						</div>
					)}

					<div>
						<Button isLoading={isPending} disabled={isCtaDisabled} onClick={handleSubmit}>
							{isPending ? 'Creating Feature...' : 'Save'}
						</Button>
					</div>
					<Spacer height='16px' />
				</div>

				<div className={cn('flex-[5] max-w-lg relative')}>{isMeteredType && <CodePreviewSection meter={data.meter} />}</div>
			</div>
		</Page>
	);
};

export default AddFeaturePage;
