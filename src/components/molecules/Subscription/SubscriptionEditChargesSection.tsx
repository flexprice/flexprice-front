import { useTranslation } from 'react-i18next';
import { FC, useMemo } from 'react';
import { Card, AddButton, NoDataCard, ShortPagination, Spacer } from '@/components/atoms';
import SubscriptionLineItemTable from '@/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable';
import { QueryBuilder } from '@/components/molecules/QueryBuilder';
import type { LineItem, SubscriptionCommitmentInfo, SubscriptionPhase } from '@/models/Subscription';
import formatDate from '@/utils/common/format_date';
import { useQuery } from '@tanstack/react-query';
import SubscriptionApi from '@/api/SubscriptionApi';
import { EXPAND } from '@/models';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import useFilterSorting from '@/hooks/useFilterSorting';
import { usePaginationReset } from '@/hooks/usePaginationReset';
import { subscriptionEditLineItemsQueryKey } from '@/utils/subscription/subscriptionEditQueryKeys';
import { subscriptionLineItemListItemToLineItem } from '@/utils/subscription/subscriptionLineItemListItemToLineItem';
import {
	SUBSCRIPTION_EDIT_LINE_ITEM_FILTER_OPTIONS,
	SUBSCRIPTION_EDIT_LINE_ITEM_SORT_OPTIONS,
} from '@/utils/subscription/subscriptionEditLineItemsUserQuery';

export type { SubscriptionCommitmentInfo };

const LINE_ITEMS_PAGINATION_PREFIX = PAGINATION_PREFIX.SUBSCRIPTION_LINE_ITEMS;

export interface SubscriptionEditChargesSectionProps {
	subscriptionId: string;
	customerId: string;
	currentPeriodStart: string;
	/** Phase metadata from subscription core (optional Phase column when present). */
	phases?: SubscriptionPhase[] | null;
	isLoading?: boolean;
	onEditLineItem: (lineItem: LineItem) => void;
	onTerminateLineItem: (lineItemId: string, endDate?: string) => void;
	onAddCharge?: () => void;
	isAddChargeDisabled?: boolean;
	readOnly?: boolean;
	commitmentInfo?: SubscriptionCommitmentInfo;
}

const SubscriptionEditChargesSection: FC<SubscriptionEditChargesSectionProps> = ({
	subscriptionId,
	customerId,
	currentPeriodStart,
	phases,
	isLoading: isParentLoading = false,
	onEditLineItem,
	onTerminateLineItem,
	onAddCharge,
	isAddChargeDisabled = false,
	readOnly = false,
	commitmentInfo,
}) => {
	const { t } = useTranslation('common');
	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		debounceTime: 300,
	});

	const { limit, offset, page, reset } = usePagination({
		initialLimit: 5,
		prefix: LINE_ITEMS_PAGINATION_PREFIX,
	});

	usePaginationReset(reset, sanitizedFilters, sanitizedSorts);

	const { data: lineItemsResponse, isLoading: isLineItemsQueryLoading } = useQuery({
		queryKey: subscriptionEditLineItemsQueryKey(
			subscriptionId,
			customerId,
			currentPeriodStart,
			page,
			limit,
			sanitizedFilters,
			sanitizedSorts,
		),
		queryFn: async () =>
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

	const phaseLabelsById = useMemo((): Record<string, string> | undefined => {
		if (!phases?.length) return undefined;
		const sorted = [...phases].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
		return Object.fromEntries(
			sorted.map((phase, index) => {
				const start = phase.start_date ? formatDate(phase.start_date) : 'N/A';
				const end = phase.end_date ? formatDate(phase.end_date) : 'Forever';
				return [phase.id, `Phase ${index + 1} (${start} → ${end})`];
			}),
		);
	}, [phases]);

	const addDisabled = isAddChargeDisabled || readOnly;
	const isLoading = isParentLoading || isLineItemsQueryLoading;
	const isEmpty = !isLoading && totalLineItems === 0 && !hasActiveFilters;

	if (isEmpty && onAddCharge) {
		return (
			<NoDataCard
				title={t('labels.charges')}
				subtitle='No charges found for this subscription yet'
				cta={<AddButton onClick={onAddCharge} disabled={addDisabled} />}
			/>
		);
	}

	return (
		<Card variant='notched'>
			<QueryBuilder
				filterOptions={SUBSCRIPTION_EDIT_LINE_ITEM_FILTER_OPTIONS}
				filters={filters}
				onFilterChange={setFilters}
				sortOptions={SUBSCRIPTION_EDIT_LINE_ITEM_SORT_OPTIONS}
				selectedSorts={sorts}
				onSortChange={setSorts}
				debounceTime={300}>
				{onAddCharge ? <AddButton onClick={onAddCharge} disabled={addDisabled} /> : null}
			</QueryBuilder>
			<SubscriptionLineItemTable
				data={lineItems}
				isLoading={isLoading}
				onEdit={onEditLineItem}
				onTerminate={onTerminateLineItem}
				hideCardWrapper={true}
				commitmentInfo={commitmentInfo}
				readOnly={readOnly}
				phaseLabelsById={phaseLabelsById}
				showNoDataCard={false}
			/>
			<Spacer className='!h-2' />
			<ShortPagination totalItems={totalLineItems} pageSize={limit} unit='charges' prefix={LINE_ITEMS_PAGINATION_PREFIX} />
		</Card>
	);
};

export default SubscriptionEditChargesSection;
