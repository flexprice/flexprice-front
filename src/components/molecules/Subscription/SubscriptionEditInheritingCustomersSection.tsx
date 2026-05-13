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
	const [childToDetach, setChildToDetach] = useState<SubscriptionResponse | null>(null);
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

	const { mutate: removeInheritance, isPending: isDetaching } = useMutation({
		mutationFn: async (childSubscriptionId: string) => {
			return await SubscriptionApi.updateSubscription(childSubscriptionId, { parent_subscription_id: null });
		},
		onSuccess: async () => {
			toast.success('Inheritance removed');
			setChildToDetach(null);
			void refetchQueries(['subscriptionEdit', parentSubscriptionId]);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to remove inheritance');
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
					throw new Error(`Customer "${c.name || c.id}" must have an external ID`);
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
			toast.success('Customers added to inherit');
			setAddDialogOpen(false);
			setSelectedCustomers([]);
			void refetchQueries(['subscriptionEdit', parentSubscriptionId]);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to add inheriting customers');
		},
	});

	const handleConfirmAdd = useCallback(() => {
		if (selectedCustomers.length === 0) return;
		addInheritance(selectedCustomers);
	}, [addInheritance, selectedCustomers]);

	const columns: ColumnData<SubscriptionResponse>[] = useMemo(
		() => [
			{
				title: 'Customer',
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}`}>{row.customer?.name ?? '—'}</RedirectCell>
				),
			},
			{
				title: 'Plan',
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}/subscription/${row.id}`}>
						{row.plan?.name ?? '—'}
					</RedirectCell>
				),
			},
			{
				title: 'Start date',
				render: (row) => <span className='text-muted-foreground'>{formatDate(row.start_date)}</span>,
			},
			{
				title: 'Renewal date',
				render: (row) => <span className='text-muted-foreground'>{formatDate(row.current_period_end)}</span>,
			},
		],
		[],
	);

	const detachTitle = childToDetach ? `Remove inheritance for ${childToDetach.customer?.name ?? 'this customer'}?` : '';

	const headerRow = (
		<div className='flex items-center justify-between mb-4'>
			<FormHeader title='Inheriting customers' variant='sub-header' titleClassName='text-lg font-semibold text-gray-900' className='mb-0' />
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
				title='Add customers to inherit'
				className='max-w-2xl sm:max-w-[42rem] w-[calc(100vw-2rem)]'
				descriptionClassName='mt-3'
				showCloseButton={!isAddingInheritance}>
				<div className='space-y-5 min-w-0'>
					<CustomerMultiSearchSelect
						value={selectedCustomers}
						onChange={setSelectedCustomers}
						excludeId={excludeCustomerIds}
						limit={50}
						searchPlaceholder='Search customers by name...'
						display={{
							label: 'Customers',
							placeholder: 'Select customers',
							className: 'min-w-0',
							triggerClassName: 'min-h-11',
						}}
						options={{ modalPopover: true }}
						disabled={isAddDisabled || isAddingInheritance}
					/>
					<div className='flex justify-end gap-2 pt-2'>
						<Button type='button' variant='outline' onClick={() => setAddDialogOpen(false)} disabled={isAddingInheritance}>
							Cancel
						</Button>
						<Button
							type='button'
							onClick={handleConfirmAdd}
							disabled={isAddDisabled || isAddingInheritance || selectedCustomers.length === 0}>
							{isAddingInheritance ? 'Adding…' : `Add${selectedCustomers.length > 0 ? ` (${selectedCustomers.length})` : ''}`}
						</Button>
					</div>
				</div>
			</Dialog>

			{inheritingSubscriptions.length === 0 && isListLoading ? (
				<Card variant='notched'>
					{headerRow}
					<div className='py-8 text-center text-sm text-muted-foreground'>Loading…</div>
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
					<p className='text-sm text-gray-500'>No customers inherit this subscription yet</p>
				</Card>
			)}

			<Dialog
				isOpen={childToDetach !== null}
				onOpenChange={(open) => !open && setChildToDetach(null)}
				title={detachTitle}
				description='The subscription stays on the customer as a standalone subscription; it will no longer mirror this parent.'
				titleClassName='text-lg font-normal text-gray-800'
				showCloseButton={!isDetaching}>
				<div className='flex justify-end gap-3 pt-2'>
					<Button variant='outline' onClick={() => setChildToDetach(null)} disabled={isDetaching}>
						Cancel
					</Button>
					<Button onClick={() => childToDetach && removeInheritance(childToDetach.id)} disabled={isDetaching || !childToDetach}>
						{isDetaching ? 'Removing…' : 'Remove inheritance'}
					</Button>
				</div>
			</Dialog>
		</>
	);
};

export default SubscriptionEditInheritingCustomersSection;
