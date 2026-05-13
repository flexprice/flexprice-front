import { Loader, Page, Spacer } from '@/components/atoms';
import {
	SubscriptionEntitlementsSection,
	SubscriptionAddonsSection,
	SubscriptionEditDetailsHeader,
	SubscriptionEditChargesSection,
	SubscriptionEditCreditGrantsSection,
	SubscriptionEditInheritingCustomersSection,
	SubscriptionLineItemQuantityModifyDialog,
} from '@/components/molecules';
import { Skeleton } from '@/components/ui';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import CustomerApi from '@/api/CustomerApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import CreditGrantApi from '@/api/CreditGrantApi';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router';
import { LineItem, SUBSCRIPTION_LINE_ITEM_EDIT_MODE, SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from '@/models/Subscription';
import { PRICE_TYPE } from '@/models/Price';
import PriceOverrideDialog from '@/components/molecules/PriceOverrideDialog/PriceOverrideDialog';
import AddSubscriptionChargeDialog, {
	type AddedSubscriptionLineItem,
} from '@/components/organisms/Subscription/AddSubscriptionChargeDialog';
import {
	CreateSubscriptionLineItemRequest,
	DeleteSubscriptionLineItemRequest,
	UpdateSubscriptionLineItemRequest,
	UpdateSubscriptionRequest,
} from '@/types/dto/Subscription';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';
import { EXPAND } from '@/models';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import { convertPriceOverrideToLineItemUpdate } from '@/utils/subscription/priceOverrideToLineItemUpdate';
import { isInheritedSubscription } from '@/utils/subscription/isInheritedSubscription';
import { getPriceTypeFromLineItem, lineItemToPrice } from '@/utils/subscription/lineItemToPrice';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { ENTITY_STATUS, CreditGrant, CREDIT_GRANT_SCOPE } from '@/models';
import { useSubscriptionEditCoreQuery } from '@/hooks/useSubscriptionEditCoreQuery';
import { subscriptionEditInheritedQueryKey, subscriptionEditScopeQueryKey } from '@/utils/subscription/subscriptionEditQueryKeys';
import type { CreateCreditGrantRequest } from '@/types/dto/CreditGrant';

type EditingLineItemState =
	| { mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE; lineItem: LineItem }
	| { mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.FIXED_QUANTITY; lineItem: LineItem }
	| null;

type Params = {
	/** Global route: `/billing/subscriptions/:id/edit` */
	id?: string;
	/** Customer nested route: `.../subscription/:subscription_id/edit` */
	subscription_id?: string;
};

const CustomerSubscriptionEditPage: React.FC = () => {
	const params = useParams<Params>();
	const subscriptionId = params.subscription_id ?? params.id;
	const [editingLineItem, setEditingLineItem] = useState<EditingLineItemState>(null);
	const [overriddenPrices, setOverriddenPrices] = useState<Record<string, ExtendedPriceOverride>>({});

	const [isAddCreditGrantModalOpen, setIsAddCreditGrantModalOpen] = useState(false);
	const [creditGrantToCancel, setCreditGrantToCancel] = useState<CreditGrant | null>(null);

	const [updateSubscriptionDrawerOpen, setUpdateSubscriptionDrawerOpen] = useState(false);
	const [isAddChargeDialogOpen, setIsAddChargeDialogOpen] = useState(false);

	const { updateBreadcrumb } = useBreadcrumbsStore();

	const { data: subscriptionDetails, isLoading: isCoreLoading, isError: isCoreError } = useSubscriptionEditCoreQuery(subscriptionId);

	const invalidateSubscriptionEdit = useCallback(() => {
		if (subscriptionId) {
			void refetchQueries(['subscriptionEdit', subscriptionId]);
		}
	}, [subscriptionId]);

	const phasesForCharges = subscriptionDetails?.phases?.length
		? subscriptionDetails.phases
		: subscriptionDetails?.schedule?.phases
			? [...subscriptionDetails.schedule.phases]
			: undefined;

	const { data: customer } = useQuery({
		queryKey: subscriptionId
			? [...subscriptionEditScopeQueryKey(subscriptionId), 'customer']
			: ['subscriptionEdit', 'disabled', 'customer'],
		queryFn: async () => await CustomerApi.getCustomerById(subscriptionDetails!.customer_id),
		enabled: !!(subscriptionDetails?.customer_id && subscriptionId),
	});

	const { data: creditGrants } = useQuery({
		queryKey: subscriptionId
			? [...subscriptionEditScopeQueryKey(subscriptionId), 'creditGrants']
			: ['subscriptionEdit', 'disabled', 'creditGrants'],
		queryFn: async () => {
			return await CreditGrantApi.list({
				subscription_ids: [subscriptionId!],
				status: ENTITY_STATUS.PUBLISHED,
				scope: CREDIT_GRANT_SCOPE.SUBSCRIPTION,
			});
		},
		enabled:
			!!subscriptionDetails &&
			subscriptionDetails.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED &&
			subscriptionDetails.subscription_status !== SUBSCRIPTION_STATUS.TRIALING &&
			!!subscriptionId,
	});

	const { data: inheritedSubscriptionsData, isLoading: isInheritedSubscriptionsLoading } = useQuery({
		queryKey: subscriptionId ? subscriptionEditInheritedQueryKey(subscriptionId) : ['subscriptionEdit', 'no-inherit'],
		queryFn: async () =>
			SubscriptionApi.searchSubscriptions({
				filters: [
					{
						field: 'parent_subscription_id',
						operator: FilterOperator.EQUAL,
						data_type: DataType.STRING,
						value: { string: subscriptionId! },
					},
				],
				limit: 100,
				offset: 0,
				expand: generateExpandQueryParams([EXPAND.PLAN, EXPAND.CUSTOMER]),
			}),
		enabled: !!subscriptionId && !!subscriptionDetails,
	});

	const inheritedSubscriptionRows = inheritedSubscriptionsData?.items ?? [];

	const isParentSubscription = subscriptionDetails?.subscription_type?.toLowerCase() === SUBSCRIPTION_TYPE.PARENT;
	const showInheritingCustomersSection =
		!!subscriptionDetails?.customer_id && (isParentSubscription || inheritedSubscriptionRows.length > 0);

	const { mutate: updateLineItem } = useMutation({
		mutationFn: async ({ lineItemId, updateData }: { lineItemId: string; updateData: UpdateSubscriptionLineItemRequest }) => {
			return await SubscriptionApi.updateSubscriptionLineItem(lineItemId, updateData);
		},
		onSuccess: () => {
			toast.success('Line item updated successfully');
			invalidateSubscriptionEdit();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update line item');
		},
	});

	const { mutate: terminateLineItem } = useMutation({
		mutationFn: async ({ lineItemId, endDate }: { lineItemId: string; endDate?: string }) => {
			const payload: DeleteSubscriptionLineItemRequest = {};
			if (endDate) {
				payload.effective_from = endDate;
			}
			return await SubscriptionApi.deleteSubscriptionLineItem(lineItemId, payload);
		},
		onSuccess: () => {
			toast.success('Line item terminated successfully');
			invalidateSubscriptionEdit();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to terminate line item');
		},
	});

	const { mutate: createLineItem } = useMutation({
		mutationFn: async (payload: CreateSubscriptionLineItemRequest) => {
			return await SubscriptionApi.createSubscriptionLineItem(subscriptionId!, payload);
		},
		onSuccess: () => {
			toast.success('Charge added successfully');
			invalidateSubscriptionEdit();
			setIsAddChargeDialogOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to add charge');
		},
	});

	const { mutate: updateSubscription, isPending: isUpdatingSubscription } = useMutation({
		mutationFn: async (payload: UpdateSubscriptionRequest) => {
			return await SubscriptionApi.updateSubscription(subscriptionId!, payload);
		},
		onSuccess: () => {
			toast.success('Subscription updated successfully');
			invalidateSubscriptionEdit();
			refetchQueries(['subscriptions']);
			setUpdateSubscriptionDrawerOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update subscription');
		},
	});

	const { mutate: createCreditGrant } = useMutation({
		mutationFn: async (data: CreateCreditGrantRequest) => {
			return await CreditGrantApi.create(data);
		},
		onSuccess: () => {
			toast.success('Credit grant created successfully');
			invalidateSubscriptionEdit();
			setIsAddCreditGrantModalOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create credit grant');
		},
	});

	const { mutate: deleteCreditGrant } = useMutation({
		mutationFn: async ({ creditGrantId, effectiveDate }: { creditGrantId: string; effectiveDate: string }) => {
			const deleteRequest: { effective_date?: string } = effectiveDate ? { effective_date: effectiveDate } : {};
			return await CreditGrantApi.delete(creditGrantId, deleteRequest);
		},
		onSuccess: () => {
			toast.success('Credit grant deleted successfully');
			invalidateSubscriptionEdit();
			setCreditGrantToCancel(null);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete credit grant');
		},
	});

	useEffect(() => {
		if (subscriptionDetails?.plan?.name) {
			updateBreadcrumb(2, `Subscription`, `${RouteNames.customers}/${customer?.id}/subscription/${subscriptionId}`);
		}

		if (customer?.external_id) {
			updateBreadcrumb(1, customer.external_id, `${RouteNames.customers}/${customer.id}`);
		}
	}, [subscriptionDetails, updateBreadcrumb, customer, subscriptionId]);

	useEffect(() => {
		if (isCoreError) {
			toast.error('Error loading subscription data');
		}
	}, [isCoreError]);

	const handleEditLineItem = useCallback((lineItem: LineItem) => {
		const priceType = getPriceTypeFromLineItem(lineItem);
		if (priceType === PRICE_TYPE.FIXED) {
			setEditingLineItem({ mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.FIXED_QUANTITY, lineItem });
		} else {
			setEditingLineItem({ mode: SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE, lineItem });
		}
	}, []);

	const handleTerminateLineItem = useCallback(
		(lineItemId: string, endDate?: string) => {
			terminateLineItem({ lineItemId, endDate });
		},
		[terminateLineItem],
	);

	const handlePriceOverride = useCallback(
		(priceId: string, override: Partial<ExtendedPriceOverride>) => {
			if (!editingLineItem || editingLineItem.mode !== SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE) return;
			const updateData = convertPriceOverrideToLineItemUpdate(priceId, override);
			updateLineItem({ lineItemId: editingLineItem.lineItem.id, updateData });
			setEditingLineItem(null);
		},
		[editingLineItem, updateLineItem],
	);

	const handleResetOverride = useCallback((priceId: string) => {
		setOverriddenPrices((prev) => {
			const newOverrides = { ...prev };
			delete newOverrides[priceId];
			return newOverrides;
		});
	}, []);

	const handleCreateCreditGrant = useCallback(
		(data: unknown) => {
			createCreditGrant(data as CreateCreditGrantRequest);
		},
		[createCreditGrant],
	);

	const handleCancelCreditGrant = useCallback((grant: CreditGrant) => {
		setCreditGrantToCancel(grant);
	}, []);

	const handleConfirmCancelCreditGrant = useCallback(
		(effectiveDate: string) => {
			if (creditGrantToCancel) {
				deleteCreditGrant({
					creditGrantId: creditGrantToCancel.id,
					effectiveDate: effectiveDate || new Date().toISOString(),
				});
			}
		},
		[creditGrantToCancel, deleteCreditGrant],
	);

	const handleCloseCancelModal = useCallback(() => {
		setCreditGrantToCancel(null);
	}, []);

	const handleAddChargeSave = useCallback(
		(item: AddedSubscriptionLineItem) => {
			const { tempId, ...request } = item;
			void tempId; // omitted from API request
			createLineItem(request as CreateSubscriptionLineItemRequest);
		},
		[createLineItem],
	);

	if (!subscriptionId) {
		return null;
	}

	if (isCoreError) {
		return null;
	}

	const subscriptionReadOnly = subscriptionDetails ? isInheritedSubscription(subscriptionDetails) : false;

	return (
		<Page documentTitle='Edit Subscription' heading='Edit Subscription'>
			<div className='space-y-6'>
				{isCoreLoading && !subscriptionDetails ? (
					<>
						<Skeleton className='h-8 w-full max-w-xl' />
						<Skeleton className='h-40 w-full' />
						<Skeleton className='h-6 w-48' />
					</>
				) : subscriptionDetails ? (
					<>
						<SubscriptionEditDetailsHeader
							subscription={subscriptionDetails}
							subscriptionId={subscriptionId}
							onUpdate={updateSubscription}
							isUpdating={isUpdatingSubscription}
							updateDrawerOpen={updateSubscriptionDrawerOpen}
							onUpdateDrawerOpenChange={setUpdateSubscriptionDrawerOpen}
						/>
						<Spacer height={16} />

						{showInheritingCustomersSection && (
							<SubscriptionEditInheritingCustomersSection
								parentSubscriptionId={subscriptionId}
								parentCustomerId={subscriptionDetails.customer_id}
								inheritingSubscriptions={inheritedSubscriptionRows}
								isListLoading={isInheritedSubscriptionsLoading}
								isAddDisabled={
									subscriptionReadOnly ||
									subscriptionDetails.subscription_status === SUBSCRIPTION_STATUS.CANCELLED ||
									subscriptionDetails.subscription_status === SUBSCRIPTION_STATUS.TRIALING
								}
							/>
						)}

						<SubscriptionEditChargesSection
							subscriptionId={subscriptionId}
							customerId={subscriptionDetails.customer_id}
							currentPeriodStart={subscriptionDetails.current_period_start}
							phases={phasesForCharges}
							isLoading={isCoreLoading}
							onEditLineItem={handleEditLineItem}
							onTerminateLineItem={handleTerminateLineItem}
							onAddCharge={() => setIsAddChargeDialogOpen(true)}
							isAddChargeDisabled={
								subscriptionDetails?.subscription_status === SUBSCRIPTION_STATUS.CANCELLED ||
								subscriptionDetails?.subscription_status === SUBSCRIPTION_STATUS.TRIALING
							}
							readOnly={subscriptionReadOnly}
							commitmentInfo={{
								enable_true_up: subscriptionDetails?.enable_true_up,
								commitment_amount: subscriptionDetails?.commitment_amount,
								overage_factor: subscriptionDetails?.overage_factor,
								commitment_duration: subscriptionDetails?.commitment_duration,
								currency: subscriptionDetails?.currency,
							}}
						/>

						<SubscriptionEditCreditGrantsSection
							creditGrants={creditGrants?.items ?? []}
							isAddDisabled={
								subscriptionDetails?.subscription_status === SUBSCRIPTION_STATUS.CANCELLED ||
								subscriptionDetails?.subscription_status === SUBSCRIPTION_STATUS.TRIALING
							}
							readOnly={subscriptionReadOnly}
							onAddClick={() => setIsAddCreditGrantModalOpen(true)}
							onRequestCancel={handleCancelCreditGrant}
							subscriptionId={subscriptionId}
							subscriptionStartDate={subscriptionDetails?.start_date}
							subscriptionCurrentPeriodEnd={subscriptionDetails?.current_period_end}
							onSaveCreditGrant={handleCreateCreditGrant}
							isAddModalOpen={isAddCreditGrantModalOpen}
							onAddModalOpenChange={setIsAddCreditGrantModalOpen}
							creditGrantToCancel={creditGrantToCancel}
							onConfirmCancelCreditGrant={handleConfirmCancelCreditGrant}
							onCloseCancelModal={handleCloseCancelModal}
						/>

						<SubscriptionEntitlementsSection subscriptionId={subscriptionId} readOnly={subscriptionReadOnly} />

						<SubscriptionAddonsSection
							subscriptionId={subscriptionId}
							readOnly={subscriptionReadOnly}
							subscriptionBillingPeriod={subscriptionDetails.billing_period}
							subscriptionCurrency={subscriptionDetails.currency}
							subscriptionCurrentPeriodStart={subscriptionDetails.current_period_start}
							subscriptionCurrentPeriodEnd={subscriptionDetails.current_period_end}
						/>

						{editingLineItem?.mode === SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE && (
							<PriceOverrideDialog
								isOpen={true}
								onOpenChange={(open: boolean) => !open && setEditingLineItem(null)}
								price={lineItemToPrice(editingLineItem.lineItem)}
								onPriceOverride={handlePriceOverride}
								onResetOverride={handleResetOverride}
								overriddenPrices={overriddenPrices}
								showEffectiveFrom={true}
							/>
						)}

						{editingLineItem?.mode === SUBSCRIPTION_LINE_ITEM_EDIT_MODE.FIXED_QUANTITY && subscriptionDetails && (
							<SubscriptionLineItemQuantityModifyDialog
								isOpen={true}
								onOpenChange={(open: boolean) => !open && setEditingLineItem(null)}
								subscriptionId={subscriptionId}
								lineItem={editingLineItem.lineItem}
								currentPeriodStart={subscriptionDetails.current_period_start}
								currentPeriodEnd={subscriptionDetails.current_period_end}
							/>
						)}

						<AddSubscriptionChargeDialog
							isOpen={isAddChargeDialogOpen}
							onOpenChange={setIsAddChargeDialogOpen}
							onSave={handleAddChargeSave}
							defaultCurrency={subscriptionDetails?.currency}
							defaultBillingPeriod={subscriptionDetails?.billing_period}
							defaultStartDate={subscriptionDetails?.start_date}
							subscriptionId={subscriptionId}
						/>
					</>
				) : (
					<Loader />
				)}

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default CustomerSubscriptionEditPage;
