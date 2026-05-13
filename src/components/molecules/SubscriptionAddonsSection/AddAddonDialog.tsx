import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { LineItemCommitmentConfig, LineItemCommitmentsMap } from '@/types/dto/LineItemCommitmentConfig';
import CommitmentConfigDialog from '@/components/molecules/CommitmentConfigDialog';
import { formatCommitmentSummary } from '@/utils/common/commitment_helpers';
import { isOneTimePlanPrice } from '@/utils/subscription/planPricesForSubscriptionUi';
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
			newErrors.addon_id = 'Addon is required';
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [formData]);

	// Add addon mutation
	const { mutate: addAddon, isPending: isAddingAddon } = useMutation({
		mutationFn: async (payload: AddAddonRequest) => {
			return await SubscriptionApi.addAddonToSubscription(payload);
		},
		onSuccess: () => {
			toast.success('Addon added successfully');
			refetchQueries(['subscriptionActiveAddons', subscriptionId]);
			refetchQueries(['subscriptionDetails', subscriptionId]);
			refetchQueries(['subscriptionEdit', subscriptionId]);
			refetchQueries(['subscriptionEntitlements', subscriptionId]);
			setFormData({});
			setErrors({});
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to add addon');
		},
	});

	const handleSave = useCallback(() => {
		const validation = validateForm();

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		setErrors({});
		const hasCommitments = Object.keys(lineItemCommitments || {}).length > 0;
		const addonData: AddAddonRequest = {
			subscription_id: subscriptionId,
			addon_id: formData.addon_id!,
			line_item_commitments: hasCommitments ? lineItemCommitments : undefined,
			...(startDate ? { start_date: startDate.toISOString() } : {}),
			...(cadence ? { cadence } : {}),
			...(prorationBehavior ? { proration_behavior: prorationBehavior } : {}),
		};

		addAddon(addonData);
	}, [formData, validateForm, subscriptionId, addAddon, lineItemCommitments, startDate, cadence, prorationBehavior]);

	const handleCancel = useCallback(() => {
		setFormData({});
		setErrors({});
		onOpenChange(false);
	}, [onOpenChange]);

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

	const selectedAddonPrices = useMemo(() => {
		const prices: Price[] = (selectedAddonDetails?.prices as Price[]) || [];
		let filtered = prices;
		if (currency) {
			filtered = filtered.filter((p) => p.currency?.toLowerCase() === currency.toLowerCase());
		}
		if (billingPeriod) {
			const periodKey = billingPeriod.toUpperCase();
			filtered = filtered.filter((p) => isOneTimePlanPrice(p) || p.billing_period?.toUpperCase() === periodKey);
		}
		return filtered;
	}, [selectedAddonDetails, billingPeriod, currency]);

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

	const addonChargeColumns: ColumnData<AddonChargeRow>[] = useMemo(
		() => [
			{
				title: 'Charge',
				render: (row) => <span>{row.price.display_name || row.price.meter?.name || 'Charge'}</span>,
			},
			{
				title: 'Type',
				render: (row) => <span>{toSentenceCase(row.price.type || '--')}</span>,
			},
			{
				title: 'Commitment',
				render: (row) => {
					if (row.price.type !== PRICE_TYPE.USAGE) {
						return <span className='text-sm text-gray-400'>Not available</span>;
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
							{hasConfig ? 'Edit' : 'Configure'}
						</Button>
					);
				},
			},
		],
		[lineItemCommitments, handleConfigureCommitment],
	);

	const filteredAddonOptions = useMemo(() => {
		return (addonsResponse?.items || []).map((addon: AddonResponse) => ({
			label: addon.name,
			value: addon.id,
			description: addon.description || 'No description',
		}));
	}, [addonsResponse]);

	return (
		<Dialog isOpen={isOpen} showCloseButton={false} onOpenChange={onOpenChange} title='Add' className='sm:max-w-[600px]'>
			<div className='grid gap-4 mt-3'>
				<div className='space-y-2'>
					<Select
						label='Addon'
						placeholder='Select addon'
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
								<p className='text-sm font-medium text-gray-700'>Charges</p>
							</div>
						</div>
						{selectedAddonPrices.length > 0 ? (
							<div className='rounded-xl border border-gray-200'>
								<FlexpriceTable columns={addonChargeColumns} data={selectedAddonPrices.map((p) => ({ price: p }))} />
							</div>
						) : (
							<div className='rounded-xl border border-gray-200 p-4'>
								<p className='text-sm text-gray-600'>No charges for this billing period/currency.</p>
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
										<span>Advanced options</span>
										<ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${advancedOpen ? 'rotate-180' : 'rotate-0'}`} />
									</button>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div className='px-4 pb-4 pt-1'>
										<div className='flex flex-col gap-3'>
											<DatePicker
												label='Start date (optional)'
												placeholder='Start date'
												date={startDate}
												setDate={setStartDate}
												className='w-full'
												popoverTriggerClassName='w-full'
											/>
											<Select
												label='Cadence (optional)'
												placeholder='Default'
												options={[
													{ label: 'Recurring', value: ADDON_CADENCE.RECURRING, description: 'Renews each billing period.' },
													{ label: 'One-time', value: ADDON_CADENCE.ONETIME, description: 'Applied once.' },
												]}
												value={cadence}
												onChange={(v) => setCadence(v as ADDON_CADENCE)}
											/>
											<Select
												label='Proration (optional)'
												placeholder='Default'
												options={[
													{
														label: 'Prorate',
														value: ADDON_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
														description: 'Creates proration credits/charges.',
													},
													{ label: 'No proration', value: ADDON_PRORATION_BEHAVIOR.NONE, description: 'No proration adjustments.' },
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
												Reset advanced options
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
					onSave={(priceId, config) => {
						setCommitmentForPrice(priceId, config);
					}}
					currentConfig={lineItemCommitments[selectedCommitmentPrice.id]}
					billingPeriod={billingPeriod}
				/>
			)}

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={handleCancel} disabled={isAddingAddon}>
					Cancel
				</Button>
				<Button onClick={handleSave} disabled={isAddingAddon}>
					{isAddingAddon ? 'Adding...' : 'Add'}
				</Button>
			</div>
		</Dialog>
	);
};

export default AddAddonDialog;
