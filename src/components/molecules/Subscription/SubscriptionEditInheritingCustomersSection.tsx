import { FC, useMemo, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, FormHeader, AddButton, Dialog, Button } from '@/components/atoms';
import FlexpriceTable, { ColumnData, RedirectCell } from '@/components/molecules/Table';
import { SubscriptionResponse } from '@/types/dto/Subscription';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import SubscriptionApi from '@/api/SubscriptionApi';
import CustomerApi from '@/api/CustomerApi';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import toast from 'react-hot-toast';
import CustomerMultiSearchSelect from '@/components/molecules/Customer/CustomerMultiSearchSelect';
import type { Customer } from '@/models';
import { SUBSCRIPTION_MODIFY_TYPE } from '@/models';
import { useTranslation } from 'react-i18next';

export interface SubscriptionEditInheritingCustomersSectionProps {
	parentSubscriptionId: string;
	parentCustomerId: string;
	inheritingSubscriptions: SubscriptionResponse[];
	isListLoading?: boolean;
	isAddDisabled?: boolean;
}

const SubscriptionEditInheritingCustomersSection: FC<SubscriptionEditInheritingCustomersSectionProps> = ({
	parentSubscriptionId,
	parentCustomerId,
	inheritingSubscriptions,
	isListLoading = false,
	isAddDisabled = false,
}) => {
	const { t } = useTranslation(['billing', 'common']);
	const [childToDetach, setChildToDetach] = useState<SubscriptionResponse | null>(null);
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

	const { mutate: removeInheritance, isPending: isDetaching } = useMutation({
		mutationFn: async (childSubscriptionId: string) => {
			return await SubscriptionApi.updateSubscription(childSubscriptionId, { parent_subscription_id: null });
		},
		onSuccess: async () => {
			toast.success(t('subscriptions.inheritanceEdit.toastRemoved'));
			setChildToDetach(null);
			void refetchQueries(['subscriptionEdit', parentSubscriptionId]);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('subscriptions.inheritanceEdit.toastRemoveFailed'));
		},
	});

	const handleAddClick = useCallback(() => {
		setAddDialogOpen(true);
	}, []);

	const excludeCustomerIds = useMemo(() => {
		const ids = [parentCustomerId, ...inheritingSubscriptions.map((s) => s.customer_id)].filter(Boolean);
		return ids;
	}, [parentCustomerId, inheritingSubscriptions]);

	const { mutate: addInheritance, isPending: isAddingInheritance } = useMutation({
		mutationFn: async (customers: Customer[]) => {
			const resolvedExternalIds: string[] = [];

			for (const c of customers) {
				let ext = c.external_id?.trim();
				if (!ext && c.id) {
					const full = await CustomerApi.getCustomerById(c.id);
					ext = full.external_id?.trim();
				}
				if (!ext) {
					throw new Error(t('subscriptions.inheritanceEdit.externalIdRequired', { name: c.name || c.id }));
				}
				resolvedExternalIds.push(ext);
			}

			return await SubscriptionApi.executeSubscriptionModify(parentSubscriptionId, {
				type: SUBSCRIPTION_MODIFY_TYPE.INHERITANCE,
				inheritance_params: {
					external_customer_ids_to_inherit_subscription: resolvedExternalIds,
				},
			});
		},
		onSuccess: () => {
			toast.success(t('subscriptions.inheritanceEdit.toastAdded'));
			setAddDialogOpen(false);
			setSelectedCustomers([]);
			void refetchQueries(['subscriptionEdit', parentSubscriptionId]);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('subscriptions.inheritanceEdit.toastAddFailed'));
		},
	});

	const handleConfirmAdd = useCallback(() => {
		if (selectedCustomers.length === 0) return;
		addInheritance(selectedCustomers);
	}, [addInheritance, selectedCustomers]);

	const columns: ColumnData<SubscriptionResponse>[] = useMemo(
		() => [
			{
				title: t('subscriptions.inheritanceEdit.columnCustomer'),
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}`}>{row.customer?.name ?? '—'}</RedirectCell>
				),
			},
			{
				title: t('subscriptions.inheritanceEdit.columnPlan'),
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}/subscription/${row.id}`}>
						{row.plan?.name ?? '—'}
					</RedirectCell>
				),
			},
			{
				title: t('subscriptions.inheritanceEdit.columnStartDate'),
				render: (row) => <span className='text-muted-foreground'>{formatDate(row.start_date)}</span>,
			},
			{
				title: t('subscriptions.inheritanceEdit.columnRenewalDate'),
				render: (row) => <span className='text-muted-foreground'>{formatDate(row.current_period_end)}</span>,
			},
		],
		[t],
	);

	const detachTitle = childToDetach
		? t('subscriptions.inheritanceEdit.detachConfirmTitle', {
				name: childToDetach.customer?.name ?? t('subscriptions.inheritanceEdit.detachFallbackCustomer'),
			})
		: '';

	const headerRow = (
		<div className='flex items-center justify-between mb-4'>
			<FormHeader
				title={t('subscriptions.inheritingCustomers')}
				variant='sub-header'
				titleClassName='text-lg font-semibold text-gray-900'
				className='mb-0'
			/>
			<AddButton onClick={handleAddClick} disabled={isAddDisabled} />
		</div>
	);

	return (
		<>
			<Dialog
				isOpen={addDialogOpen}
				onOpenChange={(open) => {
					setAddDialogOpen(open);
					if (!open) setSelectedCustomers([]);
				}}
				title={t('subscriptions.addCustomersToInherit')}
				className='max-w-2xl sm:max-w-[42rem] w-[calc(100vw-2rem)]'
				descriptionClassName='mt-3'
				showCloseButton={!isAddingInheritance}>
				<div className='space-y-5 min-w-0'>
					<CustomerMultiSearchSelect
						value={selectedCustomers}
						onChange={setSelectedCustomers}
						excludeId={excludeCustomerIds}
						limit={50}
						searchPlaceholder={t('subscriptions.inheritanceEdit.searchPlaceholder')}
						display={{
							label: t('subscriptions.inheritanceEdit.multiSelectLabel'),
							placeholder: t('subscriptions.inheritanceEdit.multiSelectPlaceholder'),
							className: 'min-w-0',
							triggerClassName: 'min-h-11',
						}}
						options={{ modalPopover: true }}
						disabled={isAddDisabled || isAddingInheritance}
					/>
					<div className='flex justify-end gap-2 pt-2'>
						<Button type='button' variant='outline' onClick={() => setAddDialogOpen(false)} disabled={isAddingInheritance}>
							{t('common:actions.cancel')}
						</Button>
						<Button
							type='button'
							onClick={handleConfirmAdd}
							disabled={isAddDisabled || isAddingInheritance || selectedCustomers.length === 0}>
							{isAddingInheritance
								? t('subscriptions.inheritanceEdit.adding')
								: selectedCustomers.length > 0
									? t('subscriptions.inheritanceEdit.addWithCount', { count: selectedCustomers.length })
									: t('subscriptions.inheritanceEdit.add')}
						</Button>
					</div>
				</div>
			</Dialog>

			{inheritingSubscriptions.length === 0 && isListLoading ? (
				<Card variant='notched'>
					{headerRow}
					<div className='py-8 text-center text-sm text-muted-foreground'>{t('common:status.loading')}</div>
				</Card>
			) : inheritingSubscriptions.length > 0 ? (
				<Card variant='notched'>
					{headerRow}
					<div className='mt-4'>
						<FlexpriceTable showEmptyRow={false} data={inheritingSubscriptions} columns={columns} variant='no-bordered' />
					</div>
				</Card>
			) : (
				<Card variant='notched'>
					{headerRow}
					<p className='text-sm text-gray-500'>{t('subscriptions.inheritanceEdit.emptyState')}</p>
				</Card>
			)}

			<Dialog
				isOpen={childToDetach !== null}
				onOpenChange={(open) => !open && setChildToDetach(null)}
				title={detachTitle}
				description={t('subscriptions.inheritanceNote')}
				titleClassName='text-lg font-normal text-gray-800'
				showCloseButton={!isDetaching}>
				<div className='flex justify-end gap-3 pt-2'>
					<Button variant='outline' onClick={() => setChildToDetach(null)} disabled={isDetaching}>
						{t('common:actions.cancel')}
					</Button>
					<Button onClick={() => childToDetach && removeInheritance(childToDetach.id)} disabled={isDetaching || !childToDetach}>
						{isDetaching ? t('subscriptions.inheritanceEdit.removing') : t('subscriptions.removeInheritance')}
					</Button>
				</div>
			</Dialog>
		</>
	);
};

export default SubscriptionEditInheritingCustomersSection;
