import { AddAddonToSubscriptionRequest, AddonResponse } from '@/types/dto/Addon';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, DatePicker } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import { useQuery } from '@tanstack/react-query';
import AddonApi from '@/api/AddonApi';
import { Select } from '@/components/atoms';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { ColumnData, FlexpriceTable } from '@/components/molecules';
import { Price, PRICE_TYPE } from '@/models/Price';
import { BILLING_PERIOD } from '@/constants/constants';
import {
	ExtendedPriceOverride,
	getLineItemOverrides,
	overrideLineItemsToMap,
	removePriceOverride,
	updatePriceOverride,
} from '@/utils/common/price_override_helpers';
import { sanitizeAddonOverrideLineItemsForApi } from '@/utils/subscription/addonQuantity';
import { PriceQuantityCell } from '@/components/molecules/PriceQuantityCell';
import PriceOverrideDialog from '@/components/molecules/PriceOverrideDialog/PriceOverrideDialog';
import ChargeValueCell from '@/components/molecules/ChargeValueCell/ChargeValueCell';
import { DropdownMenu as UiDropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BsThreeDots } from 'react-icons/bs';
import { Pencil, RotateCcw, Target } from 'lucide-react';
import { LineItemCommitmentConfig, LineItemCommitmentsMap } from '@/types/dto/LineItemCommitmentConfig';
import CommitmentConfigDialog from '@/components/molecules/CommitmentConfigDialog';
import { formatCommitmentSummary } from '@/utils/common/commitment_helpers';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import { buildCommitmentConfigOnSave, filterAddonPricesForSubscription } from '@/utils/subscription/addon_commitment_helpers';
import { useTranslation } from 'react-i18next';

interface Props {
	data?: AddAddonToSubscriptionRequest;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (addon: AddAddonToSubscriptionRequest) => void;
	onCancel: () => void;
	getEmptyAddon: () => Partial<AddAddonToSubscriptionRequest>;
	billingPeriod?: BILLING_PERIOD;
	/** Subscription's billing_period_count paired with billingPeriod for the cadence-compat filter. Defaults to 1. */
	billingPeriodCount?: number;
	currency?: string;
}

interface FormErrors {
	addon_id?: string;
}

type AddonChargeRow = {
	price: Price;
};

const SubscriptionAddonModal: React.FC<Props> = ({
	data,
	isOpen,
	onOpenChange,
	onSave,
	onCancel,
	getEmptyAddon,
	billingPeriod,
	billingPeriodCount = 1,
	currency,
}) => {
	const { t } = useTranslation(['common', 'customers']);
	const [formData, setFormData] = useState<Partial<AddAddonToSubscriptionRequest>>({});
	const [errors, setErrors] = useState<FormErrors>({});
	const [selectedAddonDetails, setSelectedAddonDetails] = useState<AddonResponse | null>(null);
	const [selectedCommitmentPrice, setSelectedCommitmentPrice] = useState<Price | null>(null);
	const [isCommitmentDialogOpen, setIsCommitmentDialogOpen] = useState(false);
	const [overriddenPrices, setOverriddenPrices] = useState<Record<string, ExtendedPriceOverride>>({});
	const [selectedOverridePrice, setSelectedOverridePrice] = useState<Price | null>(null);
	const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);

	// Fetch available addons - include all addons even if they have no charges
	const { data: addons = [] } = useQuery({
		queryKey: ['addons'],
		queryFn: async () => {
			const response = await AddonApi.List({ limit: 1000, offset: 0 });
			// Return all addons, including those without prices/charges
			return response.items;
		},
	});

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			if (data) {
				setFormData({
					...data,
					metadata: data.metadata || {},
					line_item_commitments: data.line_item_commitments || {},
				});
				// Find addon details for editing
				const addonDetails = addons.find((addon) => addon.id === data.addon_id) ?? null;
				setSelectedAddonDetails(addonDetails);
				setOverriddenPrices(overrideLineItemsToMap(data.override_line_items));
			} else {
				setFormData({
					...getEmptyAddon(),
					metadata: {},
					line_item_commitments: {},
				});
				setSelectedAddonDetails(null);
				setOverriddenPrices({});
			}
			setSelectedOverridePrice(null);
			setIsOverrideDialogOpen(false);
			setErrors({});
		}
	}, [isOpen, data, getEmptyAddon, addons]);

	const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
		const newErrors: FormErrors = {};

		if (!formData.addon_id) {
			newErrors.addon_id = t('subscriptionAddon.addonRequired');
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [formData, t]);

	const selectedAddonPrices = useMemo(
		() => filterAddonPricesForSubscription((selectedAddonDetails?.prices as Price[]) || [], billingPeriod, currency, billingPeriodCount),
		[selectedAddonDetails, billingPeriod, currency, billingPeriodCount],
	);

	const handleSave = useCallback(() => {
		const validation = validateForm();

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		setErrors({});

		const commitments = (formData.line_item_commitments || {}) as LineItemCommitmentsMap;
		const hasCommitments = Object.keys(commitments).length > 0;
		const override_line_items = sanitizeAddonOverrideLineItemsForApi(
			getLineItemOverrides(selectedAddonPrices, overriddenPrices),
			selectedAddonPrices,
		);
		const addonData: AddAddonToSubscriptionRequest = {
			addon_id: formData.addon_id!,
			start_date: formData.start_date,
			metadata: formData.metadata || {},
			line_item_commitments: hasCommitments ? commitments : undefined,
			override_line_items,
		};

		onSave(addonData);
		setFormData(getEmptyAddon());
		setSelectedAddonDetails(null);
		setOverriddenPrices({});
		onOpenChange(false);
	}, [formData, validateForm, onSave, getEmptyAddon, onOpenChange, selectedAddonPrices, overriddenPrices]);

	const handleCancel = useCallback(() => {
		setFormData({});
		setErrors({});
		setSelectedAddonDetails(null);
		onCancel();
	}, [onCancel]);

	const handleAddonSelect = useCallback(
		(addonId: string) => {
			const addonDetails = addons.find((addon) => addon.id === addonId) ?? null;
			setSelectedAddonDetails(addonDetails);
			// Reset overrides when switching addons to avoid leaking price IDs across addons
			setOverriddenPrices({});
			setFormData((prev) => ({
				...prev,
				addon_id: addonId,
				// Reset commitments when switching addons to avoid leaking price IDs across addons
				line_item_commitments: {},
			}));
			// Clear error for this field when user selects
			if (errors.addon_id) {
				setErrors((prev) => ({ ...prev, addon_id: undefined }));
			}
		},
		[addons, errors.addon_id],
	);

	const commitmentMap = useMemo(() => {
		return ((formData.line_item_commitments || {}) as LineItemCommitmentsMap) || {};
	}, [formData.line_item_commitments]);

	const handleConfigureCommitment = useCallback((price: Price) => {
		if (price.type !== PRICE_TYPE.USAGE) return;
		setSelectedCommitmentPrice(price);
		setIsCommitmentDialogOpen(true);
	}, []);

	const handleConfigurePrice = useCallback((price: Price) => {
		setSelectedOverridePrice(price);
		setIsOverrideDialogOpen(true);
	}, []);

	const handlePriceOverride = useCallback((priceId: string, override: Partial<ExtendedPriceOverride>) => {
		setOverriddenPrices((prev) => updatePriceOverride(priceId, prev, override));
	}, []);

	const handleResetOverride = useCallback((priceId: string) => {
		setOverriddenPrices((prev) => removePriceOverride(priceId, prev));
	}, []);

	const setCommitmentForPrice = useCallback((priceId: string, config: LineItemCommitmentConfig | null) => {
		setFormData((prev) => {
			const nextCommitments: LineItemCommitmentsMap = { ...(((prev.line_item_commitments || {}) as LineItemCommitmentsMap) || {}) };
			if (!config) {
				delete nextCommitments[priceId];
			} else {
				nextCommitments[priceId] = config;
			}
			return {
				...prev,
				line_item_commitments: nextCommitments,
			};
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
				title: t('subscriptionAddon.columnCharge'),
				render: (row) => <span>{row.price.display_name || row.price.meter?.name || t('subscriptionAddon.chargeFallbackLabel')}</span>,
			},
			{
				title: t('subscriptionAddon.columnType'),
				render: (row) => <span>{toSentenceCase(row.price.type || t('labels.na'))}</span>,
			},
			{
				title: t('subscriptionAddon.columnQuantity'),
				render: (row) => (
					<PriceQuantityCell
						price={row.price}
						override={overriddenPrices[row.price.id]}
						usageLabel={t('subscriptionAddon.quantityUsage')}
						ariaLabel={t('subscriptionAddon.columnQuantity')}
						onPriceOverride={handlePriceOverride}
						onResetOverride={handleResetOverride}
					/>
				),
			},
			{
				title: t('subscriptionAddon.columnPrice'),
				render: (row) => <ChargeValueCell data={row.price} priceOverride={overriddenPrices[row.price.id]} />,
			},
			{
				title: t('subscriptionAddon.columnCommitment'),
				render: (row) => {
					if (row.price.type !== PRICE_TYPE.USAGE) {
						return <span className='text-sm text-content-subtle'>{t('subscriptionAddon.notAvailable')}</span>;
					}
					const config = commitmentMap[row.price.id];
					return config ? <span className='text-sm text-content-tertiary'>{formatCommitmentSummary(config)}</span> : <span>—</span>;
				},
			},
			{
				fieldVariant: 'interactive',
				hideOnEmpty: true,
				title: '',
				width: 60,
				align: 'right',
				render: (row) => {
					const isOverridden = overriddenPrices[row.price.id] !== undefined;
					const hasCommitment = commitmentMap[row.price.id] !== undefined;
					const canConfigureCommitment = row.price.type === PRICE_TYPE.USAGE;
					return (
						<UiDropdownMenu>
							<DropdownMenuTrigger asChild>
								<button type='button' aria-label={t('subscriptionAddon.configure')}>
									<BsThreeDots className='text-base size-4' />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-48'>
								<DropdownMenuItem onClick={() => handleConfigurePrice(row.price)}>
									<Pencil className='me-2 h-4 w-4' />
									{isOverridden
										? t('customers:organisms.subscriptionPriceTable.editOverride')
										: t('customers:organisms.subscriptionPriceTable.overridePrice')}
								</DropdownMenuItem>
								{isOverridden && (
									<DropdownMenuItem onClick={() => handleResetOverride(row.price.id)}>
										<RotateCcw className='me-2 h-4 w-4' />
										{t('customers:organisms.subscriptionPriceTable.resetOverride')}
									</DropdownMenuItem>
								)}
								{canConfigureCommitment && (
									<DropdownMenuItem onClick={() => handleConfigureCommitment(row.price)}>
										<Target className='me-2 h-4 w-4' />
										{hasCommitment
											? t('customers:organisms.subscriptionPriceTable.editCommitment')
											: t('customers:organisms.subscriptionPriceTable.configureCommitment')}
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</UiDropdownMenu>
					);
				},
			},
		],
		[commitmentMap, handleConfigureCommitment, handleConfigurePrice, handlePriceOverride, handleResetOverride, overriddenPrices, t],
	);

	// const handleDateChange = useCallback(
	// 	(field: 'start_date' | 'end_date', date: Date | undefined) => {
	// 		setFormData((prev) => ({ ...prev, [field]: date?.toISOString() }));
	// 		// Clear error for end_date when user changes dates
	// 		if (field === 'end_date' && errors.end_date) {
	// 			setErrors((prev) => ({ ...prev, end_date: undefined }));
	// 		}
	// 	},
	// 	[errors.end_date],
	// );

	const filteredAddonOptions = useMemo(() => {
		return addons.map((addon) => ({
			label: addon.name,
			value: addon.id,
			description: addon.description || t('subscriptionAddon.noDescription'),
		}));
	}, [addons, t]);

	return (
		<Dialog
			isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={data ? t('subscriptionAddon.editAddonTitle') : t('subscriptionAddon.addAddonTitle')}
			className='sm:max-w-[900px]'>
			<div className='grid gap-4 mt-3'>
				<div className='space-y-2'>
					<Select
						label={t('subscriptionAddon.labelAddon')}
						placeholder={t('subscriptionAddon.placeholderSelectAddon')}
						options={filteredAddonOptions}
						value={formData.addon_id || ''}
						onChange={handleAddonSelect}
						error={errors.addon_id}
					/>
				</div>

				{/* Addon Charges & Commitments */}
				{formData.addon_id && (
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-content-secondary'>{t('subscriptionAddon.addonChargesHeading')}</p>
								<p className='text-xs text-content-muted'>
									{t('subscriptionAddon.filteredByPeriodAndCurrency', {
										period: billingPeriod ? toSentenceCase(billingPeriod.replace('_', ' ')) : t('subscriptionAddon.billingPeriodFallback'),
										currency: currency ? currency.toUpperCase() : t('subscriptionAddon.currencyFallback'),
									})}
								</p>
							</div>
						</div>
						{selectedAddonPrices.length > 0 ? (
							<div className='rounded-xl border border-line'>
								<FlexpriceTable columns={addonChargeColumns} data={selectedAddonPrices.map((p) => ({ price: p }))} />
							</div>
						) : (
							<div className='rounded-xl border border-line p-4'>
								<p className='text-sm text-content-tertiary'>{t('subscriptionAddon.noChargesForPeriod')}</p>
							</div>
						)}
						<p className='text-xs text-content-muted'>{t('subscriptionAddon.commitmentUsageOnlyHint')}</p>
					</div>
				)}

				{/* Start date. The backend accepts no end date on an addon attach — an addon ends via
				    onetime cadence (period end) or a later cancellation with an effective date. */}
				{formData.addon_id && (
					<div className='grid grid-cols-2 gap-4'>
						<DatePicker
							label={t('subscriptionAddon.labelStartDate')}
							placeholder={t('subscriptionAddon.placeholderStartDate')}
							date={formData.start_date ? new Date(formData.start_date) : undefined}
							setDate={(date) => setFormData((prev) => ({ ...prev, start_date: date?.toISOString() }))}
						/>
					</div>
				)}
			</div>

			{/* Price Override Dialog */}
			{selectedOverridePrice && (
				<PriceOverrideDialog
					isOpen={isOverrideDialogOpen}
					onOpenChange={setIsOverrideDialogOpen}
					price={selectedOverridePrice}
					onPriceOverride={handlePriceOverride}
					onResetOverride={handleResetOverride}
					overriddenPrices={overriddenPrices}
				/>
			)}

			{/* Commitment Configuration Dialog */}
			{selectedCommitmentPrice && (
				<CommitmentConfigDialog
					isOpen={isCommitmentDialogOpen}
					onOpenChange={setIsCommitmentDialogOpen}
					price={selectedCommitmentPrice}
					onSave={handleCommitmentSave}
					currentConfig={commitmentMap[selectedCommitmentPrice.id]}
					currentTimeBuckets={commitmentMap[selectedCommitmentPrice.id]?.commitment_time_buckets}
					billingPeriod={billingPeriod}
				/>
			)}

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={handleCancel}>
					{t('actions.cancel')}
				</Button>
				<Button onClick={handleSave}>{data ? t('subscriptionAddon.saveChanges') : t('subscriptionAddon.submitAddAddon')}</Button>
			</div>
		</Dialog>
	);
};

export default SubscriptionAddonModal;
