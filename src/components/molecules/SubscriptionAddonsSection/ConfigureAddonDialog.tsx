import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import Dialog from '@/components/atoms/Dialog';
import { Button } from '@/components/atoms';
import SubscriptionApi from '@/api/SubscriptionApi';
import { AddonAssociationResponse, UpdateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import { LineItem, SUBSCRIPTION_LINE_ITEM_EDIT_MODE } from '@/models/Subscription';
import { EXPAND } from '@/models';
import SubscriptionLineItemTable from '@/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable';
import { SubscriptionLineItemQuantityModifyDialog } from '@/components/molecules';
import PriceOverrideDialog from '@/components/molecules/PriceOverrideDialog/PriceOverrideDialog';
import { getPriceTypeFromLineItem, lineItemToPrice } from '@/utils/subscription/lineItemToPrice';
import { subscriptionLineItemListItemToLineItem } from '@/utils/subscription/subscriptionLineItemListItemToLineItem';
import { PRICE_TYPE } from '@/models/Price';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import { refetchQueries } from '@/core/services/tanstack/queryClient';
import toast from 'react-hot-toast';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	association: AddonAssociationResponse | null;
	currentPeriodStart?: string;
	currentPeriodEnd?: string;
	readOnly?: boolean;
}

type EditingLineItemState =
	| { mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE; lineItem: LineItem }
	| { mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.FIXED_QUANTITY; lineItem: LineItem }
	| null;

/**
 * Configure the charges of one addon already attached to a subscription.
 *
 * The backend has no update endpoint for the addon association itself, so
 * configuration operates on the addon's subscription line items: price
 * overrides go through PUT /subscriptions/lineitems/{id}; termination goes
 * through DELETE /subscriptions/lineitems/{id} with an effective date.
 *
 * When the addon has exactly one charge (the common case), the editor for
 * that charge opens directly; the intermediate charges table only appears
 * for multi-charge addons (or in read-only mode).
 */
const ConfigureAddonDialog: React.FC<Props> = ({
	isOpen,
	onOpenChange,
	subscriptionId,
	association,
	currentPeriodStart,
	currentPeriodEnd,
	readOnly = false,
}) => {
	const { t } = useTranslation(['billing', 'customers', 'common']);
	const [editingLineItem, setEditingLineItem] = useState<EditingLineItemState>(null);
	const [overriddenPrices, setOverriddenPrices] = useState<Record<string, ExtendedPriceOverride>>({});
	// Guards the single-charge auto-open so closing the editor doesn't immediately reopen it.
	const autoOpenedRef = useRef(false);

	const {
		data: lineItemsResponse,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ['addonAssociationLineItems', subscriptionId, association?.id],
		queryFn: async () =>
			SubscriptionApi.searchSubscriptionLineItems({
				subscription_ids: [subscriptionId],
				addon_association_ids: [association!.id],
				// Only active line items: ended charges must not reach the editors,
				// especially via the single-charge direct-open path.
				active_filter: true,
				expand: `${EXPAND.PRICES}.${EXPAND.METERS}`,
				limit: 100,
				offset: 0,
			}),
		enabled: isOpen && !!association?.id,
	});

	const lineItems = useMemo(() => (lineItemsResponse?.items ?? []).map(subscriptionLineItemListItemToLineItem), [lineItemsResponse?.items]);

	const invalidateAddonQueries = useCallback(() => {
		void refetch();
		void refetchQueries(['subscriptionActiveAddons', subscriptionId]);
		void refetchQueries(['subscriptionAddonLineItems', subscriptionId]);
		void refetchQueries(['subscriptionEdit', subscriptionId]);
		void refetchQueries(['subscriptionDetails', subscriptionId]);
	}, [refetch, subscriptionId]);

	const { mutate: updateLineItem, isPending: isUpdatingLineItem } = useMutation({
		mutationFn: async ({ lineItemId, updateData }: { lineItemId: string; updateData: UpdateSubscriptionLineItemRequest }) =>
			SubscriptionApi.updateSubscriptionLineItem(lineItemId, updateData),
		onSuccess: () => {
			toast.success(t('customers:subscriptionEdit.toast.lineItemUpdated'));
			invalidateAddonQueries();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('customers:subscriptionEdit.toast.lineItemUpdateFailed'));
		},
	});

	const { mutate: terminateLineItem } = useMutation({
		mutationFn: async ({ lineItemId, endDate }: { lineItemId: string; endDate?: string }) =>
			SubscriptionApi.deleteSubscriptionLineItem(lineItemId, endDate ? { effective_from: endDate } : {}),
		onSuccess: () => {
			toast.success(t('customers:subscriptionEdit.toast.lineItemTerminated'));
			invalidateAddonQueries();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('customers:subscriptionEdit.toast.lineItemTerminateFailed'));
		},
	});

	const handleEditLineItem = useCallback((lineItem: LineItem) => {
		const priceType = getPriceTypeFromLineItem(lineItem);
		if (priceType === PRICE_TYPE.FIXED) {
			setEditingLineItem({ mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.FIXED_QUANTITY, lineItem });
		} else {
			setEditingLineItem({ mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE, lineItem });
		}
	}, []);

	// Single-charge addons skip the charges table and open the editor directly.
	const singleLineItem = !readOnly && !isLoading && !isError && lineItems.length === 1 ? lineItems[0] : null;

	useEffect(() => {
		if (!isOpen) {
			autoOpenedRef.current = false;
			setEditingLineItem(null);
			return;
		}
		if (singleLineItem && !autoOpenedRef.current) {
			autoOpenedRef.current = true;
			handleEditLineItem(singleLineItem);
		}
	}, [isOpen, singleLineItem, handleEditLineItem]);

	// In direct mode there is no table behind the editor, so closing it closes Configure entirely.
	const closeEditor = useCallback(() => {
		setEditingLineItem(null);
		if (singleLineItem) onOpenChange(false);
	}, [singleLineItem, onOpenChange]);

	const handleTerminateLineItem = useCallback(
		(lineItemId: string, endDate?: string) => {
			terminateLineItem({ lineItemId, endDate });
		},
		[terminateLineItem],
	);

	const handleUsageLineItemUpdate = useCallback(
		(updateData: UpdateSubscriptionLineItemRequest) => {
			if (!editingLineItem || editingLineItem.mode !== SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE) return;
			updateLineItem({ lineItemId: editingLineItem.lineItem.id, updateData }, { onSuccess: () => closeEditor() });
		},
		[editingLineItem, updateLineItem, closeEditor],
	);

	const handleResetOverride = useCallback((priceId: string) => {
		setOverriddenPrices((prev) => {
			const next = { ...prev };
			delete next[priceId];
			return next;
		});
	}, []);

	return (
		<>
			<Dialog
				isOpen={isOpen && !singleLineItem && !isLoading}
				onOpenChange={onOpenChange}
				title={t('billing:subscriptions.configureAddonDialog.title')}
				description={association?.addon?.name}
				showCloseButton
				className='sm:max-w-4xl'>
				<div className='mt-3'>
					{isError ? (
						// A failed fetch must not read as "no charges" — show the error and allow a retry.
						<div className='flex flex-col items-center gap-3 py-8'>
							<p className='text-sm text-content-muted'>{t('billing:subscriptions.configureAddonDialog.loadError')}</p>
							<Button variant='outline' onClick={() => void refetch()}>
								{t('common:actions.retry')}
							</Button>
						</div>
					) : (
						<SubscriptionLineItemTable
							data={lineItems}
							isLoading={isLoading}
							hideCardWrapper
							readOnly={readOnly}
							onEdit={readOnly ? undefined : handleEditLineItem}
							onTerminate={readOnly ? undefined : handleTerminateLineItem}
							noDataSubtitle={t('billing:subscriptions.configureAddonDialog.empty')}
						/>
					)}
				</div>
			</Dialog>

			{editingLineItem?.mode === SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE && (
				<PriceOverrideDialog
					isOpen={true}
					onOpenChange={(open: boolean) => !open && closeEditor()}
					price={lineItemToPrice(editingLineItem.lineItem)}
					onPriceOverride={() => {}}
					onResetOverride={handleResetOverride}
					overriddenPrices={overriddenPrices}
					showEffectiveFrom={true}
					lineItem={editingLineItem.lineItem}
					onLineItemUpdate={handleUsageLineItemUpdate}
					isSaving={isUpdatingLineItem}
				/>
			)}

			{editingLineItem?.mode === SUBSCRIPTION_LINE_ITEM_EDIT_MODE.FIXED_QUANTITY && (
				<SubscriptionLineItemQuantityModifyDialog
					isOpen={true}
					onOpenChange={(open: boolean) => !open && closeEditor()}
					subscriptionId={subscriptionId}
					lineItem={editingLineItem.lineItem}
					currentPeriodStart={currentPeriodStart ?? ''}
					currentPeriodEnd={currentPeriodEnd ?? ''}
				/>
			)}
		</>
	);
};

export default ConfigureAddonDialog;
