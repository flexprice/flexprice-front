import { Spacer, Button, Divider, Card, CardHeader } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import ConnectionApi from '@/api/ConnectionApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import { useQuery } from '@tanstack/react-query';
import { Country } from 'country-state-city';
import { CreateCustomerDrawer, Detail, DetailsCard, MetadataModal, SaveCardModal } from '@/components/molecules';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { useParams, useOutletContext, useNavigate } from 'react-router';
import { Pencil, CreditCard, Share2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getTypographyClass } from '@/lib/typography';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { logger } from '@/utils/common/Logger';
import { CONNECTION_PROVIDER_TYPE } from '@/models/Connection';
import { useCustomerPortalUrl } from '@/hooks/useCustomerPortalUrl';
import { RouteNames } from '@/core/routes/Routes';
import { CustomerResponse } from '@/types/dto';
import { uniq } from 'lodash';
import { Skeleton } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { ENTITY_STATUS } from '@/models';

type ContextType = {
	isArchived: boolean;
};

const INVOICED_SUBSCRIPTIONS_LIMIT = 500;

type InvoicedSubscriberRow = CustomerResponse & { subscriptionCount: number };

const filterStringMetadata = (meta: Record<string, unknown> | undefined): Record<string, string> => {
	if (!meta) return {};
	return Object.fromEntries(Object.entries(meta).filter(([_, v]) => typeof v === 'string') as [string, string][]);
};

const CustomerInformationTab = () => {
	const { t } = useTranslation('customers');
	const { id: customerId } = useParams();
	const navigate = useNavigate();
	const { isArchived } = useOutletContext<ContextType>();

	const { data: customer, isLoading } = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});

	// Fetch Stripe connections to check availability
	const { data: connectionsResponse } = useQuery({
		queryKey: ['connections', CONNECTION_PROVIDER_TYPE.STRIPE],
		queryFn: () => ConnectionApi.ListPublished(),
		enabled: !!customerId && !isArchived,
	});

	const { data: invoicedSubsData, isLoading: isInvoicedSubsLoading } = useQuery({
		queryKey: ['subscriptionsByInvoicingCustomer', customerId],
		queryFn: () =>
			SubscriptionApi.listSubscriptions({
				invoicing_customer_ids: [customerId!],
				limit: INVOICED_SUBSCRIPTIONS_LIMIT,
				status: ENTITY_STATUS.PUBLISHED,
				offset: 0,
			}),
		enabled: !!customerId,
	});

	const invoicedSubItems = useMemo(() => invoicedSubsData?.items ?? [], [invoicedSubsData?.items]);

	const subscriptionCountBySubscriberId = useMemo(() => {
		const m = new Map<string, number>();
		for (const s of invoicedSubItems) {
			if (!s.customer_id) continue;
			m.set(s.customer_id, (m.get(s.customer_id) ?? 0) + 1);
		}
		return m;
	}, [invoicedSubItems]);

	const subscriberIdList = useMemo(() => {
		const raw = uniq(invoicedSubItems.map((s) => s.customer_id).filter(Boolean) as string[]);
		return raw.filter((id) => id !== customerId);
	}, [invoicedSubItems, customerId]);

	const sortedSubscriberIdsKey = useMemo(() => [...subscriberIdList].sort().join(','), [subscriberIdList]);

	const { data: subscribersCustomersData, isLoading: isSubscribersCustomersLoading } = useQuery({
		queryKey: ['customersByIds', sortedSubscriberIdsKey],
		queryFn: () =>
			CustomerApi.getCustomers({
				customer_ids: subscriberIdList,
				limit: Math.max(subscriberIdList.length, 1),
				offset: 0,
			}),
		enabled: subscriberIdList.length > 0,
	});

	const invoicedSubscriberRows: InvoicedSubscriberRow[] = useMemo(() => {
		const items = subscribersCustomersData?.items ?? [];
		return items.map((c) => ({
			...c,
			subscriptionCount: subscriptionCountBySubscriberId.get(c.id) ?? 0,
		}));
	}, [subscribersCustomersData?.items, subscriptionCountBySubscriberId]);

	const invoicedSubscribersColumns: ColumnData<InvoicedSubscriberRow>[] = useMemo(
		() => [
			{
				title: 'Name',
				render: (row) => <span className='font-medium text-foreground'>{row.name || '—'}</span>,
			},
			{
				title: 'External ID',
				render: (row) => <span className='text-muted-foreground'>{row.external_id || '—'}</span>,
			},
			// {
			// 	title: 'Subscriptions',
			// 	align: 'right',
			// 	render: (row) => <span className='text-foreground'>{row.subscriptionCount}</span>,
			// },
		],
		[],
	);

	const [showMetadataModal, setShowMetadataModal] = useState(false);
	const [customerDrawerOpen, setcustomerDrawerOpen] = useState(false);
	const [showSaveCardModal, setShowSaveCardModal] = useState(false);
	const [metadata, setMetadata] = useState<Record<string, string>>(filterStringMetadata(customer?.metadata));

	// Use customer portal hook with external_id
	const { copyToClipboard } = useCustomerPortalUrl(customer?.external_id);

	// Check if Stripe connection is available
	const hasStripeConnection =
		connectionsResponse?.connections?.some((connection) => connection.provider_type === CONNECTION_PROVIDER_TYPE.STRIPE) || false;

	// Get current URL for success/cancel redirects
	const currentUrl = window.location.href;

	// Update metadata state when customer changes
	useEffect(() => {
		setMetadata(filterStringMetadata(customer?.metadata));
	}, [customer]);

	const billingDetails: Detail[] = [
		{
			label: 'Name',
			value: customer?.name || '--',
		},
		{
			label: 'External ID',
			value: customer?.external_id || '--',
		},
		{
			label: 'Email',
			value: customer?.email || '--',
		},
		...(customer?.timezone?.trim()
			? [
					{
						label: t('overview.labels.timezone'),
						value: customer.timezone,
					},
				]
			: []),
		{
			variant: 'divider',
		},
		{
			variant: 'heading',
			label: 'Billing Details',
			className: getTypographyClass('card-header') + '!text-[16px]',
		},
		{
			label: 'Address Line 1',
			value: customer?.address_line1 || '--',
		},
		{
			label: 'Country',
			value: customer?.address_country ? Country.getCountryByCode(customer.address_country)?.name : '--',
		},
		{
			label: 'Address Line 2',
			value: customer?.address_line2 || '--',
		},
		{
			label: 'State',
			value: customer?.address_state || '--',
		},
		{
			label: 'City',
			value: customer?.address_city || '--',
		},
		{
			label: 'Postal Code',
			value: customer?.address_postal_code || '--',
		},
	];

	if (isLoading) {
		return (
			<div className='py-6 px-4 rounded-xl border border-line-strong'>
				<p className='text-content-tertiary'>{t('overview.loadingCustomerDetails')}</p>
			</div>
		);
	}

	return (
		<div>
			{billingDetails.filter((detail) => detail.value !== '--').length > 0 && (
				<div>
					<Spacer className='!h-4' />
					<div className='flex justify-between items-center'>
						<h3 className={getTypographyClass('card-header') + '!text-[16px]'}>{t('overview.cardTitle')}</h3>
						<div className='flex gap-2'>
							{!isArchived && hasStripeConnection && (
								<Button variant='outline' size='sm' onClick={() => setShowSaveCardModal(true)} className='!h-9 flex items-center gap-2'>
									<CreditCard className='size-4' />
									{t('tabPanels.information.saveCardOnStripe')}
								</Button>
							)}
							{!isArchived && (
								<>
									<Button variant='outline' size='icon' onClick={copyToClipboard} title={t('tabPanels.information.sharePortalLinkTitle')}>
										<Share2 className='size-4' />
									</Button>
									<CreateCustomerDrawer
										trigger={
											<Button variant={'outline'} size={'icon'}>
												<Pencil />
											</Button>
										}
										open={customerDrawerOpen}
										onOpenChange={setcustomerDrawerOpen}
										data={customer}
									/>
								</>
							)}
						</div>
					</div>
					<Spacer className='!h-4' />
					<DetailsCard variant='stacked' data={billingDetails} childrenAtTop cardStyle='borderless' />

					{/* Metadata Section Below Address Details */}
					<Divider className='my-4' />
					<div className='mt-8'>
						<div className='flex justify-between items-center mb-2'>
							<h3 className={getTypographyClass('card-header') + '!text-[16px]'}>{t('tabPanels.common.metadata')}</h3>
							{!isArchived && (
								<Button variant='outline' size='icon' onClick={() => setShowMetadataModal(true)}>
									<Pencil className='size-5' />
								</Button>
							)}
						</div>
						<DetailsCard
							variant='stacked'
							data={
								metadata && Object.keys(metadata).length > 0
									? Object.entries(metadata).map(([key, value]) => ({ label: key, value }))
									: [{ label: 'No metadata available.', value: '' }]
							}
							cardStyle='borderless'
						/>
					</div>

					{/* Metadata Modal for Editing */}
					<MetadataModal
						open={showMetadataModal}
						data={metadata}
						onSave={async (newMetadata) => {
							if (!customerId) return;
							try {
								const updated = await CustomerApi.updateCustomer({ metadata: newMetadata }, customerId);
								setMetadata(filterStringMetadata(updated.metadata));
								setShowMetadataModal(false);
								refetchQueries(['fetchCustomerDetails', customerId]);
							} catch (e) {
								logger.error('Failed to update metadata', e);
							}
						}}
						onClose={() => setShowMetadataModal(false)}
					/>

					{/* Save Card Modal */}
					<SaveCardModal isOpen={showSaveCardModal} onOpenChange={setShowSaveCardModal} customerId={customerId!} currentUrl={currentUrl} />
				</div>
			)}

			{customerId && invoicedSubItems.length > 0 && subscriberIdList.length > 0 && (
				<>
					<Spacer className='!h-8' />
					<Card variant='notched'>
						<CardHeader title={t('tabPanels.information.childCustomersTitle')} titleClassName='font-semibold' />
						{isInvoicedSubsLoading || isSubscribersCustomersLoading ? (
							<Skeleton className='h-40 w-full mt-2' />
						) : (
							<FlexpriceTable
								data={invoicedSubscriberRows}
								columns={invoicedSubscribersColumns}
								showEmptyRow
								variant='no-bordered'
								onRowClick={(row) => row?.id && navigate(`${RouteNames.customers}/${row.id}`)}
							/>
						)}
					</Card>
				</>
			)}
		</div>
	);
};

export default CustomerInformationTab;
