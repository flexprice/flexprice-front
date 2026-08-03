import { AddAddonToSubscriptionRequest } from '@/types/dto/Addon';
import React, { useCallback, useMemo, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { AddButton, FormHeader, ActionButton } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import SubscriptionAddonModal from './SubscriptionAddonModal';
import { useQuery } from '@tanstack/react-query';
import AddonApi from '@/api/AddonApi';
import { getTotalPayableTextWithCoupons } from '@/utils/common/helper_functions';
import { Price, PRICE_TYPE } from '@/models/Price';
import { BILLING_PERIOD } from '@/constants/constants';
import { getCurrentPriceAmount, ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import { Coupon } from '@/models/Coupon';
import { filterAddonPricesForSubscription } from '@/utils/subscription/addon_commitment_helpers';

interface Props {
	data: AddAddonToSubscriptionRequest[];
	onChange: (data: AddAddonToSubscriptionRequest[]) => void;
	disabled?: boolean;
	getEmptyAddon: () => Partial<AddAddonToSubscriptionRequest>;
	priceOverrides?: Record<string, ExtendedPriceOverride>;
	coupons?: Coupon[];
	billingPeriod?: BILLING_PERIOD;
	currency?: string;
}
const formatAddonCharges = (
	prices: Price[] = [],
	priceOverrides: Record<string, ExtendedPriceOverride> = {},
	coupons: Coupon[] = [],
	t: TFunction<'common'>,
): string => {
	if (!prices || prices.length === 0) return t('labels.na');

	const recurringPrices = prices.filter((p) => p.type === PRICE_TYPE.FIXED);
	const usagePrices = prices.filter((p) => p.type === PRICE_TYPE.USAGE);

	const hasUsage = usagePrices.length > 0;

	if (recurringPrices.length === 0) {
		return hasUsage ? t('subscriptionAddon.dependsOnUsage') : t('labels.na');
	}

	// Calculate total recurring amount
	const recurringTotal = recurringPrices.reduce((acc, charge) => {
		const currentAmount = getCurrentPriceAmount(charge, priceOverrides);
		return acc + parseFloat(currentAmount);
	}, 0);

	// Use the same helper as Preview component for consistent display
	return getTotalPayableTextWithCoupons(recurringPrices, usagePrices, recurringTotal, coupons);
};

interface ExtendedAddon extends AddAddonToSubscriptionRequest {
	internal_id: number;
}

const SubscriptionAddonTable: React.FC<Props> = ({
	data,
	onChange,
	disabled,
	getEmptyAddon,
	priceOverrides = {},
	coupons = [],
	billingPeriod,
	currency,
}) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);
	const [selectedAddon, setSelectedAddon] = useState<ExtendedAddon | null>(null);
	const extendedData = useMemo(() => {
		return data.map((addon, index) => ({
			...addon,
			internal_id: index,
		}));
	}, [data]);

	const { data: addons = [] } = useQuery({
		queryKey: ['addons'],
		queryFn: async () => {
			const response = await AddonApi.List({ limit: 1000, offset: 0 });
			return response.items;
		},
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const addonsById = useMemo(() => {
		return addons.reduce<Record<string, (typeof addons)[number]>>((acc, addon) => {
			acc[addon.id] = addon;
			return acc;
		}, {});
	}, [addons]);

	const getAddonDetails = useCallback((addonId: string) => addonsById[addonId], [addonsById]);

	const handleSave = useCallback(
		(newAddon: AddAddonToSubscriptionRequest) => {
			if (selectedAddon) {
				// Update specific instance using internal_id
				const updatedData = extendedData.map((addon) =>
					addon.internal_id === selectedAddon.internal_id ? { ...newAddon, internal_id: addon.internal_id } : addon,
				);
				// Strip internal_id before passing to parent
				onChange(updatedData.map(({ internal_id, ...rest }) => rest));
			} else {
				// Add new instance with next available internal_id
				const nextId = extendedData.length > 0 ? Math.max(...extendedData.map((a) => a.internal_id)) + 1 : 0;
				const newData = [...extendedData, { ...newAddon, internal_id: nextId }];
				// Strip internal_id before passing to parent
				onChange(newData.map(({ internal_id, ...rest }) => rest));
			}
			setSelectedAddon(null);
		},
		[extendedData, onChange, selectedAddon],
	);

	const handleDelete = useCallback(
		async (internalId: number) => {
			const filteredData = extendedData.filter((addon) => addon.internal_id !== internalId);
			// Strip internal_id before passing to parent
			onChange(filteredData.map(({ internal_id, ...rest }) => rest));
		},
		[extendedData, onChange],
	);

	const handleEdit = useCallback((addon: ExtendedAddon) => {
		setSelectedAddon(addon);
		setIsOpen(true);
	}, []);

	const handleOpenCreate = useCallback(() => {
		setSelectedAddon(null);
		setIsOpen(true);
	}, []);

	const columns: ColumnData<ExtendedAddon>[] = useMemo(
		() => [
			{
				title: t('subscriptionAddon.columnName'),
				render: (row) => {
					const addonDetails = getAddonDetails(row.addon_id);
					return addonDetails?.name || row.addon_id;
				},
			},
			{
				title: t('subscriptionAddon.columnCharges'),
				render: (row) => {
					const addonDetails = getAddonDetails(row.addon_id);
					const prices = filterAddonPricesForSubscription(addonDetails?.prices || [], billingPeriod, currency);
					return <span>{formatAddonCharges(prices, priceOverrides, coupons, t)}</span>;
				},
			},
			// {
			// 	title: 'Start Date',
			// 	render: (row) => (row.start_date ? new Date(row.start_date).toLocaleDateString() : '--'),
			// },
			// {
			// 	title: 'End Date',
			// 	render: (row) => (row.end_date ? new Date(row.end_date).toLocaleDateString() : '--'),
			// },
			{
				fieldVariant: 'interactive',
				hideOnEmpty: true,
				render: (row) => {
					const addonDetails = getAddonDetails(row.addon_id);
					return (
						<ActionButton
							id={row.addon_id}
							copyId={{ entityType: 'Addon' }}
							deleteMutationFn={() => handleDelete(row.internal_id)}
							refetchQueryKey='addons'
							entityName={addonDetails?.name || row.addon_id}
							edit={{
								enabled: !disabled,
								onClick: () => handleEdit(row),
							}}
							archive={{
								enabled: !disabled,
								text: t('subscriptionAddon.remove'),
							}}
						/>
					);
				},
			},
		],
		[disabled, getAddonDetails, handleDelete, handleEdit, priceOverrides, coupons, billingPeriod, currency, t],
	);

	return (
		<>
			<SubscriptionAddonModal
				getEmptyAddon={getEmptyAddon}
				data={selectedAddon || undefined}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				onSave={handleSave}
				onCancel={() => {
					setIsOpen(false);
					setSelectedAddon(null);
				}}
				billingPeriod={billingPeriod}
				currency={currency}
			/>
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<FormHeader className='mb-0' title={t('labels.addons')} variant='sub-header' />
					<AddButton onClick={handleOpenCreate} disabled={disabled} />
				</div>
				<div className='rounded-[6px] border border-line-strong'>
					<FlexpriceTable data={extendedData} columns={columns} showEmptyRow />
				</div>
			</div>
		</>
	);
};

export default memo(SubscriptionAddonTable);
