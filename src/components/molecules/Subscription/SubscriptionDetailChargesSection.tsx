import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import SubscriptionApi from '@/api/SubscriptionApi';
import { ShortPagination, Spacer } from '@/components/atoms';
import SubscriptionLineItemTable from '@/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable';
import { EXPAND } from '@/models';
import type { SubscriptionCommitmentInfo } from '@/models/Subscription';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { subscriptionLineItemListItemToLineItem } from '@/utils/subscription/subscriptionLineItemListItemToLineItem';

const LINE_ITEMS_PAGINATION_PREFIX = PAGINATION_PREFIX.SUBSCRIPTION_DETAIL_LINE_ITEMS;

interface Props {
	subscriptionId: string;
	customerId: string;
	currentPeriodStart: string;
	commitmentInfo?: SubscriptionCommitmentInfo;
}

/** Read-only subscription charges for the customer subscription details page. */
const SubscriptionDetailChargesSection: FC<Props> = ({ subscriptionId, customerId, currentPeriodStart, commitmentInfo }) => {
	const { t } = useTranslation('common');
	const { limit, offset, page } = usePagination({
		initialLimit: 5,
		prefix: LINE_ITEMS_PAGINATION_PREFIX,
	});

	const { data: lineItemsResponse, isLoading } = useQuery({
		queryKey: ['subscriptionDetailLineItems', subscriptionId, currentPeriodStart, page, limit],
		queryFn: () =>
			SubscriptionApi.searchSubscriptionLineItems({
				subscription_ids: [subscriptionId],
				customer_ids: [customerId],
				current_period_start: currentPeriodStart,
				active_filter: true,
				limit,
				offset,
				expand: EXPAND.PRICES,
			}),
		enabled: !!subscriptionId && !!customerId && !!currentPeriodStart,
	});

	const lineItems = useMemo(() => (lineItemsResponse?.items ?? []).map(subscriptionLineItemListItemToLineItem), [lineItemsResponse?.items]);
	const totalLineItems = lineItemsResponse?.pagination?.total ?? 0;

	return (
		<>
			<SubscriptionLineItemTable
				data={lineItems}
				isLoading={isLoading}
				commitmentInfo={commitmentInfo}
				readOnly
				hideCardWrapper
				noDataSubtitle={t('labels.noChargesFound')}
			/>
			<Spacer className='!h-2' />
			<ShortPagination totalItems={totalLineItems} pageSize={limit} unit='charges' prefix={LINE_ITEMS_PAGINATION_PREFIX} />
		</>
	);
};

export default SubscriptionDetailChargesSection;
