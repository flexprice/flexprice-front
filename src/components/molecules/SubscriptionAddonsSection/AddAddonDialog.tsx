import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Select } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import AddonApi from '@/api/AddonApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { BILLING_PERIOD } from '@/constants/constants';
import { Price } from '@/models/Price';
import { AddonResponse } from '@/types/dto/Addon';
import { AddonAssociationResponse, ExecuteSubscriptionModifyRequest, SubscriptionResponse } from '@/types/dto/Subscription';
import { filterAddonPricesForSubscription } from '@/utils/subscription/addon_commitment_helpers';
import {
	AddonRemovalDraft,
	buildAddonBulkModifyRequest,
	createAddonRemovalDraft,
	isAddonRemovalMissingCustomDate,
	MAX_ADDON_BULK_ENTRIES,
} from '@/utils/subscription/buildAddonBulkModifyRequest';
import { useAddonDraftList } from '@/hooks/useAddonDraftList';
import AddonDraftCard from './AddonDraftCard';
import ExistingAddonRow from './ExistingAddonRow';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	/** `modify` when the subscription already has addons: lists them so they can be removed in the same change. */
	mode?: 'add' | 'modify';
	/** Addons currently on the subscription (modify mode). */
	existingAddons?: AddonAssociationResponse[];
	/** Charges each existing addon holds on this subscription, keyed by addon association id. */
	chargesCountByAssociationId?: Record<string, number>;
	billingPeriod?: BILLING_PERIOD;
	/**
	 * Subscription's billing_period_count paired with billingPeriod for the cadence-compat filter.
	 * Defaults to 1 when the caller has not resolved the subscription context yet; a follow-up
	 * fetch below can supply the real value.
	 */
	billingPeriodCount?: number;
	currency?: string;
	/** When provided, skips GET subscription for defaults (subscription edit passes from core fetch). */
	currentPeriodEndIso?: string;
	currentPeriodStartIso?: string;
}

/**
 * Stage addons to attach and existing addons to remove, then apply them in a single
 * POST /subscriptions/:id/modify/execute (type `addon`, `addon_bulk_params.adds` / `.removes`),
 * so the whole set settles as one netted change.
 */
const AddAddonDialog: React.FC<Props> = ({
	isOpen,
	onOpenChange,
	subscriptionId,
	mode = 'add',
	existingAddons = [],
	chargesCountByAssociationId = {},
	billingPeriod,
	billingPeriodCount,
	currency,
	currentPeriodEndIso,
	currentPeriodStartIso,
}) => {
	const { t } = useTranslation(['billing', 'common']);
	const {
		drafts,
		openKeys,
		invalidKeys,
		reset: resetDrafts,
		stage,
		update: updateDraft,
		remove: removeDraft,
		setOpen: setDraftOpen,
		validate,
	} = useAddonDraftList();
	const [pickerError, setPickerError] = useState<string>();
	const [removals, setRemovals] = useState<Record<string, AddonRemovalDraft>>({});
	const [openRemovalIds, setOpenRemovalIds] = useState<Set<string>>(new Set());
	const [invalidRemovalIds, setInvalidRemovalIds] = useState<Set<string>>(new Set());

	const shouldFetchSubscription = !!subscriptionId && isOpen && !currentPeriodEndIso;

	const { data: subscriptionDetails } = useQuery({
		queryKey: ['subscriptionDetailsForAddAddonDialog', subscriptionId],
		queryFn: async () => {
			return await SubscriptionApi.getSubscription(subscriptionId);
		},
		enabled: shouldFetchSubscription,
	});

	const resolvedPeriodEndRaw = currentPeriodEndIso ?? (subscriptionDetails as SubscriptionResponse | undefined)?.current_period_end;
	// Prefer the count from props (caller-supplied); fall back to the fetched subscription;
	// default to 1 when neither is available (matches backend EffectiveMonths behavior).
	const resolvedBillingPeriodCount =
		billingPeriodCount ?? (subscriptionDetails as SubscriptionResponse | undefined)?.billing_period_count ?? 1;

	const { data: addonsResponse } = useQuery({
		queryKey: ['subaddons', subscriptionId],
		queryFn: async () => {
			return await AddonApi.List({ limit: 1000, offset: 0 });
		},
	});

	const addonsById = useMemo(
		() => new Map((addonsResponse?.items ?? []).map((addon: AddonResponse) => [addon.id, addon])),
		[addonsResponse?.items],
	);

	// Prices each staged addon will actually attach: same currency and a compatible cadence.
	const pricesByAddonId = useMemo(() => {
		const result: Record<string, Price[]> = {};
		for (const draft of drafts) {
			result[draft.addonId] = filterAddonPricesForSubscription(
				(addonsById.get(draft.addonId)?.prices as Price[]) || [],
				billingPeriod,
				currency,
				resolvedBillingPeriodCount,
			);
		}
		return result;
	}, [drafts, addonsById, billingPeriod, currency, resolvedBillingPeriodCount]);

	const resolvedPeriodStartRaw = currentPeriodStartIso ?? (subscriptionDetails as SubscriptionResponse | undefined)?.current_period_start;

	const currentPeriodEndDate = useMemo(() => parseDate(resolvedPeriodEndRaw), [resolvedPeriodEndRaw]);
	const currentPeriodStartDate = useMemo(() => parseDate(resolvedPeriodStartRaw), [resolvedPeriodStartRaw]);

	useEffect(() => {
		if (isOpen) {
			resetDrafts();
			setPickerError(undefined);
			setRemovals({});
			setOpenRemovalIds(new Set());
			setInvalidRemovalIds(new Set());
		}
	}, [isOpen, resetDrafts]);

	const removalList = useMemo(() => Object.values(removals), [removals]);
	const changeCount = drafts.length + removalList.length;

	const { mutateAsync: executeModify, isPending } = useMutation({
		mutationFn: async (payload: ExecuteSubscriptionModifyRequest) => {
			return await SubscriptionApi.executeSubscriptionModify(subscriptionId, payload);
		},
		onSuccess: () => {
			toast.success(
				removalList.length > 0
					? t('billing:subscriptions.addAddonDialog.toast.addonsUpdatedSuccess')
					: t('billing:subscriptions.addAddonDialog.toast.addonsAddedSuccess', { count: drafts.length }),
			);
			refetchQueries(['subscriptionActiveAddons', subscriptionId]);
			refetchQueries(['subscriptionAddonLineItems', subscriptionId]);
			refetchQueries(['subscriptionDetails', subscriptionId]);
			refetchQueries(['subscriptionEdit', subscriptionId]);
			refetchQueries(['subscriptionEntitlements', subscriptionId]);
		},
		onError: (error: Error) => {
			toast.error(
				error.message ||
					(removalList.length > 0
						? t('billing:subscriptions.addAddonDialog.toast.addonsUpdateFailed')
						: t('billing:subscriptions.addAddonDialog.toast.addonAddFailed')),
			);
		},
	});

	const stageAddon = useCallback(
		(addonId: string) => {
			stage(addonId);
			setPickerError(undefined);
		},
		[stage],
	);

	const markForRemoval = useCallback((associationId: string) => {
		setRemovals((prev) => ({ ...prev, [associationId]: createAddonRemovalDraft(associationId) }));
		setOpenRemovalIds((prev) => new Set([...prev, associationId]));
	}, []);

	const undoRemoval = useCallback((associationId: string) => {
		setRemovals((prev) => {
			const next = { ...prev };
			delete next[associationId];
			return next;
		});
		setInvalidRemovalIds((prev) => withoutKey(prev, associationId));
	}, []);

	const updateRemoval = useCallback((associationId: string, patch: Partial<AddonRemovalDraft>) => {
		setRemovals((prev) => (prev[associationId] ? { ...prev, [associationId]: { ...prev[associationId], ...patch } } : prev));
		setInvalidRemovalIds((prev) => withoutKey(prev, associationId));
	}, []);

	const setRemovalOpen = useCallback((associationId: string, open: boolean) => {
		setOpenRemovalIds((prev) => (open ? new Set([...prev, associationId]) : withoutKey(prev, associationId)));
	}, []);

	const handleSave = useCallback(async () => {
		if (isPending) return;

		if (changeCount === 0) {
			setPickerError(t('billing:subscriptions.addAddonDialog.validation.addonRequired'));
			return;
		}

		const draftsValid = validate();
		const invalidRemovals = new Set(removalList.filter(isAddonRemovalMissingCustomDate).map((r) => r.addonAssociationId));
		setInvalidRemovalIds(invalidRemovals);
		if (invalidRemovals.size > 0) setOpenRemovalIds((prev) => new Set([...prev, ...invalidRemovals]));
		if (!draftsValid || invalidRemovals.size > 0) return;

		try {
			await executeModify(buildAddonBulkModifyRequest(drafts, pricesByAddonId, removalList));
			onOpenChange(false);
		} catch {
			// Keep dialog open so the user can fix and retry.
		}
	}, [changeCount, drafts, executeModify, isPending, onOpenChange, pricesByAddonId, removalList, t, validate]);

	const handleDialogOpenChange = useCallback(
		(open: boolean) => {
			if (!open && isPending) return;
			onOpenChange(open);
		},
		[onOpenChange, isPending],
	);

	// An addon can be staged once per change; it drops out of the picker after it's picked.
	const addonOptions = useMemo(() => {
		const staged = new Set(drafts.map((draft) => draft.addonId));
		return (addonsResponse?.items || [])
			.filter((addon: AddonResponse) => !staged.has(addon.id))
			.map((addon: AddonResponse) => ({
				label: addon.name,
				value: addon.id,
				description: addon.description || t('billing:subscriptions.addAddonDialog.noDescription'),
			}));
	}, [addonsResponse, drafts, t]);

	const isAtLimit = changeCount >= MAX_ADDON_BULK_ENTRIES;

	return (
		<Dialog
			isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={handleDialogOpenChange}
			title={mode === 'modify' ? t('billing:subscriptions.addAddonDialog.titleModify') : t('billing:subscriptions.addAddonDialog.titleAdd')}
			className='sm:max-w-[900px]'>
			<div className='grid gap-4 mt-3'>
				{mode === 'modify' && existingAddons.length > 0 && (
					<div className='space-y-2'>
						<p className='text-sm font-medium text-content-secondary'>{t('billing:subscriptions.addAddonDialog.currentAddons')}</p>
						{existingAddons.map((association) => (
							<ExistingAddonRow
								key={association.id}
								association={association}
								chargesCount={chargesCountByAssociationId[association.id] ?? 0}
								removal={removals[association.id]}
								isOpen={openRemovalIds.has(association.id)}
								onOpenChange={(open) => setRemovalOpen(association.id, open)}
								onMarkForRemoval={() => markForRemoval(association.id)}
								onUndoRemoval={() => undoRemoval(association.id)}
								onChange={(patch) => updateRemoval(association.id, patch)}
								currentPeriodStart={currentPeriodStartDate}
								currentPeriodEnd={currentPeriodEndDate}
								endDateError={
									invalidRemovalIds.has(association.id) ? t('billing:subscriptions.addAddonDialog.endAt.dateRequired') : undefined
								}
								disableRemove={isAtLimit}
								disabled={isPending}
							/>
						))}
					</div>
				)}

				<div className='space-y-2'>
					<Select
						label={
							drafts.length > 0
								? t('billing:subscriptions.addAddonDialog.addAnotherAddon')
								: mode === 'modify'
									? t('billing:subscriptions.addAddonDialog.addAddon')
									: t('billing:subscriptions.addon')
						}
						placeholder={t('billing:subscriptions.selectAddon')}
						options={addonOptions}
						// Always reset: picking an option stages it rather than holding a selection.
						value=''
						onChange={stageAddon}
						error={pickerError}
						disabled={isAtLimit || isPending}
					/>
					{isAtLimit && (
						<p className='text-xs text-content-muted'>
							{t('billing:subscriptions.addAddonDialog.maxAddonsReached', { max: MAX_ADDON_BULK_ENTRIES })}
						</p>
					)}
				</div>

				{drafts.length > 0 && (
					<div className='space-y-3'>
						{drafts.map((draft) => (
							<AddonDraftCard
								key={draft.key}
								draft={draft}
								addon={addonsById.get(draft.addonId)}
								prices={pricesByAddonId[draft.addonId] ?? []}
								isOpen={openKeys.has(draft.key)}
								onOpenChange={(open) => setDraftOpen(draft.key, open)}
								onChange={(patch) => updateDraft(draft.key, patch)}
								onRemove={() => removeDraft(draft.key)}
								billingPeriod={billingPeriod}
								currentPeriodEnd={currentPeriodEndDate}
								startDateError={invalidKeys.has(draft.key) ? t('billing:subscriptions.addAddonDialog.changeAt.dateRequired') : undefined}
								disabled={isPending}
							/>
						))}
					</div>
				)}
			</div>

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={() => handleDialogOpenChange(false)} disabled={isPending}>
					{t('common:actions.cancel')}
				</Button>
				<Button onClick={handleSave} isLoading={isPending} disabled={isPending || changeCount === 0}>
					{mode === 'modify' ? t('common:actions.save') : t('common:actions.add')}
				</Button>
			</div>
		</Dialog>
	);
};

const parseDate = (raw?: string): Date | undefined => {
	if (!raw) return undefined;
	const parsed = new Date(raw);
	return isNaN(parsed.getTime()) ? undefined : parsed;
};

const withoutKey = (set: Set<string>, key: string): Set<string> => {
	if (!set.has(key)) return set;
	const next = new Set(set);
	next.delete(key);
	return next;
};

export default AddAddonDialog;
