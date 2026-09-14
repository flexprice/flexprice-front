import { Button, Card, CodePreview, FormHeader, Input, Page, Select, SelectOption, Spacer, Textarea } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import EventFilter, { EventFilterData } from '@/components/molecules/EventFilter';
import SelectGroup from '@/components/organisms/PlanForm/SelectGroup';
import { AddChargesButton } from '@/components/organisms/PlanForm/SetupChargesSection';
import { GROUP_ENTITY_TYPE } from '@/models/Group';
import { RouteNames } from '@/core/routes/Routes';
import { queryClient, refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { SIDEBAR_PRICING_PROMO_QUERY_KEY } from '@/hooks/useShouldShowSidebarPricingPromo';
import { cn } from '@/lib/utils';
import { FEATURE_TYPE } from '@/models/Feature';
import { METER_AGGREGATION_TYPE, METER_USAGE_RESET_PERIOD } from '@/models/Meter';
import FeatureApi from '@/api/FeatureApi';
import { CreateFeatureRequest, CreateMeterRequest, FeatureFormData } from '@/types/dto';
import { useMutation } from '@tanstack/react-query';
import { Gauge, Settings2, SquareCheckBig, Wrench } from 'lucide-react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

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
	{
		label: 'Config',
		description: 'Structured key-value configuration delivered to a customer i.e. feature flags, limits map, environment settings.',
		suffixIcon: <Settings2 className='size-4' />,
		value: FEATURE_TYPE.CONFIG,
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

// Aggregation types that accept a CEL expression in place of a field.
// Mirrors the backend's AggregationType.SupportsExpression() classifier
// (internal/types/aggregation.go).
const EXPRESSION_SUPPORTED_TYPES: METER_AGGREGATION_TYPE[] = [
	METER_AGGREGATION_TYPE.SUM,
	METER_AGGREGATION_TYPE.AVG,
	METER_AGGREGATION_TYPE.MAX,
	METER_AGGREGATION_TYPE.LATEST,
];

// Validation schemas
const FEATURE_SCHEMA = z.object({
	name: z.string().trim().min(1, 'Feature name is required'),
	description: z.string().optional(),
	lookup_key: z.string().optional(),
	type: z.enum([FEATURE_TYPE.BOOLEAN, FEATURE_TYPE.METERED, FEATURE_TYPE.STATIC, FEATURE_TYPE.CONFIG]).optional(),
	meter_id: z.string().optional(),
	unit_singular: z.string().optional(),
	unit_plural: z.string().optional(),
	reporting_unit: z
		.object({
			unit_singular: z.string(),
			unit_plural: z.string(),
			conversion_rate: z
				.string()
				.optional()
				.refine((s) => s === undefined || s === '' || (!Number.isNaN(Number(s)) && isFinite(Number(s))), {
					message: 'Conversion rate must be a valid number',
				}),
		})
		.optional(),
});

// Types
interface FeatureFormState {
	showDescription: boolean;
	showLookupKey: boolean;
	showGroup: boolean;
	showUnitName: boolean;
	showReportingUnitName: boolean;
	showEventFilters: boolean;
	showGroupBy: boolean;
	showCustomExpression: boolean;
}

type FeatureErrors = Partial<Record<keyof CreateFeatureRequest, string>>;
type MeterErrors = Partial<
	Record<keyof CreateMeterRequest | 'aggregation_type' | 'aggregation_field' | 'aggregation_expression' | 'aggregation_multiplier', string>
>;

// Custom hook for feature form logic
const useFeatureForm = () => {
	const [data, setData] = useState<FeatureFormData>({});
	const [errors, setErrors] = useState<FeatureErrors>({});
	const [formState, setFormState] = useState<FeatureFormState>({
		showDescription: false,
		showLookupKey: false,
		showGroup: false,
		showUnitName: false,
		showReportingUnitName: false,
		showEventFilters: false,
		showGroupBy: false,
		showCustomExpression: false,
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

	const validateMeter = useCallback((meterData: Partial<CreateMeterRequest> | undefined, formState: FeatureFormState): boolean => {
		if (!meterData) return false;

		const errors: Record<string, string> = {};

		if (!meterData.event_name?.trim()) {
			errors.event_name = 'Event Name is required';
		}

		if (!meterData.aggregation?.type) {
			errors.aggregation_type = 'Aggregation type is required';
		}

		// COUNT needs no per-event field/expression. For everything else, the
		// user is either in "Aggregation Field" mode (default) or "Custom
		// Expression" mode (toggled). Validate whichever input is currently shown.
		if (meterData.aggregation?.type !== METER_AGGREGATION_TYPE.COUNT) {
			if (formState.showCustomExpression) {
				if (!meterData.aggregation?.expression?.trim()) {
					errors.aggregation_expression = 'Custom expression is required';
				}
			} else if (!meterData.aggregation?.field?.trim()) {
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
	const { t } = useTranslation(['catalog', 'common']);
	const handleNameChange = useCallback(
		(name: string) => {
			onUpdateFeature({
				name,
				// Derive from the trimmed name: the submitted name is trimmed, so an
				// untrimmed source here yields keys like "feat---api-calls--".
				lookup_key: 'feat-' + name.trim().replace(/\s/g, '-').toLowerCase(),
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

	const handleReportingUnitSingularChange = useCallback(
		(unit_singular: string) => {
			if (!unit_singular.trim()) {
				onUpdateFeature({ reporting_unit: undefined });
				return;
			}
			onUpdateFeature({
				reporting_unit: {
					unit_singular,
					unit_plural: unit_singular + 's',
					conversion_rate: data.reporting_unit?.conversion_rate ?? '',
				},
			});
		},
		[onUpdateFeature, data.reporting_unit?.conversion_rate],
	);

	const isMeteredType = data.type === FEATURE_TYPE.METERED;

	return (
		<Card className='p-6 rounded-[6px] border border-line-zinc'>
			<Input
				label={t('catalog:features.form.name')}
				placeholder={t('catalog:features.form.namePlaceholder')}
				value={data.name || ''}
				error={errors.name}
				onChange={handleNameChange}
			/>

			<Spacer height='16px' />

			<div className='w-full min-w-[200px] overflow-hidden'>
				<Select
					label={t('catalog:features.form.type')}
					options={FEATURE_TYPE_OPTIONS}
					className='w-full overflow-hidden'
					value={data.type}
					onChange={handleTypeChange}
				/>
			</div>

			<Spacer height='16px' />

			{/* Optional fields: show top row only when nothing is open; otherwise buttons only below expanded sections */}
			<div className='flex flex-col gap-4'>
				{/* 1. Top row: either all add-buttons (when nothing open) or Lookup Key input only */}
				{!formState.showLookupKey &&
				!formState.showGroup &&
				!formState.showUnitName &&
				!formState.showReportingUnitName &&
				!formState.showDescription ? (
					<div className='flex flex-wrap items-center gap-2'>
						<AddChargesButton label={t('catalog:features.form.lookupKey')} onClick={() => onUpdateFormState({ showLookupKey: true })} />
						{isMeteredType && (
							<>
								<AddChargesButton label={t('catalog:features.form.unitName')} onClick={() => onUpdateFormState({ showUnitName: true })} />
								<AddChargesButton
									label={t('catalog:features.form.displayUnitName')}
									onClick={() => onUpdateFormState({ showReportingUnitName: true })}
								/>
							</>
						)}
						<AddChargesButton
							label={t('catalog:features.form.featureDescription')}
							onClick={() => onUpdateFormState({ showDescription: true })}
						/>
						<AddChargesButton label={t('catalog:features.form.addGroup')} onClick={() => onUpdateFormState({ showGroup: true })} />
					</div>
				) : formState.showLookupKey ? (
					<Input
						label={t('catalog:features.form.lookupKey')}
						placeholder={t('catalog:features.form.lookupKeyPlaceholder')}
						value={data.lookup_key || ''}
						error={errors.lookup_key}
						onChange={(lookup_key) => onUpdateFeature({ lookup_key })}
					/>
				) : null}

				{/* 2. Nested optional fields — same UI whether Lookup Key was opened first or not */}
				{(formState.showLookupKey ||
					formState.showGroup ||
					formState.showUnitName ||
					formState.showReportingUnitName ||
					formState.showDescription) && (
					<>
						{isMeteredType && (
							<>
								{!formState.showUnitName && !formState.showReportingUnitName ? (
									<div className='flex flex-wrap items-center gap-2'>
										{!formState.showLookupKey && (
											<AddChargesButton
												label={t('catalog:features.form.lookupKey')}
												onClick={() => onUpdateFormState({ showLookupKey: true })}
											/>
										)}
										<AddChargesButton
											label={t('catalog:features.form.unitNameLower')}
											onClick={() => onUpdateFormState({ showUnitName: true })}
										/>
										<AddChargesButton
											label={t('catalog:features.form.displayUnitName')}
											onClick={() => onUpdateFormState({ showReportingUnitName: true })}
										/>
										{!formState.showDescription ? (
											<AddChargesButton
												label={t('catalog:features.form.featureDescriptionLower')}
												onClick={() => onUpdateFormState({ showDescription: true })}
											/>
										) : null}
										{!formState.showGroup && (
											<AddChargesButton
												label={t('catalog:features.form.addGroup')}
												onClick={() => onUpdateFormState({ showGroup: true })}
											/>
										)}
									</div>
								) : (
									<>
										{formState.showUnitName && (
											<div className='gap-4 grid grid-cols-2'>
												<Input
													label={t('catalog:features.form.unitSingular')}
													placeholder={t('catalog:features.form.unitSingularPh')}
													value={data.unit_singular || ''}
													onChange={handleUnitSingularChange}
												/>
												<Input
													label={t('catalog:features.form.unitPlural')}
													placeholder={t('catalog:features.form.unitPluralPh')}
													value={data.unit_plural || ''}
													onChange={(unit_plural) => onUpdateFeature({ unit_plural })}
												/>
											</div>
										)}
										{formState.showReportingUnitName && (
											<div className='gap-4 grid grid-cols-2'>
												<Input
													label={t('catalog:features.form.displayUnitSingular')}
													placeholder={t('catalog:features.form.displayUnitSingularPh')}
													value={data.reporting_unit?.unit_singular ?? ''}
													onChange={handleReportingUnitSingularChange}
												/>
												<Input
													label={t('catalog:features.form.displayUnitPlural')}
													placeholder={t('catalog:features.form.displayUnitPluralPh')}
													value={data.reporting_unit?.unit_plural ?? ''}
													onChange={(unit_plural) =>
														onUpdateFeature({
															reporting_unit: {
																unit_singular: data.reporting_unit?.unit_singular ?? '',
																unit_plural,
																conversion_rate: data.reporting_unit?.conversion_rate ?? '',
															},
														})
													}
												/>
												<Input
													label={t('catalog:features.form.conversionFactor')}
													placeholder={t('catalog:features.form.conversionFactorPh')}
													description={t('catalog:features.form.conversionFormula')}
													value={data.reporting_unit?.conversion_rate ?? ''}
													onChange={(conversion_rate) =>
														onUpdateFeature({
															reporting_unit: {
																unit_singular: data.reporting_unit?.unit_singular ?? '',
																unit_plural: data.reporting_unit?.unit_plural ?? '',
																conversion_rate,
															},
														})
													}
												/>
											</div>
										)}
										{(!formState.showLookupKey ||
											!formState.showGroup ||
											!formState.showUnitName ||
											!formState.showReportingUnitName ||
											!formState.showDescription) && (
											<div className='flex flex-wrap items-center gap-2'>
												{!formState.showLookupKey && (
													<AddChargesButton
														label={t('catalog:features.form.lookupKey')}
														onClick={() => onUpdateFormState({ showLookupKey: true })}
													/>
												)}
												{!formState.showUnitName && (
													<AddChargesButton
														label={t('catalog:features.form.unitNameLower')}
														onClick={() => onUpdateFormState({ showUnitName: true })}
													/>
												)}
												{!formState.showReportingUnitName && (
													<AddChargesButton
														label={t('catalog:features.form.displayUnitNameLower')}
														onClick={() => onUpdateFormState({ showReportingUnitName: true })}
													/>
												)}
												{!formState.showDescription && (
													<AddChargesButton
														label={t('catalog:features.form.featureDescriptionLower')}
														onClick={() => onUpdateFormState({ showDescription: true })}
													/>
												)}
												{!formState.showGroup && (
													<AddChargesButton
														label={t('catalog:features.form.addGroup')}
														onClick={() => onUpdateFormState({ showGroup: true })}
													/>
												)}
											</div>
										)}
									</>
								)}
							</>
						)}
						{!isMeteredType && (!formState.showLookupKey || !formState.showGroup || !formState.showDescription) && (
							<div className='flex flex-wrap items-center gap-2'>
								{!formState.showLookupKey && (
									<AddChargesButton
										label={t('catalog:features.form.lookupKey')}
										onClick={() => onUpdateFormState({ showLookupKey: true })}
									/>
								)}
								{!formState.showDescription && (
									<AddChargesButton
										label={t('catalog:features.form.featureDescriptionLower')}
										onClick={() => onUpdateFormState({ showDescription: true })}
									/>
								)}
								{!formState.showGroup && (
									<AddChargesButton label={t('catalog:features.form.addGroup')} onClick={() => onUpdateFormState({ showGroup: true })} />
								)}
							</div>
						)}
						{formState.showGroup && (
							<SelectGroup
								entityType={GROUP_ENTITY_TYPE.FEATURE}
								label={t('catalog:features.form.group')}
								placeholder={t('catalog:features.form.groupPlaceholder')}
								value={data.group_id ?? ''}
								onChange={(group) => onUpdateFeature({ group_id: group?.id ?? undefined })}
								showLookupKey={false}
							/>
						)}
						{formState.showDescription && (
							<Textarea
								label={t('catalog:features.form.featureDescriptionLabel')}
								placeholder={t('catalog:features.form.descriptionPlaceholder')}
								value={data.description || ''}
								error={errors.description}
								className='!min-h-32'
								onChange={(description) => onUpdateFeature({ description })}
							/>
						)}
					</>
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
	const { t } = useTranslation(['catalog', 'common']);
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
				placeholder={t('catalog:features.form.eventNamePlaceholder')}
				label={t('catalog:features.form.eventName')}
				description={t('catalog:features.form.eventNameHelp')}
				error={meterErrors.event_name}
				onChange={handleEventNameChange}
			/>
			<Spacer height='12px' />

			<div className='flex flex-col gap-2'>
				{!formState.showEventFilters ? (
					<AddChargesButton
						label={t('catalog:features.form.eventFilters')}
						onClick={() => onUpdateFormState({ showEventFilters: true })}
						className='self-start'
					/>
				) : null}
				{formState.showEventFilters ? (
					<>
						<FormHeader
							title={t('catalog:features.form.eventFiltersTitle')}
							subtitle={t('catalog:features.form.eventFiltersSubtitle')}
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
	const { t } = useTranslation(['catalog', 'common']);
	const handleAggregationTypeChange = useCallback(
		(type: string) => {
			const nextType = type as METER_AGGREGATION_TYPE;
			const stillSupportsExpression = EXPRESSION_SUPPORTED_TYPES.includes(nextType);
			onUpdateFeature({
				meter: {
					...meter,
					aggregation: {
						...meter?.aggregation,
						type: nextType,
						field: meter?.aggregation?.field ?? '',
						// Drop expression when switching to a type that can't carry one
						// (e.g. COUNT, COUNT_UNIQUE, SUM_WITH_MULTIPLIER, WEIGHTED_SUM).
						expression: stillSupportsExpression ? meter?.aggregation?.expression : '',
					},
				},
			});
			if (!stillSupportsExpression && formState.showCustomExpression) {
				onUpdateFormState({ showCustomExpression: false });
			}
		},
		[onUpdateFeature, onUpdateFormState, meter, formState.showCustomExpression],
	);

	const handleAggregationFieldChange = useCallback(
		(field: string) => {
			onUpdateFeature({
				meter: {
					...meter,
					aggregation: {
						...meter?.aggregation,
						type: meter?.aggregation?.type || METER_AGGREGATION_TYPE.SUM,
						field: field.trim(),
					},
				},
			});
		},
		[onUpdateFeature, meter],
	);

	const handleAggregationExpressionChange = useCallback(
		(expression: string) => {
			onUpdateFeature({
				meter: {
					...meter,
					aggregation: {
						...meter?.aggregation,
						type: meter?.aggregation?.type || METER_AGGREGATION_TYPE.SUM,
						expression,
					},
				},
			});
		},
		[onUpdateFeature, meter],
	);

	// Toggling the Custom Expression / Aggregation Field button enforces XOR
	// in the UI: the inactive side's value is cleared so we never POST both.
	const toggleCustomExpression = useCallback(() => {
		const next = !formState.showCustomExpression;
		onUpdateFeature({
			meter: {
				...meter,
				aggregation: {
					...(meter?.aggregation ?? { type: METER_AGGREGATION_TYPE.SUM }),
					field: next ? '' : (meter?.aggregation?.field ?? ''),
					expression: next ? (meter?.aggregation?.expression ?? '') : '',
				},
			},
		});
		onUpdateFormState({ showCustomExpression: next });
	}, [onUpdateFeature, onUpdateFormState, meter, formState.showCustomExpression]);

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

	const handleGroupByChange = useCallback(
		(value: string) => {
			onUpdateFeature({
				meter: {
					...meter,
					aggregation: {
						...(meter?.aggregation ?? { type: METER_AGGREGATION_TYPE.SUM }),
						group_by: value.trim() || undefined,
					},
				},
			});
		},
		[onUpdateFeature, meter],
	);

	const aggType = meter?.aggregation?.type;
	const supportsExpression = aggType ? EXPRESSION_SUPPORTED_TYPES.includes(aggType) : false;
	const showExpressionInput = supportsExpression && formState.showCustomExpression;
	const showFieldInput = aggType !== METER_AGGREGATION_TYPE.COUNT && !showExpressionInput;
	const showMultiplierInput = aggType === METER_AGGREGATION_TYPE.SUM_WITH_MULTIPLIER;

	return (
		<>
			<Card className='flex flex-col gap-3 pt-6 px-6 pb-4'>
				<Select
					options={AGGREGATION_OPTIONS}
					value={meter?.aggregation?.type || AGGREGATION_OPTIONS[0].value}
					onChange={handleAggregationTypeChange}
					description={t('catalog:features.form.aggregationChoose')}
					label={t('catalog:features.form.aggregationFunction')}
					placeholder={t('catalog:features.form.aggregationFunctionPh')}
					error={meterErrors.aggregation_type}
					hideSelectedTick={true}
				/>

				{showFieldInput && (
					<Input
						value={meter?.aggregation?.field || ''}
						disabled={meter?.aggregation?.type === METER_AGGREGATION_TYPE.COUNT}
						onChange={handleAggregationFieldChange}
						label={t('catalog:features.form.aggregationField')}
						placeholder={t('catalog:features.form.aggregationFieldPh')}
						description={t('catalog:features.form.aggregationFieldHelp')}
						error={meterErrors.aggregation_field}
					/>
				)}

				{showExpressionInput && (
					<div className='space-y-1'>
						<div className='flex items-center justify-between gap-2'>
							<label htmlFor='feature-custom-expression' className='text-sm font-medium text-gray-700'>
								{t('catalog:features.form.customExpression')}
							</label>
							<button
								type='button'
								onClick={toggleCustomExpression}
								className='text-sm text-gray-500 hover:text-gray-800 underline-offset-2 hover:underline'>
								{t('common:form.remove')}
							</button>
						</div>
						<Input
							id='feature-custom-expression'
							value={meter?.aggregation?.expression || ''}
							onChange={handleAggregationExpressionChange}
							placeholder={t('catalog:features.form.customExpressionPh')}
							description={<span className='whitespace-pre-line'>{t('catalog:features.form.customExpressionHelp')}</span>}
							error={meterErrors.aggregation_expression}
						/>
					</div>
				)}

				{showMultiplierInput && (
					<Input
						value={multiplierInput}
						onChange={handleMultiplierChange}
						label={t('catalog:features.form.aggregationMultiplier')}
						placeholder={t('catalog:features.form.aggregationMultiplierPh')}
						description={t('catalog:features.form.aggregationMultiplierHelp')}
						error={meterErrors.aggregation_multiplier}
					/>
				)}

				<div className='flex flex-col gap-2'>
					<div className='flex flex-wrap items-center gap-2'>
						{meter?.aggregation?.type === METER_AGGREGATION_TYPE.MAX && !formState.showGroupBy ? (
							<AddChargesButton label={t('catalog:features.form.groupByButton')} onClick={() => onUpdateFormState({ showGroupBy: true })} />
						) : null}
						{supportsExpression ? (
							<AddChargesButton
								label={t(
									formState.showCustomExpression
										? 'catalog:features.form.aggregationFieldButton'
										: 'catalog:features.form.customExpressionButton',
								)}
								onClick={toggleCustomExpression}
							/>
						) : null}
					</div>
					{meter?.aggregation?.type === METER_AGGREGATION_TYPE.MAX && formState.showGroupBy ? (
						<Input
							value={meter?.aggregation?.group_by || ''}
							onChange={handleGroupByChange}
							label={t('catalog:features.form.groupBy')}
							placeholder={t('catalog:features.form.groupByPlaceholder')}
							description={t('catalog:features.form.groupByHelp')}
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
		</>
	);
};

// Trimming lives here so the submitted payload and the copyable cURL preview
// cannot drift. These keys are matched verbatim against event.properties on the
// backend, so a preview that still rendered padded keys would teach users to
// ingest exactly the events the meter can no longer match.
const sanitizeMeterKeys = (meter: Partial<CreateMeterRequest>) => ({
	event_name: (meter.event_name || '').trim(),
	field: meter.aggregation?.field?.trim() || '',
	expression: meter.aggregation?.expression?.trim() || '',
	group_by: meter.aggregation?.group_by?.trim() || '',
	// Both predicates live here rather than at the call sites, so the preview
	// cannot advertise a filter the submitted meter drops.
	filters: (meter.filters || [])
		.map((filter) => ({ ...filter, key: filter.key.trim() }))
		.filter((filter) => filter.key !== '' && filter.values.length > 0),
});

// Code Preview Section Component
const CodePreviewSection = ({ meter }: { meter: Partial<CreateMeterRequest> | undefined }) => {
	const { t } = useTranslation(['catalog', 'common']);
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

		const sanitized = sanitizeMeterKeys(meter);

		const filterProperties = sanitized.filters
			.map((filter) => `\n\t\t\t "${filter.key}" : "${filter.values[0] || 'FILTER_VALUE'}"`)
			.join(',');

		const aggregationField = sanitized.field ? `,\n\t\t\t "${sanitized.field}":"__VALUE__"` : '';

		return `curl --request POST \\
	--url https://api.cloud.flexprice.io/v1/events \\
	--header 'Content-Type: application/json' \\
	--header 'x-api-key: <your_api_key>' \\
	--data '{
		"event_id": "${staticEventId}",
		"event_name": "${sanitized.event_name || '__MUST_BE_DEFINED__'}",
		"external_customer_id": "__CUSTOMER_ID__",
		"properties": {${filterProperties}${aggregationField}
		},
		"source": "api",
		"timestamp": "${staticDate}"
	}'`;
	}, [meter, staticEventId, staticDate]);

	return (
		<div className='sticky top-16 float-right'>
			<CodePreview title={t('catalog:features.form.eventExample')} className='sticky top-0' code={curlCommand} language='js' />
		</div>
	);
};

// Main Component
const AddFeaturePage = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const navigate = useNavigate();
	const { data, errors, meterErrors, formState, updateFeatureData, updateFormState, validateFeature, validateMeter } = useFeatureForm();

	const { isPending, mutate: createFeature } = useMutation({
		mutationFn: async (featureData: FeatureFormData = data) => {
			// Build CreateMeterRequest with proper structure if metered
			const meter = featureData.type === FEATURE_TYPE.METERED ? featureData.meter : undefined;
			const sanitized = meter ? sanitizeMeterKeys(meter) : undefined;

			const meterRequest: CreateMeterRequest | undefined =
				meter && sanitized
					? {
							name: (meter.name || featureData.name || '').trim(),
							event_name: sanitized.event_name,
							aggregation: {
								type: meter.aggregation?.type || METER_AGGREGATION_TYPE.SUM,
								// XOR with field — the toggle handler clears the inactive side,
								// so at most one of these is populated at submit time.
								...(sanitized.expression ? { expression: sanitized.expression } : { field: sanitized.field }),
								multiplier: meter.aggregation?.multiplier,
								group_by: sanitized.group_by || undefined,
							},
							reset_usage: meter.reset_usage || METER_USAGE_RESET_PERIOD.BILLING_PERIOD,
							filters: sanitized.filters,
						}
					: undefined;

			const ru = featureData.reporting_unit;
			const unitSingular = ru?.unit_singular?.trim() ?? '';
			const unitPlural = ru?.unit_plural?.trim() ?? '';
			const conversionRateRaw = ru?.conversion_rate?.trim() ?? '';
			const conversionRateNum = conversionRateRaw === '' ? NaN : Number(conversionRateRaw);
			const conversionRate =
				conversionRateRaw !== '' && !Number.isNaN(conversionRateNum) && isFinite(conversionRateNum) ? conversionRateRaw : '0.01';

			const reporting_unit =
				featureData.type === FEATURE_TYPE.METERED && (unitSingular || unitPlural)
					? {
							unit_singular: unitSingular,
							unit_plural: unitPlural,
							conversion_rate: conversionRate,
						}
					: undefined;

			const sanitizedData: CreateFeatureRequest = {
				name: featureData.name!.trim(),
				description: featureData.description,
				lookup_key: featureData.lookup_key?.trim(),
				type: featureData.type!,
				meter: meterRequest,
				metadata: featureData.metadata,
				unit_singular: featureData.unit_singular?.trim() || undefined,
				unit_plural: featureData.unit_plural?.trim() || undefined,
				reporting_unit,
				group_id: featureData.group_id?.trim() || undefined,
			};

			return await FeatureApi.createFeature(sanitizedData);
		},
		onSuccess: async () => {
			await refetchQueries(['fetchFeatures']);
			void queryClient.invalidateQueries({ queryKey: [SIDEBAR_PRICING_PROMO_QUERY_KEY], exact: false });
			navigate(RouteNames.features);
			toast.success('Feature created successfully');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'An error occurred while creating feature. Please try again.');
		},
	});

	const handleSubmit = useCallback(() => {
		// Validate feature data first
		if (!validateFeature(data)) {
			return;
		}

		// If type is metered, validate meter data
		if (data.type === FEATURE_TYPE.METERED) {
			if (!validateMeter(data.meter, formState)) {
				return;
			}
		}

		createFeature(data);
	}, [data, formState, validateFeature, validateMeter, createFeature]);

	const isCtaDisabled = useMemo(() => {
		const agg = data.meter?.aggregation;
		const meteredButMissingValue =
			data.type === FEATURE_TYPE.METERED &&
			(!data.meter?.event_name ||
				!agg?.type ||
				(agg.type !== METER_AGGREGATION_TYPE.COUNT && !agg?.field?.trim() && !agg?.expression?.trim()));
		return !data.name || !data.type || isPending || meteredButMissingValue;
	}, [data.name, data.type, data.meter, isPending]);

	const isMeteredType = data.type === FEATURE_TYPE.METERED;
	return (
		<Page type='left-aligned'>
			<ApiDocsContent tags={API_DOCS_TAGS.Features} />
			<p className='text-2xl font-medium'>{t('catalog:features.form.pageTitle')}</p>

			<Spacer height='16px' />

			<div className={cn('flex gap-5 relative !mb-24', isMeteredType && 'w-full')}>
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
							{isPending ? t('catalog:features.form.creating') : t('common:actions.save')}
						</Button>
					</div>
					<Spacer height='16px' />
				</div>

				<div className={cn('flex-[6] max-w-lg relative')}>{isMeteredType && <CodePreviewSection meter={data.meter} />}</div>
			</div>
		</Page>
	);
};

export default AddFeaturePage;
