import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import SubscriptionApi from '@/api/SubscriptionApi';
import { Card, FormHeader, ShortPagination, Spacer } from '@/components/atoms';
import { QueryBuilder } from '@/components/molecules/QueryBuilder';
import SubscriptionLineItemTable from '@/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable';
import { EXPAND } from '@/models';
import type { SubscriptionCommitmentInfo } from '@/models/Subscription';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import useFilterSorting from '@/hooks/useFilterSorting';
import { usePaginationReset } from '@/hooks/usePaginationReset';
import { subscriptionLineItemListItemToLineItem } from '@/utils/subscription/subscriptionLineItemListItemToLineItem';
import {
	SUBSCRIPTION_EDIT_LINE_ITEM_FILTER_OPTIONS,
	SUBSCRIPTION_EDIT_LINE_ITEM_SORT_OPTIONS,
} from '@/utils/subscription/subscriptionEditLineItemsUserQuery';

const LINE_ITEMS_PAGINATION_PREFIX = PAGINATION_PREFIX.SUBSCRIPTION_LINE_ITEMS;

interface Props {
	subscriptionId: string;
	customerId: string;
	currentPeriodStart: string;
	commitmentInfo?: SubscriptionCommitmentInfo;
}

/** Read-only subscription charges for the customer subscription details page. */
const SubscriptionDetailChargesSection: FC<Props> = ({ subscriptionId, customerId, currentPeriodStart, commitmentInfo }) => {
	const { t } = useTranslation('common');
	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		debounceTime: 300,
	});

	const { limit, offset, page, reset } = usePagination({
		initialLimit: 10,
		prefix: LINE_ITEMS_PAGINATION_PREFIX,
	});

	usePaginationReset(reset, sanitizedFilters, sanitizedSorts);

	const { data: lineItemsResponse, isLoading } = useQuery({
		queryKey: [
			'subscriptionDetailLineItems',
			subscriptionId,
			customerId,
			currentPeriodStart,
			page,
			limit,
			sanitizedFilters,
			sanitizedSorts,
		],
		queryFn: () =>
			SubscriptionApi.searchSubscriptionLineItems({
				subscription_ids: [subscriptionId],
				customer_ids: [customerId],
				current_period_start: currentPeriodStart,
				active_filter: true,
				limit,
				offset,
				expand: EXPAND.PRICES,
				filters: sanitizedFilters.length ? sanitizedFilters : undefined,
				sort: sanitizedSorts.length ? sanitizedSorts : undefined,
			}),
		enabled: !!subscriptionId && !!customerId && !!currentPeriodStart,
	});

	const lineItems = useMemo(() => (lineItemsResponse?.items ?? []).map(subscriptionLineItemListItemToLineItem), [lineItemsResponse?.items]);

	const totalLineItems = lineItemsResponse?.pagination?.total ?? 0;
	const hasActiveFilters = sanitizedFilters.length > 0 || sanitizedSorts.length > 0;
	const isEmpty = !isLoading && totalLineItems === 0 && !hasActiveFilters;

	if (isEmpty || (isLoading && !hasActiveFilters)) {
		return null;
	}

	return (
		<Card className='card mt-8' variant='notched'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<FormHeader title={t('labels.charges')} variant='sub-header' titleClassName='font-semibold' className='!mb-0' />
				<QueryBuilder
					filterOptions={SUBSCRIPTION_EDIT_LINE_ITEM_FILTER_OPTIONS}
					filters={filters}
					onFilterChange={setFilters}
					sortOptions={SUBSCRIPTION_EDIT_LINE_ITEM_SORT_OPTIONS}
					selectedSorts={sorts}
					onSortChange={setSorts}
					debounceTime={300}
					className='!mb-0'
				/>
			</div>
			<div className='mt-4'>
				<SubscriptionLineItemTable
					data={lineItems}
					isLoading={isLoading}
					commitmentInfo={commitmentInfo}
					readOnly
					showCommitmentColumn
					hideCardWrapper
					showNoDataCard={false}
					noDataSubtitle={t('labels.noChargesFound')}
				/>
				<Spacer className='!h-2' />
				<ShortPagination totalItems={totalLineItems} pageSize={limit} unit='charges' prefix={LINE_ITEMS_PAGINATION_PREFIX} />
			</div>
		</Card>
	);
};

export default SubscriptionDetailChargesSection;
