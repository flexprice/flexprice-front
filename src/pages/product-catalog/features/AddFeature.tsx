import { Button, CodePreview, FormHeader, Input, Page, RadioGroup, Select, SelectOption, Spacer, Textarea } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import EventFilter from '@/components/molecules/EventFilter';
import { AddChargesButton } from '@/components/organisms/PlanForm/SetupChargesSection';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { cn } from '@/lib/utils';
import Feature, { FeatureType } from '@/models/Feature';
import { Meter, METER_AGGREGATION_TYPE, METER_USAGE_RESET_PERIOD } from '@/models/Meter';
import FeatureApi from '@/api/FeatureApi';
import { useMutation } from '@tanstack/react-query';
import { Gauge, SquareCheckBig, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LuCircleFadingPlus } from 'react-icons/lu';
import { LuRefreshCw } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const formatAggregationType = (data: string): string => {
	switch (data) {
		case 'SUM':
			return 'Sum';
		case 'COUNT':
			return 'Count';
		case 'COUNT_UNIQUE':
			return 'Count Unique';
		default:
			return 'Sum';
	}
};

const AddFeaturePage = () => {
	const [data, setdata] = useState<Partial<Feature>>({});
	const [errors, setErrors] = useState<Partial<Record<keyof Feature, string>>>({});
	const navigate = useNavigate();

	const [meter, setmeter] = useState<Partial<Meter>>({
		aggregation: {
			type: METER_AGGREGATION_TYPE.SUM,
			field: '',
		},
		reset_usage: METER_USAGE_RESET_PERIOD.BILLING_PERIOD,
	});

	const [meterErrors, setmeterErrors] = useState<Partial<Record<keyof Meter | 'aggregation_type' | 'aggregation_field', string>>>({});

	const featureTypeOptions: SelectOption[] = [
		{
			label: 'Boolean',
			description: 'Functionality that customers can either have access to or not i.e. SSO, CRM Integration, etc.',
			suffixIcon: <SquareCheckBig className='size-4' />,
			value: 'boolean',
		},
		{
			label: 'Metered',
			description: 'Functionality with varying usage that needs to be measured i.e. API calls, llm tokens, etc.',
			suffixIcon: <Gauge className='size-4' />,
			value: 'metered',
		},
		{
			label: 'Static',
			description: 'Funtionality that can be configured for a customer i.e. log retention period, support tier, etc.',
			suffixIcon: <Wrench className='size-4' />,
			value: 'static',
		},
	];

	const radioMenuItemList = [
		{
			label: 'Periodic',
			description: 'Resets aggregation at the start of each billing cycle e.g., monthly API call limits.',
			value: 'BILLING_PERIOD',
			icon: LuRefreshCw,
		},
		{
			label: 'Cumulative',
			description: 'Tracks total usage continuously across billing periods e.g., file storage over time.',
			value: 'NEVER',
			icon: LuCircleFadingPlus,
		},
	];

	const featureSchema = z.object({
		name: z.string().nonempty('Feature name is required'),
		description: z.string().optional(),
		type: z.enum(['boolean', 'metered', 'static']).optional(),
		meter_id: z.string().optional(),
		unit_singular: z.string().optional(),
		unit_plural: z.string().optional(),
	});

	const staticDate = useMemo(() => {
		const start = new Date(2020, 0, 1);
		const end = new Date();
		return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
	}, []);

	const staticEventId = useMemo(() => {
		return 'event_' + uuidv4().replace(/-/g, '').slice(0, 10);
	}, []);

	const curlCommand = `curl --request POST \\
	--url https://api.cloud.flexprice.io/v1/events \\
	--header 'Content-Type: application/json' \\
	--header 'x-api-key: <your_api_key>' \\
	--data '{
		"event_id": "${staticEventId}",
		"event_name": "${meter.event_name || '__MUST_BE_DEFINED__'}",
		"external_customer_id": "__CUSTOMER_ID__",
		"properties": {${[...(meter.filters || [])]
			.filter((filter) => filter.key && filter.key.trim() !== '')
			.map((filter) => `\n\t\t\t "${filter.key}" : "${filter.values[0] || 'FILTER_VALUE'}"`)
			.join(',')}${meter.aggregation?.field ? `,\n\t\t\t "${meter.aggregation.field}":"__VALUE__"` : ''}
		},
		"source": "api",
		"timestamp": "${staticDate}"
	}'`;

	// Custom validation function for meters
	const validateMeter = (meterData: Partial<Meter>): Record<string, string> | null => {
		const errors: Record<string, string> = {};

		if (!meterData.event_name || meterData.event_name.trim() === '') {
			errors.event_name = 'Event Name is required';
		}

		if (!meterData.aggregation?.type || meterData.aggregation.type.trim() === '') {
			errors.aggregation_type = 'Aggregation type is required';
		}

		// Only validate field if aggregation type is not COUNT
		if (meterData.aggregation?.type !== METER_AGGREGATION_TYPE.COUNT) {
			if (!meterData.aggregation?.field || meterData.aggregation.field.trim() === '') {
				errors.aggregation_field = 'Aggregation field is required for this aggregation type';
			}
		}

		return Object.keys(errors).length > 0 ? errors : null;
	};

	const [state, setstate] = useState<{
		showDescription: boolean;
		activeMeter: Meter | null;
		filters: { key: string; values: string[] }[];
		defineUnits: boolean;
	}>({
		showDescription: false,
		activeMeter: null,
		filters: [
			{
				key: '',
				values: [],
			},
		],
		defineUnits: false,
	});

	const aggregationOptions: SelectOption[] = [
		{
			label: 'Sum',
			value: 'SUM',
			description: 'Sum a defined property for incoming events.',
		},
		{
			label: 'Count',
			value: 'COUNT',
			description: 'Count the number of times an incoming event occurs.',
		},

		{
			label: 'Count Unique',
			value: 'COUNT_UNIQUE',
			description: 'Count the number of unique value of a defined property for incoming events.',
		},
	];

	const { isPending, mutate: createFeature } = useMutation({
		mutationFn: async (featureData: Partial<Feature> = data) => {
			const sanitizedMeter: Partial<Meter> = {
				...meter,
				event_name: meter.event_name,
				aggregation:
					meter.aggregation?.type === METER_AGGREGATION_TYPE.COUNT
						? { type: meter.aggregation.type, field: '' } // Empty field for COUNT
						: {
								type: meter.aggregation?.type || '',
								field: meter.aggregation?.field || '', // Required field for other types
							},
				reset_usage: meter.reset_usage || '',
				filters: meter.filters?.filter((filter) => filter.key !== '' && filter.values.length > 0),
			};

			const sanitizedData: Partial<Feature> = {
				...featureData,
				meter: featureData.type === FeatureType.metered ? (sanitizedMeter as Meter) : undefined,
			};

			return await FeatureApi.createFeature(sanitizedData);
		},
		onSuccess: async () => {
			await refetchQueries(['fetchFeatures']);

			navigate(RouteNames.features);
			toast.success('Feature created successfully');
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'An error occurred while creating feature. Please try again.');
		},
	});

	const handleSubmit = () => {
		// Validate feature data first
		const featureResult = featureSchema.safeParse(data);

		if (!featureResult.success) {
			const newErrors: Partial<Record<keyof Feature, string>> = {};
			featureResult.error.errors.forEach((error) => {
				const field = error.path[0] as keyof Feature;
				newErrors[field] = error.message;
			});
			setErrors(newErrors);
			return false;
		}

		// If type is metered, validate and create meter first
		if (data.type === 'metered') {
			// Validate meter data with our custom function
			const meterValidationErrors = validateMeter(meter);

			if (meterValidationErrors) {
				const newMeterErrors: Partial<Record<keyof Meter | 'aggregation_type' | 'aggregation_field', string>> = {};

				Object.entries(meterValidationErrors).forEach(([key, message]) => {
					newMeterErrors[key as keyof typeof newMeterErrors] = message;
				});

				setmeterErrors(newMeterErrors);
				return false;
			}
		}
		createFeature(data);
	};

	const isCtaDisabled =
		!data.name ||
		!data.type ||
		isPending ||
		(data.type === 'metered' &&
			(!meter.event_name || !meter.aggregation?.type || (meter.aggregation.type !== 'COUNT' && !meter.aggregation?.field)));
	return (
		<Page type='left-aligned'>
			<ApiDocsContent tags={['Features']} />
			<FormHeader
				title={'Create Feature'}
				subtitle={'Feature represents a functionality in the product that can be monetized i.e. api calls, storage, etc.'}
				variant='form-title'
			/>

			<Spacer height={'16px'} />

			{/* fetaure details section */}
			<div className={cn('flex gap-6 relative   !mb-24', data.type === featureTypeOptions[1].value && 'w-full')}>
				<div className=' flex-[8] gap-7  '>
					<div className='p-6  rounded-xl border border-[#E4E4E7]'>
						<FormHeader
							title={'Details'}
							subtitle={'Assign a name to your feature to easily identify and track it.'}
							variant='sub-header'
						/>
						<Input
							label='Name*'
							placeholder='Enter a name for the feature'
							value={data.name}
							error={errors.name}
							onChange={(e) => {
								setdata((prev) => ({
									...prev,
									name: e,
								}));
								setmeter((prev) => ({ ...prev, name: e }));
							}}
						/>
						<Spacer height={'16px'} />
						<div className='w-full min-w-[200px] overflow-hidden'>
							<Select
								label='Type'
								options={featureTypeOptions}
								className='w-full overflow-hidden'
								value={data.type}
								onChange={(e) => {
									setdata((prev) => ({
										...prev,
										type: e,
									}));
									// Initialize meter with default values when type is metered
									if (e === 'metered') {
										setmeter((prev) => ({
											...prev,
											aggregation: {
												type: 'SUM',
												field: '',
											},
										}));
									}
								}}
							/>
						</div>

						{data.type === featureTypeOptions[1].value && (
							<>
								<Spacer height={'16px'} />
								<FormHeader variant='form-component-title' title='Unit Name' />
								<div className='gap-4 grid grid-cols-2'>
									<Input
										placeholder='singluar'
										value={data.unit_singular}
										onChange={(e) => {
											setdata((prev) => ({
												...prev,
												unit_singular: e,
												unit_plural: e + 's',
											}));
										}}
									/>
									<Input
										placeholder='plural'
										value={data.unit_plural}
										onChange={(e) => {
											setdata((prev) => ({ ...prev, unit_plural: e }));
										}}
									/>
								</div>
								<FormHeader
									variant='subtitle'
									subtitle='If the unit name changes when the value is plural, please provide the names of the units'
								/>
							</>
						)}
						<Spacer height={'16px'} />

						{!state.showDescription ? (
							<AddChargesButton
								label='Add feature description'
								onClick={() => {
									setstate((prev) => ({ ...prev, showDescription: true }));
								}}
							/>
						) : (
							<Textarea
								label='Feature Description'
								placeholder='Enter description'
								value={data.description}
								error={errors.description}
								className='!min-h-32'
								onChange={(e) => {
									setdata((prev) => ({ ...prev, description: e }));
								}}
							/>
						)}
					</div>
					<Spacer height={'26px'} />

					{/* feature type */}
					{data.type === featureTypeOptions[1].value && (
						<div className='w-full'>
							<div className='card'>
								<FormHeader
									title={'Event Details'}
									subtitle={'Assign a name to your event to easily identify and track it.'}
									variant='sub-header'
								/>
								<Spacer height={'16px'} />

								<Input
									value={meter?.event_name}
									placeholder='tokens_total'
									label='Name'
									description='A unique identifier for the event used to filter and measure usage e.g. user_signup, api_calls, etc.'
									error={meterErrors.event_name}
									onChange={(e) => {
										setmeter((prev) => (prev ? { ...prev, event_name: e } : { event_name: e }));
									}}
								/>
								<Spacer height={'20px'} />

								<FormHeader
									title='Filters'
									subtitle='Filter events based on specific properties e.g., region, user type or custom attributes to refine tracking.'
									variant='form-component-title'
								/>

								<div>
									<EventFilter
										isArchived={false}
										isEditMode={false}
										eventFilters={meter?.filters || []}
										setEventFilters={(e) => {
											setmeter((prev) => {
												const newFilters = Array.isArray(e) ? e : [];
												return prev ? { ...prev, filters: newFilters } : { filters: newFilters };
											});
										}}
										error={meterErrors.filters}
										permanentFilters={[]}
									/>
								</div>
							</div>

							<Spacer height={'26px'} />

							<div className='card'>
								<FormHeader
									title={'Define Aggregation'}
									subtitle={'Aggregation helps determine how event values are computed over time.'}
									variant='sub-header'
								/>
								<Spacer height={'16px'} />
								<div className='flex flex-col gap-4'>
									<Select
										// disabled={isEditMode}
										options={aggregationOptions}
										value={meter.aggregation?.type || aggregationOptions[0].value}
										onChange={(e) =>
											setmeter((prev) => ({
												...prev,
												aggregation: {
													type: e,
													field: '',
												},
											}))
										}
										description='Choose how values are aggregated.'
										label='Function'
										placeholder='SUM'
										error={meterErrors.aggregation_type}
										hideSelectedTick={true}
									/>

									{meter.aggregation?.type != aggregationOptions[1].value && (
										<Input
											value={meter.aggregation?.field}
											disabled={meter.aggregation?.type === aggregationOptions[1].value}
											onChange={(e) =>
												setmeter((prev) => ({
													...prev,
													aggregation: {
														type: prev.aggregation?.type || '',
														field: e,
													},
												}))
											}
											label='Field'
											placeholder='tokens'
											description='Specify the property in the event data that will be aggregated. e.g. tokens, messages_sent, storage_used.											'
											error={meterErrors.aggregation_field}
										/>
									)}
								</div>

								<div className='!mt-6'>
									<RadioGroup
										// disabled={isEditMode}
										items={radioMenuItemList}
										selected={radioMenuItemList.find((item) => item.value === meter.reset_usage)}
										title='Usage Reset'
										onChange={(value) => setmeter((prev) => ({ ...prev, reset_usage: value.value! }))}
									/>
								</div>
							</div>
							<Spacer height={'26px'} />
						</div>
					)}
					<div>
						<Button isLoading={isPending} disabled={isCtaDisabled} onClick={handleSubmit}>
							{isPending ? 'Creating Feature...' : 'Save Feature'}
						</Button>
					</div>
					<Spacer height={'16px'} />
				</div>

				{/* right section */}
				<div className={cn('flex-F[3] max-w-lg  relative')}>
					{data.type === featureTypeOptions[1].value && (
						<div className='sticky  top-16 float-right'>
							<CodePreview title='Event Example' className='sticky top-0' code={curlCommand} language='js' />
						</div>
					)}
				</div>
			</div>
		</Page>
	);
};

export default AddFeaturePage;
