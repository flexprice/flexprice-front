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
import TaxApi from '@/api/TaxApi';
import CouponApi from '@/api/CouponApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { LineItem, SUBSCRIPTION_LINE_ITEM_EDIT_MODE, SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { PRICE_TYPE } from '@/models/Price';
import { TAXRATE_ENTITY_TYPE } from '@/models/Tax';
import PriceOverrideDialog from '@/components/molecules/PriceOverrideDialog/PriceOverrideDialog';
import AddSubscriptionChargeDialog, {
	type AddedSubscriptionLineItem,
} from '@/components/organisms/Subscription/AddSubscriptionChargeDialog';
import CouponAssociationTable from '@/components/molecules/CouponAssociationTable/CouponAssociationTable';
import TaxAssociationTable from '@/components/molecules/TaxAssociationTable/TaxAssociationTable';
import ApplyCouponDialog from '@/components/molecules/ApplyCouponDialog/ApplyCouponDialog';
import RemoveCouponDialog from '@/components/molecules/RemoveCouponDialog/RemoveCouponDialog';
import ApplyTaxDialog from '@/components/molecules/ApplyTaxDialog/ApplyTaxDialog';
import RemoveTaxDialog from '@/components/molecules/RemoveTaxDialog/RemoveTaxDialog';
import { CouponAssociation } from '@/models/CouponAssociation';
import { TaxAssociationResponse } from '@/types/dto/tax';
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
	const { t } = useTranslation('customers');
	const subscriptionId = params.subscription_id ?? params.id;
	const [editingLineItem, setEditingLineItem] = useState<EditingLineItemState>(null);
	const [overriddenPrices, setOverriddenPrices] = useState<Record<string, ExtendedPriceOverride>>({});

	const [isAddCreditGrantModalOpen, setIsAddCreditGrantModalOpen] = useState(false);
	const [creditGrantToCancel, setCreditGrantToCancel] = useState<CreditGrant | null>(null);

	const [updateSubscriptionDrawerOpen, setUpdateSubscriptionDrawerOpen] = useState(false);
	const [isAddChargeDialogOpen, setIsAddChargeDialogOpen] = useState(false);

	const queryClient = useQueryClient();

	// Coupon dialog state
	const [applyCouponOpen, setApplyCouponOpen] = useState(false);
	const [applyCouponLineItemId, setApplyCouponLineItemId] = useState<string | undefined>();
	const [removeCouponAssociation, setRemoveCouponAssociation] = useState<CouponAssociation | null>(null);

	// Tax dialog state
	const [applyTaxOpen, setApplyTaxOpen] = useState(false);
	const [removeTaxAssociation, setRemoveTaxAssociation] = useState<TaxAssociationResponse | null>(null);

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
				status: ENTITY_STATUS.PUBLISHED,
			}),
		enabled: !!subscriptionId && !!subscriptionDetails,
	});

	const inheritedSubscriptionRows = inheritedSubscriptionsData?.items ?? [];

	const { data: lineItemsForDialog } = useQuery({
		queryKey: subscriptionId ? [...subscriptionEditScopeQueryKey(subscriptionId), 'lineItemsForDialog'] : ['disabled'],
		queryFn: () => SubscriptionApi.searchSubscriptionLineItems({ subscription_ids: [subscriptionId!], limit: 100, offset: 0 }),
		enabled: !!subscriptionId,
	});

	const { data: taxAssociationsData, refetch: refetchTaxAssociations } = useQuery({
		queryKey: subscriptionId ? ['subscriptionTaxAssociations', subscriptionId] : ['disabled'],
		queryFn: () =>
			TaxApi.listTaxAssociations({
				limit: 1000,
				offset: 0,
				entity_id: subscriptionId!,
				entity_type: TAXRATE_ENTITY_TYPE.SUBSCRIPTION,
				expand: generateExpandQueryParams([EXPAND.TAX_RATE]),
			}),
		enabled: !!subscriptionId,
	});

	const { data: couponAssociationsData } = useQuery({
		queryKey: subscriptionId ? ['couponAssociations', subscriptionId] : ['disabled'],
		queryFn: () => CouponApi.listCouponAssociations({ subscription_ids: [subscriptionId!], active_only: true }),
		enabled: !!subscriptionId,
	});

	const invalidateCouponAssociations = () => {
		if (subscriptionId) queryClient.invalidateQueries({ queryKey: ['couponAssociations', subscriptionId] });
	};

	const lineItemIdsWithCoupon = useMemo(
		() =>
			new Set((couponAssociationsData?.items ?? []).filter((a) => !!a.subscription_line_item_id).map((a) => a.subscription_line_item_id!)),
		[couponAssociationsData?.items],
	);

	const invalidateTaxAssociations = () => {
		if (subscriptionId) void refetchTaxAssociations();
	};

	const { mutateAsync: updateLineItem, isPending: isUpdatingLineItem } = useMutation({
		mutationFn: async ({ lineItemId, updateData }: { lineItemId: string; updateData: UpdateSubscriptionLineItemRequest }) => {
			return await SubscriptionApi.updateSubscriptionLineItem(lineItemId, updateData);
		},
		onSuccess: () => {
			toast.success(t('subscriptionEdit.toast.lineItemUpdated'));
			invalidateSubscriptionEdit();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('subscriptionEdit.toast.lineItemUpdateFailed'));
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
			toast.success(t('subscriptionEdit.toast.lineItemTerminated'));
			invalidateSubscriptionEdit();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('subscriptionEdit.toast.lineItemTerminateFailed'));
		},
	});

	const { mutateAsync: createLineItem, isPending: isCreatingLineItem } = useMutation({
		mutationFn: async (payload: CreateSubscriptionLineItemRequest) => {
			return await SubscriptionApi.createSubscriptionLineItem(subscriptionId!, payload);
		},
		onSuccess: () => {
			toast.success(t('subscriptionEdit.toast.chargeAdded'));
			invalidateSubscriptionEdit();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('subscriptionEdit.toast.chargeAddFailed'));
		},
	});

	const { mutate: updateSubscription, isPending: isUpdatingSubscription } = useMutation({
		mutationFn: async (payload: UpdateSubscriptionRequest) => {
			return await SubscriptionApi.updateSubscription(subscriptionId!, payload);
		},
		onSuccess: () => {
			toast.success(t('subscriptionEdit.toast.subscriptionUpdated'));
			invalidateSubscriptionEdit();
			refetchQueries(['subscriptions']);
			setUpdateSubscriptionDrawerOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('subscriptionEdit.toast.subscriptionUpdateFailed'));
		},
	});

	const { mutate: createCreditGrant } = useMutation({
		mutationFn: async (data: CreateCreditGrantRequest) => {
			return await CreditGrantApi.create(data);
		},
		onSuccess: () => {
			toast.success(t('subscriptionEdit.toast.creditGrantCreated'));
			invalidateSubscriptionEdit();
			setIsAddCreditGrantModalOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('subscriptionEdit.toast.creditGrantCreateFailed'));
		},
	});

	const { mutate: deleteCreditGrant } = useMutation({
		mutationFn: async ({ creditGrantId, effectiveDate }: { creditGrantId: string; effectiveDate: string }) => {
			const deleteRequest: { effective_date?: string } = effectiveDate ? { effective_date: effectiveDate } : {};
			return await CreditGrantApi.delete(creditGrantId, deleteRequest);
		},
		onSuccess: () => {
			toast.success(t('subscriptionEdit.toast.creditGrantDeleted'));
			invalidateSubscriptionEdit();
			setCreditGrantToCancel(null);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('subscriptionEdit.toast.creditGrantDeleteFailed'));
		},
	});

	useEffect(() => {
		if (subscriptionDetails?.plan?.name) {
			updateBreadcrumb(
				2,
				t('subscriptionDetail.breadcrumbSubscription'),
				`${RouteNames.customers}/${customer?.id}/subscription/${subscriptionId}`,
			);
		}

		if (customer?.external_id) {
			updateBreadcrumb(1, customer.external_id, `${RouteNames.customers}/${customer.id}`);
		}
	}, [subscriptionDetails, updateBreadcrumb, customer, subscriptionId, t]);

	useEffect(() => {
		if (isCoreError) {
			toast.error(t('subscriptionEdit.toast.loadError'));
		}
	}, [isCoreError, t]);

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

	const handleUsageLineItemUpdate = useCallback(
		async (updateData: UpdateSubscriptionLineItemRequest) => {
			if (!editingLineItem || editingLineItem.mode !== SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE) return;
			await updateLineItem({ lineItemId: editingLineItem.lineItem.id, updateData });
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
		async (item: AddedSubscriptionLineItem) => {
			const { tempId, ...request } = item;
			void tempId;
			await createLineItem(request as CreateSubscriptionLineItemRequest);
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
		<Page documentTitle={t('subscriptionEdit.pageTitle')} heading={t('subscriptionEdit.pageHeading')}>
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
							onApplyCouponToLineItem={(lineItem) => {
								setApplyCouponLineItemId(lineItem.id);
								setApplyCouponOpen(true);
							}}
							onRemoveCouponFromLineItem={(lineItem) => {
								const assoc = couponAssociationsData?.items?.find((a) => a.subscription_line_item_id === lineItem.id);
								if (assoc) setRemoveCouponAssociation(assoc);
							}}
							lineItemIdsWithCoupon={lineItemIdsWithCoupon}
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

						{/* Coupon Associations */}
						{subscriptionId && (
							<div className='mt-8'>
								<CouponAssociationTable
									subscriptionId={subscriptionId}
									onAdd={() => setApplyCouponOpen(true)}
									onRemove={(assoc) => setRemoveCouponAssociation(assoc)}
								/>
							</div>
						)}

						{/* Tax Associations */}
						{subscriptionId && (
							<div className='mt-8'>
								<TaxAssociationTable
									data={taxAssociationsData?.items ?? []}
									showDelete={false}
									onAdd={() => setApplyTaxOpen(true)}
									onRemove={(assoc) => setRemoveTaxAssociation(assoc)}
								/>
							</div>
						)}

						{/* Coupon + Tax Dialogs */}
						{subscriptionId && (
							<>
								<ApplyCouponDialog
									subscriptionId={subscriptionId}
									lineItems={lineItemsForDialog?.items ?? []}
									prefilledLineItemId={applyCouponLineItemId}
									open={applyCouponOpen}
									onOpenChange={(o) => {
										setApplyCouponOpen(o);
										if (!o) setApplyCouponLineItemId(undefined);
									}}
									onSuccess={invalidateCouponAssociations}
								/>
								{removeCouponAssociation && (
									<RemoveCouponDialog
										subscriptionId={subscriptionId}
										association={removeCouponAssociation}
										open={!!removeCouponAssociation}
										onOpenChange={(o) => {
											if (!o) setRemoveCouponAssociation(null);
										}}
										onSuccess={() => {
											setRemoveCouponAssociation(null);
											invalidateCouponAssociations();
										}}
									/>
								)}
								<ApplyTaxDialog
									subscriptionId={subscriptionId}
									open={applyTaxOpen}
									onOpenChange={setApplyTaxOpen}
									onSuccess={invalidateTaxAssociations}
								/>
								{removeTaxAssociation && (
									<RemoveTaxDialog
										subscriptionId={subscriptionId}
										association={removeTaxAssociation}
										open={!!removeTaxAssociation}
										onOpenChange={(o) => {
											if (!o) setRemoveTaxAssociation(null);
										}}
										onSuccess={() => {
											setRemoveTaxAssociation(null);
											invalidateTaxAssociations();
										}}
									/>
								)}
							</>
						)}

						{editingLineItem?.mode === SUBSCRIPTION_LINE_ITEM_EDIT_MODE.USAGE_OVERRIDE && (
							<PriceOverrideDialog
								isOpen={true}
								onOpenChange={(open: boolean) => !open && setEditingLineItem(null)}
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
							isSaving={isCreatingLineItem}
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
