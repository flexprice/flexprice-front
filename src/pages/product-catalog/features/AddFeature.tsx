import { Button, Card, CodePreview, FormHeader, Input, Page, RadioGroup, Select, SelectOption, Spacer, Textarea } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import EventFilter, { EventFilterData } from '@/components/molecules/EventFilter';
import { AddActionButton } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { cn } from '@/lib/utils';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { BUCKET_SIZE, Meter, METER_AGGREGATION_TYPE, METER_USAGE_RESET_PERIOD } from '@/models/Meter';
import FeatureApi from '@/api/FeatureApi';
import { useMutation } from '@tanstack/react-query';
import { Gauge, SquareCheckBig, Wrench } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { LuCircleFadingPlus, LuRefreshCw } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const formatAggregationType = (data: string): string => {
	const aggregationTypeMap: Record<string, string> = {
		[METER_AGGREGATION_TYPE.SUM]: 'Sum',
		[METER_AGGREGATION_TYPE.COUNT]: 'Count',
		[METER_AGGREGATION_TYPE.COUNT_UNIQUE]: 'Count Unique',
		[METER_AGGREGATION_TYPE.LATEST]: 'Latest',
		[METER_AGGREGATION_TYPE.SUM_WITH_MULTIPLIER]: 'Sum with Multiplier',
	};
	return aggregationTypeMap[data] || data;
};

// Feature type options constant
const FEATURE_TYPE_OPTIONS: SelectOption[] = [
	{
		label: 'Boolean',
		description: 'Functionality that customers can either have access to or not i.e. SSO, CRM Integration, etc.',
		suffixIcon: <SquareCheckBig className='size-4' />,
		value: FEATURE_TYPE.BOOLEAN,
	},
	{
		label: 'Metered',
		description: 'Functionality with varying usage that needs to be measured i.e. API calls, llm tokens, etc.',
		suffixIcon: <Gauge className='size-4' />,
		value: FEATURE_TYPE.METERED,
	},
	{
		label: 'Static',
		description: 'Functionality that can be configured for a customer i.e. log retention period, support tier, etc.',
		suffixIcon: <Wrench className='size-4' />,
		value: FEATURE_TYPE.STATIC,
	},
];

// Usage reset options constant
const USAGE_RESET_OPTIONS = [
	{
		label: 'Periodic',
		description: 'Resets aggregation at the start of each billing cycle e.g., monthly API call limits.',
		value: METER_USAGE_RESET_PERIOD.BILLING_PERIOD,
		icon: LuRefreshCw,
	},
	{
		label: 'Cumulative',
		description: 'Tracks total usage continuously across billing periods e.g., file storage over time.',
		value: METER_USAGE_RESET_PERIOD.NEVER,
		icon: LuCircleFadingPlus,
	},
];

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
	type: z.enum([FEATURE_TYPE.BOOLEAN, FEATURE_TYPE.METERED, FEATURE_TYPE.STATIC]).optional(),
	meter_id: z.string().optional(),
	unit_singular: z.string().optional(),
	unit_plural: z.string().optional(),
});

// Types
interface FeatureFormState {
	showDescription: boolean;
}

type FeatureErrors = Partial<Record<keyof Feature, string>>;
type MeterErrors = Partial<Record<keyof Meter | 'aggregation_type' | 'aggregation_field' | 'aggregation_multiplier', string>>;

// Custom hook for feature form logic
const useFeatureForm = () => {
	const [data, setData] = useState<Partial<Feature>>({});
	const [errors, setErrors] = useState<FeatureErrors>({});
	const [formState, setFormState] = useState<FeatureFormState>({
		showDescription: false,
	});

	const updateFeatureData = useCallback((updates: Partial<Feature>) => {
		setData((prev) => ({ ...prev, ...updates }));
	}, []);

	const updateFormState = useCallback((updates: Partial<FeatureFormState>) => {
		setFormState((prev) => ({ ...prev, ...updates }));
	}, []);

	const validateFeature = useCallback((featureData: Partial<Feature>) => {
		const result = FEATURE_SCHEMA.safeParse(featureData);

		if (!result.success) {
			const newErrors: FeatureErrors = {};
			result.error.errors.forEach((error) => {
				const field = error.path[0] as keyof Feature;
				newErrors[field] = error.message;
			});
			setErrors(newErrors);
			return false;
		}

		setErrors({});
		return true;
	}, []);

	return {
		data,
		errors,
		formState,
		updateFeatureData,
		updateFormState,
		validateFeature,
	};
};

// Custom hook for meter form logic
const useMeterForm = () => {
	const [meter, setMeter] = useState<Partial<Meter>>({
		aggregation: {
			type: METER_AGGREGATION_TYPE.SUM,
			field: '',
		},
		reset_usage: METER_USAGE_RESET_PERIOD.BILLING_PERIOD,
	});
	const [meterErrors, setMeterErrors] = useState<MeterErrors>({});

	const updateMeter = useCallback((updates: Partial<Meter> | ((prev: Partial<Meter>) => Partial<Meter>)) => {
		if (typeof updates === 'function') {
			setMeter(updates);
		} else {
			setMeter((prev) => ({ ...prev, ...updates }));
		}
	}, []);

	const validateMeter = useCallback((meterData: Partial<Meter>): boolean => {
		const errors: Record<string, string> = {};

		if (!meterData.event_name?.trim()) {
			errors.event_name = 'Event Name is required';
		}

		if (!meterData.aggregation?.type?.trim()) {
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
		meter,
		meterErrors,
		updateMeter,
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
	onUpdateMeter,
}: {
	data: Partial<Feature>;
	errors: FeatureErrors;
	formState: FeatureFormState;
	onUpdateFeature: (updates: Partial<Feature>) => void;
	onUpdateFormState: (updates: Partial<FeatureFormState>) => void;
	onUpdateMeter: (updates: Partial<Meter> | ((prev: Partial<Meter>) => Partial<Meter>)) => void;
}) => {
	const handleNameChange = useCallback(
		(name: string) => {
			onUpdateFeature({ name });
			onUpdateMeter({ name });
		},
		[onUpdateFeature, onUpdateMeter],
	);

	const handleTypeChange = useCallback(
		(type: string) => {
			onUpdateFeature({ type: type as FEATURE_TYPE });

			// Initialize meter with default values when type is metered
			if (type === FEATURE_TYPE.METERED) {
				onUpdateMeter((prev) => ({
					...prev,
					aggregation: {
						type: METER_AGGREGATION_TYPE.SUM,
						field: '',
					},
				}));
			}
		},
		[onUpdateFeature, onUpdateMeter],
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
					label='Type'
					options={FEATURE_TYPE_OPTIONS}
					className='w-full overflow-hidden'
					value={data.type}
					onChange={handleTypeChange}
				/>
			</div>

			{isMeteredType && (
				<>
					<Spacer height='16px' />
					<FormHeader variant='form-component-title' title='Unit Name' />
					<div className='gap-4 grid grid-cols-2'>
						<Input placeholder='singular' value={data.unit_singular || ''} onChange={handleUnitSingularChange} />
						<Input placeholder='plural' value={data.unit_plural || ''} onChange={(unit_plural) => onUpdateFeature({ unit_plural })} />
					</div>
					<FormHeader
						variant='form-component-title'
						subtitle='If the unit name changes when the value is plural, please provide the names of the units'
					/>
				</>
			)}

			<Spacer height='16px' />

			{!formState.showDescription ? (
				<AddActionButton label='Add feature description' onClick={() => onUpdateFormState({ showDescription: true })} />
			) : (
				<Textarea
					label='Feature Description'
					placeholder='Enter description'
					value={data.description || ''}
					error={errors.description}
					className='!min-h-32'
					onChange={(description) => onUpdateFeature({ description })}
				/>
			)}
		</Card>
	);
};

// Event Details Section Component
const EventDetailsSection = ({
	meter,
	meterErrors,
	onUpdateMeter,
}: {
	meter: Partial<Meter>;
	meterErrors: MeterErrors;
	onUpdateMeter: (updates: Partial<Meter> | ((prev: Partial<Meter>) => Partial<Meter>)) => void;
}) => {
	const handleEventNameChange = useCallback(
		(event_name: string) => {
			onUpdateMeter((prev) => (prev ? { ...prev, event_name } : { event_name }));
		},
		[onUpdateMeter],
	);

	const handleFiltersChange = useCallback(
		(filters: React.SetStateAction<EventFilterData[]>) => {
			onUpdateMeter((prev) => {
				const newFilters = typeof filters === 'function' ? filters(prev?.filters || []) : filters;
				return prev ? { ...prev, filters: newFilters } : { filters: newFilters };
			});
		},
		[onUpdateMeter],
	);

	return (
		<Card className='card'>
			<Input
				value={meter?.event_name || ''}
				placeholder='tokens_total'
				label='Event Name'
				description='A unique identifier for the event used to filter and measure usage e.g. user_signup, api_calls, etc.'
				error={meterErrors.event_name}
				onChange={handleEventNameChange}
			/>
			<Spacer height='20px' />

			<FormHeader
				title='Event Filters'
				subtitle='Filter events based on specific properties e.g., region, user type or custom attributes to refine tracking.'
				variant='form-component-title'
			/>

			<div>
				<EventFilter eventFilters={meter?.filters || []} setEventFilters={handleFiltersChange} error={meterErrors.filters} />
			</div>
		</Card>
	);
};

// Aggregation Section Component
const AggregationSection = ({
	meter,
	meterErrors,
	onUpdateMeter,
}: {
	meter: Partial<Meter>;
	meterErrors: MeterErrors;
	onUpdateMeter: (updates: Partial<Meter> | ((prev: Partial<Meter>) => Partial<Meter>)) => void;
}) => {
	const handleAggregationTypeChange = useCallback(
		(type: string) => {
			onUpdateMeter((prev) => ({
				...prev,
				aggregation: {
					type: type as unknown as METER_AGGREGATION_TYPE,
					field: prev.aggregation?.field ?? '',
				},
			}));
		},
		[onUpdateMeter],
	);

	const handleAggregationFieldChange = useCallback(
		(field: string) => {
			onUpdateMeter((prev) => ({
				...prev,
				aggregation: {
					...prev.aggregation,
					type: prev.aggregation?.type || METER_AGGREGATION_TYPE.SUM,
					field,
				},
			}));
		},
		[onUpdateMeter],
	);

	const handleMultiplierChange = useCallback(
		(multiplierStr: string) => {
			onUpdateMeter((prev) => ({
				...prev,
				aggregation: {
					...prev.aggregation!,
					multiplier: multiplierStr ? Number(multiplierStr) : undefined,
				},
			}));
		},
		[onUpdateMeter],
	);

	const handleWindowSizeChange = useCallback(
		(type: string) => {
			onUpdateMeter((prev) => ({
				...prev,
				aggregation: {
					...prev.aggregation!,
					bucket_size: type as BUCKET_SIZE,
				},
			}));
		},
		[onUpdateMeter],
	);

	const handleResetUsageChange = useCallback(
		(value: { value?: string }) => {
			onUpdateMeter((prev) => ({ ...prev, reset_usage: value.value! as METER_USAGE_RESET_PERIOD }));
		},
		[onUpdateMeter],
	);

	const showFieldInput = meter.aggregation?.type !== METER_AGGREGATION_TYPE.COUNT;
	const showMultiplierInput = meter.aggregation?.type === METER_AGGREGATION_TYPE.SUM_WITH_MULTIPLIER;
	const showWindowSizeInput = meter.aggregation?.type === METER_AGGREGATION_TYPE.MAX;

	return (
		<div className='card'>
			<Card className='flex flex-col gap-4'>
				<Select
					options={AGGREGATION_OPTIONS}
					value={meter.aggregation?.type || AGGREGATION_OPTIONS[0].value}
					onChange={handleAggregationTypeChange}
					description='Choose how values are aggregated.'
					label='Aggregation Function'
					placeholder='SUM'
					error={meterErrors.aggregation_type}
					hideSelectedTick={true}
				/>

				{showFieldInput && (
					<Input
						value={meter.aggregation?.field || ''}
						disabled={meter.aggregation?.type === METER_AGGREGATION_TYPE.COUNT}
						onChange={handleAggregationFieldChange}
						label='Aggregation Field'
						placeholder='tokens'
						description='Specify the property in the event data that will be aggregated. e.g. tokens, messages_sent, storage_used.'
						error={meterErrors.aggregation_field}
					/>
				)}

				{showMultiplierInput && (
					<Input
						value={meter.aggregation?.multiplier?.toString() || ''}
						onChange={handleMultiplierChange}
						label='Aggregation Multiplier'
						placeholder='1'
						description='Specify the multiplier for the aggregation. e.g. 1.5, 0.25, or 1000.'
						error={meterErrors.aggregation_multiplier}
					/>
				)}

				{showWindowSizeInput && (
					<Select
						options={BUCKET_SIZE_OPTIONS}
						onChange={handleWindowSizeChange}
						label='Bucket Size'
						placeholder=''
						description='The size of the window to aggregate over. eg. 15MIN, 30MIN, HOUR, etc.'
						value={meter.aggregation?.bucket_size || undefined}
					/>
				)}
			</Card>

			<div className='!mt-6'>
				<RadioGroup
					items={USAGE_RESET_OPTIONS}
					selected={USAGE_RESET_OPTIONS.find((item) => item.value === meter.reset_usage)}
					title='Usage Reset'
					onChange={handleResetUsageChange}
				/>
			</div>
		</div>
	);
};

// Code Preview Section Component
const CodePreviewSection = ({ meter }: { meter: Partial<Meter> }) => {
	const staticDate = useMemo(() => {
		const start = new Date(2020, 0, 1);
		const end = new Date();
		return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
	}, []);

	const staticEventId = useMemo(() => {
		return 'event_' + uuidv4().replace(/-/g, '').slice(0, 10);
	}, []);

	const curlCommand = useMemo(() => {
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
	}, [meter.filters, meter.aggregation?.field, meter.event_name, staticEventId, staticDate]);

	return (
		<div className='sticky top-16 float-right'>
			<CodePreview title='Event Example' className='sticky top-0' code={curlCommand} language='js' />
		</div>
	);
};

// Main Component
const AddFeaturePage = () => {
	const navigate = useNavigate();
	const { data, errors, formState, updateFeatureData, updateFormState, validateFeature } = useFeatureForm();
	const { meter, meterErrors, updateMeter, validateMeter } = useMeterForm();

	const { isPending, mutate: createFeature } = useMutation({
		mutationFn: async (featureData: Partial<Feature> = data) => {
			const sanitizedMeter: Partial<Meter> = {
				...meter,
				event_name: meter.event_name,
				aggregation: {
					type: meter.aggregation?.type || METER_AGGREGATION_TYPE.SUM,
					field: meter.aggregation?.field || '',
					multiplier: meter.aggregation?.multiplier || 1,
					bucket_size: meter.aggregation?.bucket_size || undefined,
				},
				reset_usage: meter.reset_usage || METER_USAGE_RESET_PERIOD.BILLING_PERIOD,
				filters: meter.filters?.filter((filter) => filter.key !== '' && filter.values.length > 0),
			};

			const sanitizedData: Partial<Feature> = {
				...featureData,
				meter: featureData.type === FEATURE_TYPE.METERED ? (sanitizedMeter as Meter) : undefined,
			};

			return await FeatureApi.createFeature(sanitizedData);
		},
		onSuccess: async () => {
			await refetchQueries(['fetchFeatures']);
			navigate(RouteNames.features);
			toast.success('Feature created successfully');
		},
		onError: (error: ServerError) => {
			toast.error(error.error?.message || 'An error occurred while creating feature. Please try again.');
		},
	});

	const handleSubmit = useCallback(() => {
		// Validate feature data first
		if (!validateFeature(data)) {
			return;
		}

		// If type is metered, validate meter data
		if (data.type === FEATURE_TYPE.METERED) {
			if (!validateMeter(meter)) {
				return;
			}
		}

		createFeature(data);
	}, [data, meter, validateFeature, validateMeter, createFeature]);

	const isCtaDisabled = useMemo(() => {
		return (
			!data.name ||
			!data.type ||
			isPending ||
			(data.type === FEATURE_TYPE.METERED &&
				(!meter.event_name ||
					!meter.aggregation?.type ||
					(meter.aggregation.type !== METER_AGGREGATION_TYPE.COUNT && !meter.aggregation?.field)))
		);
	}, [data.name, data.type, isPending, meter.event_name, meter.aggregation]);

	const isMeteredType = data.type === FEATURE_TYPE.METERED;
	return (
		<Page type='left-aligned'>
			<ApiDocsContent tags={['Features']} />
			<p className='text-2xl font-medium'>Create Feature</p>

			<Spacer height='16px' />

			<div className={cn('flex gap-6 relative !mb-24', isMeteredType && 'w-full')}>
				<div className='flex-[8] gap-7'>
					<FeatureDetailsSection
						data={data}
						errors={errors}
						formState={formState}
						onUpdateFeature={updateFeatureData}
						onUpdateFormState={updateFormState}
						onUpdateMeter={updateMeter}
					/>

					<Spacer height='26px' />

					{isMeteredType && (
						<div className='w-full'>
							<EventDetailsSection meter={meter} meterErrors={meterErrors} onUpdateMeter={updateMeter} />

							<Spacer height='26px' />

							<AggregationSection meter={meter} meterErrors={meterErrors} onUpdateMeter={updateMeter} />

							<Spacer height='26px' />
						</div>
					)}

					<div>
						<Button isLoading={isPending} disabled={isCtaDisabled} onClick={handleSubmit}>
							{isPending ? 'Creating Feature...' : 'Save Feature'}
						</Button>
					</div>
					<Spacer height='16px' />
				</div>

				<div className={cn('flex-[3] max-w-lg relative')}>{isMeteredType && <CodePreviewSection meter={meter} />}</div>
			</div>
		</Page>
	);
};

export default AddFeaturePage;
