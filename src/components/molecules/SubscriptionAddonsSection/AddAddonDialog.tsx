import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Select } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import AddonApi from '@/api/AddonApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { AddAddonRequest, SubscriptionResponse } from '@/types/dto/Subscription';
import { AddonResponse, ADDON_CADENCE, ADDON_PRORATION_BEHAVIOR } from '@/types/dto/Addon';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { ColumnData, FlexpriceTable } from '@/components/molecules';
import { Price, PRICE_TYPE } from '@/models/Price';
import { BILLING_PERIOD } from '@/constants/constants';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import { LineItemCommitmentConfig, LineItemCommitmentsMap } from '@/types/dto/LineItemCommitmentConfig';
import CommitmentConfigDialog from '@/components/molecules/CommitmentConfigDialog';
import { formatCommitmentSummary } from '@/utils/common/commitment_helpers';
import {
	buildCommitmentConfigOnSave,
	filterAddonPricesForSubscription,
	sanitizeAddonLineItemCommitmentsForApi,
} from '@/utils/subscription/addon_commitment_helpers';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	billingPeriod?: BILLING_PERIOD;
	currency?: string;
	/** When provided, skips GET subscription for defaults (subscription edit passes from core fetch). */
	currentPeriodEndIso?: string;
}

interface FormErrors {
	addon_id?: string;
}

const AddAddonDialog: React.FC<Props> = ({ isOpen, onOpenChange, subscriptionId, billingPeriod, currency, currentPeriodEndIso }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [formData, setFormData] = useState<Partial<AddAddonRequest>>({});
	const [errors, setErrors] = useState<FormErrors>({});
	const [selectedAddonDetails, setSelectedAddonDetails] = useState<AddonResponse | null>(null);
	const [lineItemCommitments, setLineItemCommitments] = useState<LineItemCommitmentsMap>({});
	const [selectedCommitmentPrice, setSelectedCommitmentPrice] = useState<Price | null>(null);
	const [isCommitmentDialogOpen, setIsCommitmentDialogOpen] = useState(false);
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [cadence, setCadence] = useState<ADDON_CADENCE | ''>('');
	const [prorationBehavior, setProrationBehavior] = useState<ADDON_PRORATION_BEHAVIOR | ''>('');

	const shouldFetchSubscription = !!subscriptionId && isOpen && !currentPeriodEndIso;

	const { data: subscriptionDetails } = useQuery({
		queryKey: ['subscriptionDetailsForAddAddonDialog', subscriptionId],
		queryFn: async () => {
			return await SubscriptionApi.getSubscription(subscriptionId);
		},
		enabled: shouldFetchSubscription,
	});

	const resolvedPeriodEndRaw = currentPeriodEndIso ?? (subscriptionDetails as SubscriptionResponse | undefined)?.current_period_end;

	// Fetch available addons
	const { data: addonsResponse } = useQuery({
		queryKey: ['subaddons', subscriptionId],
		queryFn: async () => {
			return await AddonApi.List({ limit: 1000, offset: 0 });
		},
	});

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setFormData({});
			setErrors({});
			setSelectedAddonDetails(null);
			setLineItemCommitments({});
			setSelectedCommitmentPrice(null);
			setIsCommitmentDialogOpen(false);
			setAdvancedOpen(false);
			setStartDate(undefined);
			setCadence('');
			setProrationBehavior('');
		}
	}, [isOpen]);

	const currentPeriodEndDate = useMemo(() => {
		const raw = resolvedPeriodEndRaw;
		if (!raw) return undefined;
		const parsed = new Date(raw);
		return isNaN(parsed.getTime()) ? undefined : parsed;
	}, [resolvedPeriodEndRaw]);

	const applyAdvancedDefaults = useCallback(() => {
		setCadence((prev) => (prev ? prev : ADDON_CADENCE.RECURRING));
		setProrationBehavior((prev) => (prev ? prev : ADDON_PRORATION_BEHAVIOR.NONE));
		setStartDate((prev) => (prev ? prev : currentPeriodEndDate));
	}, [currentPeriodEndDate]);

	const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
		const newErrors: FormErrors = {};

		if (!formData.addon_id) {
			newErrors.addon_id = t('billing:subscriptions.addAddonDialog.validation.addonRequired');
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [formData, t]);

	const selectedAddonPrices = useMemo(
		() => filterAddonPricesForSubscription((selectedAddonDetails?.prices as Price[]) || [], billingPeriod, currency),
		[selectedAddonDetails, billingPeriod, currency],
	);

	// Add addon mutation
	const { mutateAsync: addAddon, isPending: isAddingAddon } = useMutation({
		mutationFn: async (payload: AddAddonRequest) => {
			return await SubscriptionApi.addAddonToSubscription(payload);
		},
		onSuccess: () => {
			toast.success(t('billing:subscriptions.addAddonDialog.toast.addonAddedSuccess'));
			refetchQueries(['subscriptionActiveAddons', subscriptionId]);
			refetchQueries(['subscriptionDetails', subscriptionId]);
			refetchQueries(['subscriptionEdit', subscriptionId]);
			refetchQueries(['subscriptionEntitlements', subscriptionId]);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('billing:subscriptions.addAddonDialog.toast.addonAddFailed'));
		},
	});

	const handleSave = useCallback(async () => {
		if (isAddingAddon) return;

		const validation = validateForm();

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		setErrors({});
		const line_item_commitments = sanitizeAddonLineItemCommitmentsForApi(lineItemCommitments, selectedAddonPrices);
		const addonData: AddAddonRequest = {
			subscription_id: subscriptionId,
			addon_id: formData.addon_id!,
			line_item_commitments,
			...(startDate ? { start_date: startDate.toISOString() } : {}),
			...(cadence ? { cadence } : {}),
			...(prorationBehavior ? { proration_behavior: prorationBehavior } : {}),
		};

		try {
			await addAddon(addonData);
			setFormData({});
			setErrors({});
			onOpenChange(false);
		} catch {
			// Keep dialog open so the user can fix and retry.
		}
	}, [
		formData,
		validateForm,
		subscriptionId,
		addAddon,
		lineItemCommitments,
		selectedAddonPrices,
		startDate,
		cadence,
		prorationBehavior,
		isAddingAddon,
		onOpenChange,
	]);

	const handleCancel = useCallback(() => {
		if (isAddingAddon) return;
		setFormData({});
		setErrors({});
		onOpenChange(false);
	}, [onOpenChange, isAddingAddon]);

	const handleDialogOpenChange = useCallback(
		(open: boolean) => {
			if (!open && isAddingAddon) return;
			onOpenChange(open);
		},
		[onOpenChange, isAddingAddon],
	);

	const handleAddonSelect = useCallback(
		(addonId: string) => {
			const addonDetails = (addonsResponse?.items || []).find((addon: AddonResponse) => addon.id === addonId) || null;
			setSelectedAddonDetails(addonDetails);
			// Reset commitments when switching addons to avoid leaking configs across addons
			setLineItemCommitments({});
			// Reset advanced config when switching addons
			setStartDate(undefined);
			setCadence('');
			setProrationBehavior('');
			setFormData((prev) => ({ ...prev, addon_id: addonId }));
			// Clear error for this field when user selects
			if (errors.addon_id) {
				setErrors((prev) => ({ ...prev, addon_id: undefined }));
			}
		},
		[errors.addon_id, addonsResponse?.items],
	);

	type AddonChargeRow = { price: Price };

	const handleConfigureCommitment = useCallback((price: Price) => {
		if (price.type !== PRICE_TYPE.USAGE) return;
		setSelectedCommitmentPrice(price);
		setIsCommitmentDialogOpen(true);
	}, []);

	const setCommitmentForPrice = useCallback((priceId: string, config: LineItemCommitmentConfig | null) => {
		setLineItemCommitments((prev) => {
			const next: LineItemCommitmentsMap = { ...(prev || {}) };
			if (!config) {
				delete next[priceId];
			} else {
				next[priceId] = config;
			}
			return next;
		});
	}, []);

	const handleCommitmentSave = useCallback(
		(priceId: string, config: LineItemCommitmentConfig | null, timeBuckets?: CommitmentTimeBucket[]) => {
			if (!config) {
				setCommitmentForPrice(priceId, null);
				return;
			}
			setCommitmentForPrice(priceId, buildCommitmentConfigOnSave(config, timeBuckets));
		},
		[setCommitmentForPrice],
	);

	const addonChargeColumns: ColumnData<AddonChargeRow>[] = useMemo(
		() => [
			{
				title: t('billing:subscriptions.addAddonDialog.columns.charge'),
				render: (row) => (
					<span>{row.price.display_name || row.price.meter?.name || t('billing:subscriptions.addAddonDialog.chargeFallback')}</span>
				),
			},
			{
				title: t('billing:subscriptions.addAddonDialog.columns.type'),
				render: (row) => <span>{toSentenceCase(row.price.type || t('common:labels.na'))}</span>,
			},
			{
				title: t('billing:subscriptions.addAddonDialog.columns.commitment'),
				render: (row) => {
					if (row.price.type !== PRICE_TYPE.USAGE) {
						return <span className='text-sm text-gray-400'>{t('billing:subscriptions.addAddonDialog.commitmentNotAvailable')}</span>;
					}
					const config = lineItemCommitments[row.price.id];
					return config ? <span className='text-sm text-gray-600'>{formatCommitmentSummary(config)}</span> : <span>—</span>;
				},
			},
			{
				fieldVariant: 'interactive',
				hideOnEmpty: true,
				title: '',
				width: 140,
				align: 'right',
				render: (row) => {
					const canConfigure = row.price.type === PRICE_TYPE.USAGE;
					if (!canConfigure) return null;
					const hasConfig = lineItemCommitments[row.price.id] !== undefined;
					return (
						<Button variant='outline' onClick={() => handleConfigureCommitment(row.price)} type='button'>
							{hasConfig ? t('common:actions.edit') : t('billing:subscriptions.configure')}
						</Button>
					);
				},
			},
		],
		[lineItemCommitments, handleConfigureCommitment, t],
	);

	const filteredAddonOptions = useMemo(() => {
		return (addonsResponse?.items || []).map((addon: AddonResponse) => ({
			label: addon.name,
			value: addon.id,
			description: addon.description || t('billing:subscriptions.addAddonDialog.noDescription'),
		}));
	}, [addonsResponse, t]);

	return (
		<Dialog
			isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={handleDialogOpenChange}
			title={t('common:actions.add')}
			className='sm:max-w-[900px]'>
			<div className='grid gap-4 mt-3'>
				<div className='space-y-2'>
					<Select
						label={t('billing:subscriptions.addon')}
						placeholder={t('billing:subscriptions.selectAddon')}
						options={filteredAddonOptions}
						value={formData.addon_id || ''}
						onChange={handleAddonSelect}
						error={errors.addon_id}
					/>
				</div>

				{/* Addon Charges & Commitments */}
				{formData.addon_id && (
					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-700'>{t('common:labels.charges')}</p>
							</div>
						</div>
						{selectedAddonPrices.length > 0 ? (
							<div className='rounded-xl border border-gray-200'>
								<FlexpriceTable columns={addonChargeColumns} data={selectedAddonPrices.map((p) => ({ price: p }))} />
							</div>
						) : (
							<div className='rounded-xl border border-gray-200 p-4'>
								<p className='text-sm text-gray-600'>{t('billing:subscriptions.addAddonDialog.emptyNoChargesForPeriodCurrency')}</p>
							</div>
						)}

						{/* Advanced options (optional) */}
						<Collapsible
							open={advancedOpen}
							onOpenChange={(open) => {
								setAdvancedOpen(open);
								if (open) {
									applyAdvancedDefaults();
								}
							}}>
							<div className='rounded-xl border border-gray-200 bg-white'>
								<CollapsibleTrigger asChild>
									<button
										type='button'
										className='w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-xl'>
										<span>{t('billing:subscriptions.addAddonDialog.advancedOptions')}</span>
										<ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${advancedOpen ? 'rotate-180' : 'rotate-0'}`} />
									</button>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div className='px-4 pb-4 pt-1'>
										<div className='flex flex-col gap-3'>
											<DatePicker
												label={t('billing:subscriptions.startDateOptional')}
												placeholder={t('billing:subscriptions.startDate')}
												date={startDate}
												setDate={setStartDate}
												className='w-full'
												popoverTriggerClassName='w-full'
											/>
											<Select
												label={t('billing:subscriptions.cadenceOptional')}
												placeholder={t('common:labels.default')}
												options={[
													{
														label: t('billing:subscriptions.addAddonDialog.cadence.recurring'),
														value: ADDON_CADENCE.RECURRING,
														description: t('billing:subscriptions.addAddonDialog.cadence.recurringDescription'),
													},
													{
														label: t('billing:subscriptions.addAddonDialog.cadence.onetime'),
														value: ADDON_CADENCE.ONETIME,
														description: t('billing:subscriptions.addAddonDialog.cadence.onetimeDescription'),
													},
												]}
												value={cadence}
												onChange={(v) => setCadence(v as ADDON_CADENCE)}
											/>
											<Select
												label={t('billing:subscriptions.prorationOptional')}
												placeholder={t('common:labels.default')}
												options={[
													{
														label: t('billing:subscriptions.addAddonDialog.proration.prorate'),
														value: ADDON_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
														description: t('billing:subscriptions.addAddonDialog.proration.prorateDescription'),
													},
													{
														label: t('billing:subscriptions.addAddonDialog.proration.none'),
														value: ADDON_PRORATION_BEHAVIOR.NONE,
														description: t('billing:subscriptions.addAddonDialog.proration.noneDescription'),
													},
												]}
												value={prorationBehavior}
												onChange={(v) => setProrationBehavior(v as ADDON_PRORATION_BEHAVIOR)}
											/>
										</div>
										<div className='pt-3'>
											<button
												type='button'
												className='text-xs text-gray-500 hover:text-gray-700'
												onClick={() => {
													setStartDate(undefined);
													setCadence(ADDON_CADENCE.RECURRING);
													setProrationBehavior(ADDON_PRORATION_BEHAVIOR.NONE);
												}}>
												{t('billing:subscriptions.addAddonDialog.resetAdvancedOptions')}
											</button>
										</div>
									</div>
								</CollapsibleContent>
							</div>
						</Collapsible>
					</div>
				)}
			</div>

			{/* Commitment Configuration Dialog */}
			{selectedCommitmentPrice && (
				<CommitmentConfigDialog
					isOpen={isCommitmentDialogOpen}
					onOpenChange={setIsCommitmentDialogOpen}
					price={selectedCommitmentPrice}
					onSave={handleCommitmentSave}
					currentConfig={lineItemCommitments[selectedCommitmentPrice.id]}
					currentTimeBuckets={lineItemCommitments[selectedCommitmentPrice.id]?.commitment_time_buckets}
					billingPeriod={billingPeriod}
				/>
			)}

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={handleCancel} disabled={isAddingAddon}>
					{t('common:actions.cancel')}
				</Button>
				<Button onClick={handleSave} isLoading={isAddingAddon} disabled={isAddingAddon}>
					{t('common:actions.add')}
				</Button>
			</div>
		</Dialog>
	);
};

export default AddAddonDialog;
