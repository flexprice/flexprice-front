import { Button, Checkbox, Dialog, FormHeader, Input, Select, SelectFeature, Spacer, Toggle } from '@/components/atoms';
import { Sheet as ShadcnSheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { isPortaledSelectTarget } from '@/components/atoms/Sheet/Sheet';
import { JsonObject } from '@/types/common';
import { JsonEditor } from '@/components/molecules/JsonEditor';
import { getFeatureIcon } from '@/components/atoms/SelectFeature/SelectFeature';
import { AddChargesButton } from '@/components/organisms/PlanForm/SetupChargesSection';

import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Entitlement, ENTITLEMENT_ENTITY_TYPE, ENTITLEMENT_USAGE_RESET_PERIOD } from '@/models/Entitlement';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { METER_USAGE_RESET_PERIOD } from '@/models/Meter';
import EntitlementApi from '@/api/EntitlementApi';
import FeatureApi from '@/api/FeatureApi';
import { CreateBulkEntitlementRequest, CreateEntitlementRequest } from '@/types/dto/Entitlement';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator, X } from 'lucide-react';
import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import type { TFunction } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Direction } from '@/config/branding';

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
	config_value?: string;
	usage_reset_period?: string;
	is_enabled?: string;
	general?: string;
	feature?: string;
}

// Validation functions extracted for better reusability and testing
const validateMeteredFeature = (
	activeFeature: Feature | null,
	tempEntitlement: Partial<Entitlement>,
	t: TFunction<'catalog'>,
): ValidationErrors => {
	const newErrors: ValidationErrors = {};

	if (!activeFeature?.meter_id) {
		newErrors.feature = t('entitlements.validation.featureMeterRequired');
		return newErrors;
	}

	const isInfinite = tempEntitlement.usage_limit === null;
	const isResetNever = activeFeature?.meter?.reset_usage === METER_USAGE_RESET_PERIOD.NEVER;

	// If reset period is set to NEVER, usage limit is required (cannot be infinite)
	if (isResetNever) {
		if (tempEntitlement.usage_limit !== undefined && tempEntitlement.usage_limit !== null && tempEntitlement.usage_limit < 0) {
			newErrors.usage_limit = t('entitlements.validation.usageLimitNegative');
		}
	} else {
		// Normal validation for usage limit when reset is not NEVER
		if (tempEntitlement.usage_limit === undefined) {
			newErrors.usage_limit = t('entitlements.validation.usageLimitRequired');
		} else if (tempEntitlement.usage_limit !== null && tempEntitlement.usage_limit < 0) {
			newErrors.usage_limit = t('entitlements.validation.usageLimitNegative');
		}
	}

	// If user sets to infinite, don't require usage reset period
	// If reset is NEVER, usage reset period is not applicable
	if (!isInfinite && !isResetNever) {
		if (!tempEntitlement.usage_reset_period) {
			newErrors.usage_reset_period = t('entitlements.validation.usageResetRequired');
		}
	}

	return newErrors;
};

const validateStaticFeature = (tempEntitlement: Partial<Entitlement>, t: TFunction<'catalog'>): ValidationErrors => {
	const newErrors: ValidationErrors = {};

	const staticValue = tempEntitlement.static_value;
	if (staticValue === undefined || staticValue === null) {
		newErrors.static_value = t('entitlements.validation.staticValueRequired');
	} else if (typeof staticValue === 'number' && staticValue < 0) {
		newErrors.static_value = t('entitlements.validation.staticValueNegative');
	} else if (typeof staticValue === 'string' && !staticValue.trim()) {
		newErrors.static_value = t('entitlements.validation.staticValueEmpty');
	}

	return newErrors;
};

const validateEntitlement = (
	activeFeature: Feature | null,
	tempEntitlement: Partial<Entitlement>,
	t: TFunction<'catalog'>,
): ValidationErrors => {
	if (!activeFeature) {
		return { feature: t('entitlements.validation.selectFeature') };
	}

	switch (activeFeature.type) {
		case FEATURE_TYPE.METERED:
			return validateMeteredFeature(activeFeature, tempEntitlement, t);
		case FEATURE_TYPE.STATIC:
			return validateStaticFeature(tempEntitlement, t);
		case FEATURE_TYPE.BOOLEAN:
			return {};
		case FEATURE_TYPE.CONFIG: {
			const cv = tempEntitlement.config_value;
			if (!cv || Object.keys(cv).length === 0) {
				return { config_value: t('entitlements.addDrawer.configValueRequired') };
			}
			return {};
		}
		default:
			return { feature: t('entitlements.validation.invalidFeatureType') };
	}
};

/** Unit Value = Display Value × Conversion Factor. Use these for all conversions. */
const DISPLAY_VALUE_FORMULA = {
	/** displayValue = unitValue / conversionRate */
	toDisplay: (unitValue: number, conversionRate: number) => (conversionRate !== 0 ? unitValue / conversionRate : null),
	/** unitValue = displayValue * conversionRate */
	toUnit: (displayValue: number, conversionRate: number) => displayValue * conversionRate,
} as const;

interface DisplayValueCalculatorDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	unitValue?: number;
	reportingUnit?: { unit_singular?: string; unit_plural?: string; conversion_rate?: string } | null;
	baseUnitPlural?: string;
	/** Called when OK is pressed with the computed unit value; use to populate the entitlement value field */
	onConfirm?: (unitValue: number) => void;
}

const DisplayValueCalculatorDialog: FC<DisplayValueCalculatorDialogProps> = ({
	isOpen,
	onOpenChange,
	unitValue,
	reportingUnit,
	baseUnitPlural,
	onConfirm,
}) => {
	const { t } = useTranslation('catalog');
	const resolvedBasePlural = baseUnitPlural ?? t('entitlements.addDrawer.unitsFallback');
	// User enters display value; we compute unit value = displayValue * conversionRate
	const [displayValueInput, setDisplayValueInput] = useState<string>('');

	useEffect(() => {
		if (isOpen && unitValue != null && reportingUnit?.conversion_rate != null) {
			const rate = parseFloat(reportingUnit.conversion_rate);
			if (!Number.isNaN(rate) && rate !== 0) {
				const display = DISPLAY_VALUE_FORMULA.toDisplay(unitValue, rate);
				setDisplayValueInput(String(display));
				return;
			}
		}
		if (isOpen) setDisplayValueInput('');
	}, [isOpen, unitValue, reportingUnit?.conversion_rate]);

	const conversionRateNum =
		reportingUnit?.conversion_rate != null && reportingUnit.conversion_rate !== '' ? parseFloat(reportingUnit.conversion_rate) : null;
	const displayValueNum = displayValueInput.trim() === '' ? null : parseFloat(displayValueInput.replace(/,/g, ''));
	const isValidDisplay = displayValueNum != null && !Number.isNaN(displayValueNum) && displayValueNum >= 0;
	const computedUnitValue =
		isValidDisplay && conversionRateNum != null && conversionRateNum !== 0 && !Number.isNaN(conversionRateNum)
			? DISPLAY_VALUE_FORMULA.toUnit(displayValueNum, conversionRateNum)
			: null;
	const displayUnitPlural = reportingUnit?.unit_plural ?? resolvedBasePlural;

	if (!reportingUnit) {
		return (
			<Dialog isOpen={isOpen} onOpenChange={onOpenChange} title={t('entitlements.displayCalculator.titleFallback')}>
				<p className='text-sm text-muted-foreground'>{t('entitlements.displayCalculator.noDisplayUnit')}</p>
			</Dialog>
		);
	}

	const emDash = t('entitlements.displayCalculator.emDash');
	const usageLimitDisplay = computedUnitValue != null ? computedUnitValue.toLocaleString(undefined, { maximumFractionDigits: 10 }) : emDash;

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('entitlements.displayCalculator.title')}
			description={
				<Trans
					ns='catalog'
					i18nKey='entitlements.displayCalculator.description'
					values={{ displayUnit: displayUnitPlural, baseUnit: resolvedBasePlural }}
					components={{
						strongDisplay: <span className='font-semibold' />,
						strongBase: <span className='font-semibold' />,
					}}
				/>
			}>
			<div className='space-y-4'>
				<Input
					label={t('entitlements.displayCalculator.valueInDisplayUnitLabel')}
					placeholder={t('entitlements.displayCalculator.enterValuePlaceholder')}
					value={displayValueInput}
					onChange={setDisplayValueInput}
					variant='formatted-number'
					suffix={<span className='text-muted-foreground text-xs'>{displayUnitPlural}</span>}
				/>

				{computedUnitValue != null && (
					<div className='rounded-md border border-border bg-card p-4'>
						<p className='text-sm'>
							<span className='font-medium text-foreground'>{t('entitlements.displayCalculator.calculatedUsageLimit')}</span>{' '}
							<span className='font-semibold text-info'>{usageLimitDisplay}</span>{' '}
							<span className='text-muted-foreground text-xs'>{resolvedBasePlural}</span>
						</p>
					</div>
				)}

				<p className='text-sm text-muted-foreground'>
					<Trans
						ns='catalog'
						i18nKey='entitlements.displayCalculator.conversionFactor'
						values={{ rate: reportingUnit.conversion_rate ?? emDash }}
						components={{ rate: <span className='font-semibold text-info' /> }}
					/>
				</p>

				<div className='mt-4 flex justify-end'>
					<Button
						type='button'
						onClick={() => {
							if (computedUnitValue != null && onConfirm) onConfirm(computedUnitValue);
							onOpenChange(false);
						}}>
						{t('entitlements.displayCalculator.confirm')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
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
	const { t } = useTranslation('catalog');
	const queryClient = useQueryClient();
	const direction = useLocaleStore((s) => s.direction);
	const sheetSide = direction === Direction.RTL ? 'left' : 'right';

	const entitlementUsageResetOptions = useMemo(
		() => [
			{ label: t('entitlements.usageResetPeriod.DAILY'), value: ENTITLEMENT_USAGE_RESET_PERIOD.DAILY },
			{ label: t('entitlements.usageResetPeriod.WEEKLY'), value: ENTITLEMENT_USAGE_RESET_PERIOD.WEEKLY },
			{ label: t('entitlements.usageResetPeriod.MONTHLY'), value: ENTITLEMENT_USAGE_RESET_PERIOD.MONTHLY },
			{ label: t('entitlements.usageResetPeriod.QUARTERLY'), value: ENTITLEMENT_USAGE_RESET_PERIOD.QUARTERLY },
			{ label: t('entitlements.usageResetPeriod.HALF_YEARLY'), value: ENTITLEMENT_USAGE_RESET_PERIOD.HALF_YEARLY },
			{ label: t('entitlements.usageResetPeriod.ANNUAL'), value: ENTITLEMENT_USAGE_RESET_PERIOD.ANNUAL },
			{ label: t('entitlements.usageResetPeriod.NEVER'), value: ENTITLEMENT_USAGE_RESET_PERIOD.NEVER },
		],
		[t],
	);

	const [entitlements, setEntitlements] = useState<Partial<Entitlement>[]>([]);
	const [errors, setErrors] = useState<ValidationErrors>({});
	const [, setSelectedFeatures] = useState<Feature[]>(disabledFeatures ?? []);

	const [showSelect, setShowSelect] = useState(true);
	const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
	const [tempEntitlement, setTempEntitlement] = useState<Partial<Entitlement>>({});
	const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

	// Fetch full feature (including reporting_unit) when one is selected; list API may omit it
	const { data: fullFeature } = useQuery({
		queryKey: ['fetchFeatureById', activeFeature?.id],
		queryFn: () => FeatureApi.getFeatureById(activeFeature!.id),
		enabled: !!activeFeature?.id,
		staleTime: 60000,
	});
	const featureForForm = fullFeature ?? activeFeature;

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
		setIsCalculatorOpen(false);
	}, [disabledFeatures]);

	// Memoize already added feature IDs (from entitlements + initial entitlements)
	const alreadyAddedFeatureIds = useMemo(() => {
		const currentEntitlementFeatureIds = entitlements.map((ent) => ent.feature_id).filter(Boolean) as string[];
		return [...new Set([...currentEntitlementFeatureIds, ...existingFeatureIds])];
	}, [entitlements, existingFeatureIds]);

	// Handle drawer close
	const handleDrawerClose = (open: boolean) => {
		if (!open) {
			resetState();
		}
		onOpenChange(open);
	};

	const preventPortaledSelectDismiss = useCallback((event: Event) => {
		if (isPortaledSelectTarget(event.target)) {
			event.preventDefault();
		}
	}, []);

	// Non-modal dialogs get no default protection against focus-outside dismissal (Radix only
	// applies that to modal dialogs). Without it, opening this drawer from a menu item/action
	// button would close it the instant that trigger reclaims focus after its own menu finishes
	// closing. Focus moving elsewhere should never by itself close the drawer.
	const preventFocusOutsideDismiss = useCallback((event: Event) => {
		event.preventDefault();
	}, []);

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
		const validationErrors = validateEntitlement(activeFeature, tempEntitlement, t);
		setErrors(validationErrors);
		return Object.keys(validationErrors).length === 0;
	}, [activeFeature, tempEntitlement, t]);

	const { mutate: createBulkEntitlements, isPending } = useMutation({
		mutationKey: ['createBulkEntitlements', entitlements],
		mutationFn: async () => {
			if (!entityId) {
				throw new Error(t('entitlements.errors.entityIdRequired'));
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
				config_value: entitlement.config_value ?? undefined,
				entity_type: entityType,
				entity_id: entityId,
			}));

			const bulkRequest: CreateBulkEntitlementRequest = {
				items: entitlementRequests,
			};

			return await EntitlementApi.createBulk(bulkRequest);
		},
		onSuccess: () => {
			toast.success(t('entitlements.toast.addedSuccess'));
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
		onError: (error: Error) => {
			const message = error.message || t('entitlements.toast.addFailed');
			toast.error(message);
			setErrors({ general: message });
		},
	});

	const handleSubmit = () => {
		if (entitlements.length === 0) {
			const msg = t('entitlements.validation.addAtLeastOne');
			setErrors({ general: msg });
			toast.error(msg);
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
			const msg = t('entitlements.validation.featureAlreadyAdded');
			setErrors({ feature: msg });
			toast.error(msg);
			return;
		}

		const newEntitlement: Partial<Entitlement> = {
			...tempEntitlement,
			feature: activeFeature,
			feature_id: activeFeature.id,
			feature_type: activeFeature.type,
			is_enabled: activeFeature.type === FEATURE_TYPE.BOOLEAN || activeFeature.type === FEATURE_TYPE.CONFIG ? true : undefined,
			config_value: activeFeature.type === FEATURE_TYPE.CONFIG ? tempEntitlement.config_value : undefined,
			entity_type: entityType,
			entity_id: entityId || '',
		};

		setEntitlements((prev) => [...prev, newEntitlement]);
		setTempEntitlement({});
		setActiveFeature(null);
		setShowSelect(true);
		setErrors({});
		setIsCalculatorOpen(false);
	}, [activeFeature, validateCurrentEntitlement, alreadyAddedFeatureIds, tempEntitlement, entityType, entityId, t]);

	// Clear errors when feature changes
	useEffect(() => {
		setErrors({});
	}, [activeFeature]);

	// Memoized error display component
	const ErrorDisplay = useMemo(() => {
		if (!errors.general) return null;
		return <div className='p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4'>{errors.general}</div>;
	}, [errors.general]);

	// Memoized feature error display component
	const FeatureErrorDisplay = useMemo(() => {
		if (!errors.feature) return null;
		return <div className='p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4'>{errors.feature}</div>;
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
		setIsCalculatorOpen(false);
	}, [activeFeature]);

	return (
		<div>
			<ShadcnSheet open={isOpen} onOpenChange={handleDrawerClose} modal={false}>
				<SheetContent
					side={sheetSide}
					className={cn('h-screen overflow-y-auto rounded-[10px] sm:max-w-sm bg-card')}
					onPointerDownOutside={preventPortaledSelectDismiss}
					onInteractOutside={preventPortaledSelectDismiss}
					onFocusOutside={preventFocusOutsideDismiss}>
					<SheetHeader>
						<SheetTitle>{t('entitlements.addDrawer.title')}</SheetTitle>
						<SheetDescription>{t('entitlements.addDrawer.description')}</SheetDescription>
					</SheetHeader>
					<div className='space-y-4 mt-6'>
						{ErrorDisplay}

						{entitlements.map((entitlement, index) => (
							<div
								key={`${entitlement.feature_id}-${index}`}
								className='rounded-md border !p-2 !px-3 flex w-full justify-between items-center'>
								<p className='text-foreground text-sm font-medium'>{entitlement.feature?.name}</p>
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
									// Seed cache so SelectFeature can show the selected label immediately
									// (it resolves display value via ['fetchFeatureById', id]).
									queryClient.setQueryData(['fetchFeatureById', feature.id], feature);

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
								label={t('entitlements.addDrawer.featuresLabel')}
								placeholder={t('entitlements.addDrawer.selectFeaturePlaceholder')}
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
											<span className='text-foreground text-sm font-sans'>{activeFeature.meter?.name}</span>
										</div>
									)} */}
										{/* <Spacer className='!my-6' /> */}
										<Input
											error={errors.usage_limit}
											label={t('entitlements.addDrawer.valueLabel')}
											placeholder={t('entitlements.addDrawer.enterValuePlaceholder')}
											disabled={tempEntitlement.usage_limit === null}
											variant='formatted-number'
											value={
												tempEntitlement.usage_limit === null
													? t('entitlements.addDrawer.unlimitedDisplay')
													: tempEntitlement.usage_limit?.toString() || ''
											}
											onChange={(value) => {
												const numValue = value === '' ? undefined : Number(value);
												setTempEntitlement((prev) => ({
													...prev,
													usage_limit: numValue,
												}));
											}}
											suffix={
												<div className='flex items-center gap-1.5'>
													<span className='text-muted-foreground text-xs font-sans'>
														{featureForForm?.unit_plural?.trim() || t('entitlements.addDrawer.unitsFallback')}
													</span>
													{featureForForm?.reporting_unit != null && (
														<Button
															type='button'
															variant='ghost'
															size='icon'
															className='size-7 shrink-0 text-muted-foreground hover:text-foreground'
															onClick={() => setIsCalculatorOpen(true)}
															aria-label={t('entitlements.addDrawer.calculatorAriaLabel')}>
															<Calculator className='size-4' />
														</Button>
													)}
												</div>
											}
										/>
										<Spacer className='!my-4' />
										<Checkbox
											id='set-infinite'
											label={t('entitlements.addDrawer.setInfiniteLabel')}
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
											label={t('entitlements.addDrawer.usageResetLabel')}
											placeholder={t('entitlements.addDrawer.usageResetPlaceholder')}
											options={entitlementUsageResetOptions}
											description={t('entitlements.addDrawer.usageResetDescription')}
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
											label={t('entitlements.addDrawer.softLimitLabel')}
											description={t('entitlements.addDrawer.softLimitDescription')}
											onChange={(value) => {
												setTempEntitlement((prev) => ({
													...prev,
													is_soft_limit: value,
												}));
											}}
										/>
									</div>
								)}

								{/* config features */}
								{activeFeature.type === FEATURE_TYPE.CONFIG && (
									<div>
										<Spacer height='12px' />
										<JsonEditor
											key={activeFeature.id}
											value={(tempEntitlement.config_value as JsonObject) ?? null}
											onChange={(parsed) => {
												setTempEntitlement((prev) => ({ ...prev, config_value: parsed ?? undefined }));
											}}
										/>
										{errors.config_value && <p className='text-xs text-destructive mt-1'>{errors.config_value}</p>}
									</div>
								)}

								{/* static features */}
								{activeFeature.type === FEATURE_TYPE.STATIC && (
									<div>
										<Input
											error={errors.static_value}
											label={t('entitlements.addDrawer.valueLabel')}
											value={tempEntitlement.static_value === undefined ? '' : tempEntitlement.static_value.toString()}
											placeholder={t('entitlements.addDrawer.enterValuePlaceholder')}
											onChange={(value) => {
												setTempEntitlement((prev) => ({
													...prev,
													static_value: value === '' ? undefined : value,
												}));
											}}
											suffix={
												featureForForm?.reporting_unit != null ? (
													<Button
														type='button'
														variant='ghost'
														size='icon'
														className='size-7 shrink-0 text-muted-foreground hover:text-foreground'
														onClick={() => setIsCalculatorOpen(true)}
														aria-label={t('entitlements.addDrawer.calculatorAriaLabel')}>
														<Calculator className='size-4' />
													</Button>
												) : undefined
											}
										/>
									</div>
								)}

								<div className='w-full mt-6 flex justify-end gap-2'>
									<Button onClick={handleCancel} variant={'outline'}>
										{t('entitlements.addDrawer.cancel')}
									</Button>
									<Button onClick={handleAdd}>{t('entitlements.addDrawer.add')}</Button>
								</div>
							</div>
						)}
					</div>

					<div className='!space-y-4 mt-4'>
						{!showSelect && !activeFeature && (
							<AddChargesButton onClick={() => setShowSelect(true)} label={t('entitlements.addDrawer.addAnotherFeature')} />
						)}
						<Button isLoading={isPending} onClick={handleSubmit} disabled={isPending || (!showSelect && !!activeFeature)}>
							{t('entitlements.addDrawer.save')}
						</Button>
					</div>
				</SheetContent>
			</ShadcnSheet>

			<DisplayValueCalculatorDialog
				isOpen={isCalculatorOpen}
				onOpenChange={setIsCalculatorOpen}
				unitValue={(() => {
					if (activeFeature?.type === FEATURE_TYPE.METERED) return tempEntitlement.usage_limit ?? undefined;
					if (activeFeature?.type === FEATURE_TYPE.STATIC && tempEntitlement.static_value != null) {
						const n =
							typeof tempEntitlement.static_value === 'string'
								? parseFloat(tempEntitlement.static_value)
								: Number(tempEntitlement.static_value);
						return Number.isFinite(n) ? n : undefined;
					}
					return undefined;
				})()}
				reportingUnit={featureForForm?.reporting_unit}
				baseUnitPlural={featureForForm?.unit_plural?.trim() || t('entitlements.addDrawer.unitsFallback')}
				onConfirm={(unitValue) => {
					if (activeFeature?.type === FEATURE_TYPE.METERED) {
						setTempEntitlement((prev) => ({ ...prev, usage_limit: unitValue }));
					} else if (activeFeature?.type === FEATURE_TYPE.STATIC) {
						setTempEntitlement((prev) => ({ ...prev, static_value: String(unitValue) }));
					}
				}}
			/>
		</div>
	);
};

export default AddEntitlementDrawer;
