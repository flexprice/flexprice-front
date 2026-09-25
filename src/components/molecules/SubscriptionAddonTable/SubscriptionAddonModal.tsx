import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button, Select } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import AddonApi from '@/api/AddonApi';
import AddonDraftCard from '@/components/molecules/SubscriptionAddonsSection/AddonDraftCard';
import { BILLING_PERIOD } from '@/constants/constants';
import { useAddonDraftList } from '@/hooks/useAddonDraftList';
import { Price } from '@/models/Price';
import { AddAddonToSubscriptionRequest } from '@/types/dto/Addon';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { filterAddonPricesForSubscription } from '@/utils/subscription/addon_commitment_helpers';
import { addonDraftFromCreateRequest, addonDraftToCreateRequest } from '@/utils/subscription/addonDraftCreateRequest';

interface Props {
	/** The staged addon being edited; omit to stage new ones. */
	data?: AddAddonToSubscriptionRequest;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	/** Every addon staged in this session; exactly one when editing. */
	onSave: (addons: AddAddonToSubscriptionRequest[]) => void;
	onCancel: () => void;
	billingPeriod?: BILLING_PERIOD;
	/** Subscription's billing_period_count paired with billingPeriod for the cadence-compat filter. Defaults to 1. */
	billingPeriodCount?: number;
	currency?: string;
}

/**
 * Stage addons on a subscription being created. Several can be picked in one go — each becomes a
 * collapsible card with its charges, overrides, commitments and optional start date. Editing an
 * already-staged row reuses the same card for just that addon.
 */
const SubscriptionAddonModal: React.FC<Props> = ({
	data,
	isOpen,
	onOpenChange,
	onSave,
	onCancel,
	billingPeriod,
	billingPeriodCount = 1,
	currency,
}) => {
	const { t } = useTranslation(['common', 'billing']);
	const { drafts, openKeys, nextKey, reset, stage, update, remove, setOpen } = useAddonDraftList();
	const [pickerError, setPickerError] = useState<string>();
	const isEditing = !!data;

	const { data: addons = [] } = useQuery({
		queryKey: ['addons'],
		queryFn: async () => {
			const response = await AddonApi.List({ limit: 1000, offset: 0 });
			// Return all addons, including those without prices/charges
			return response.items;
		},
	});

	const addonsById = useMemo(() => new Map(addons.map((addon) => [addon.id, addon])), [addons]);

	useEffect(() => {
		if (isOpen) {
			reset(data ? [addonDraftFromCreateRequest(data, nextKey())] : []);
			setPickerError(undefined);
		}
	}, [isOpen, data, reset, nextKey]);

	const pricesByAddonId = useMemo(() => {
		const result: Record<string, Price[]> = {};
		for (const draft of drafts) {
			result[draft.addonId] = filterAddonPricesForSubscription(
				(addonsById.get(draft.addonId)?.prices as Price[]) || [],
				billingPeriod,
				currency,
				billingPeriodCount,
			);
		}
		return result;
	}, [drafts, addonsById, billingPeriod, currency, billingPeriodCount]);

	const handleSave = useCallback(() => {
		if (drafts.length === 0) {
			setPickerError(t('subscriptionAddon.addonRequired'));
			return;
		}
		onSave(drafts.map((draft) => addonDraftToCreateRequest(draft, pricesByAddonId[draft.addonId] ?? [], data)));
		onOpenChange(false);
	}, [data, drafts, onOpenChange, onSave, pricesByAddonId, t]);

	const stageAddon = useCallback(
		(addonId: string) => {
			stage(addonId);
			setPickerError(undefined);
		},
		[stage],
	);

	// An addon can be staged once per session; it drops out of the picker after it's picked.
	const addonOptions = useMemo(() => {
		const staged = new Set(drafts.map((draft) => draft.addonId));
		return addons
			.filter((addon) => !staged.has(addon.id))
			.map((addon) => ({
				label: addon.name,
				value: addon.id,
				description: addon.description || t('subscriptionAddon.noDescription'),
			}));
	}, [addons, drafts, t]);

	return (
		<Dialog
			isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={isEditing ? t('subscriptionAddon.editAddonTitle') : t('subscriptionAddon.addAddonTitle')}
			className='sm:max-w-[900px]'>
			<div className='grid gap-4 mt-3'>
				{!isEditing && (
					<Select
						label={drafts.length > 0 ? t('billing:subscriptions.addAddonDialog.addAnotherAddon') : t('subscriptionAddon.labelAddon')}
						placeholder={t('subscriptionAddon.placeholderSelectAddon')}
						options={addonOptions}
						// Always reset: picking an option stages it rather than holding a selection.
						value=''
						onChange={stageAddon}
						error={pickerError}
					/>
				)}

				{drafts.length > 0 && (
					<div className='space-y-3'>
						<p className='text-xs text-content-muted'>
							{t('subscriptionAddon.filteredByPeriodAndCurrency', {
								period: billingPeriod ? toSentenceCase(billingPeriod.replace('_', ' ')) : t('subscriptionAddon.billingPeriodFallback'),
								currency: currency ? currency.toUpperCase() : t('subscriptionAddon.currencyFallback'),
							})}
						</p>
						{drafts.map((draft) => (
							<AddonDraftCard
								key={draft.key}
								variant='create'
								removable={!isEditing}
								draft={draft}
								addon={addonsById.get(draft.addonId)}
								prices={pricesByAddonId[draft.addonId] ?? []}
								isOpen={openKeys.has(draft.key)}
								onOpenChange={(open) => setOpen(draft.key, open)}
								onChange={(patch) => update(draft.key, patch)}
								onRemove={() => remove(draft.key)}
								billingPeriod={billingPeriod}
							/>
						))}
						<p className='text-xs text-content-muted'>{t('subscriptionAddon.commitmentUsageOnlyHint')}</p>
					</div>
				)}
			</div>

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={onCancel}>
					{t('actions.cancel')}
				</Button>
				<Button onClick={handleSave} disabled={drafts.length === 0}>
					{isEditing ? t('subscriptionAddon.saveChanges') : t('subscriptionAddon.submitAddAddon')}
				</Button>
			</div>
		</Dialog>
	);
};

export default SubscriptionAddonModal;
