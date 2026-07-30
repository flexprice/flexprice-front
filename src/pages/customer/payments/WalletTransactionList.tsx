import WalletApi from '@/api/WalletApi';
import { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { RedirectCell } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import {
	FilterField,
	FilterFieldType,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
} from '@/types/common/QueryBuilder';
import { EXPAND } from '@/models/expand';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { searchUsersForFilter, searchCustomersForFilter } from '@/utils/filterSearchHelpers';
import { WalletTransaction } from '@/models/WalletTransaction';
import { WALLET_TRANSACTION_REASON, WALLET_TRANSACTION_TYPE } from '@/models/Wallet';
import { User } from '@/models/User';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { RouteNames } from '@/core/routes/Routes';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useCallback, useMemo } from 'react';
import useAllUsers from '@/hooks/useAllUsers';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const WALLET_AMOUNT_PRIMARY_ROW_CLASS = 'text-base font-medium';
const WALLET_AMOUNT_SECONDARY_ROW_CLASS = 'text-sm';

const formatAmount = ({
	type,
	amount,
	currency,
	className,
	status,
	creditsSuffix,
}: {
	type: string;
	amount: number;
	currency?: string;
	className?: string;
	status?: string;
	creditsSuffix: string;
}) => {
	const isPending = status?.toLowerCase() === 'pending';
	const colorClass = isPending ? 'text-[#f5c50b]' : type === 'credit' ? 'text-[#2A9D90]' : 'text-[#18181B]';

	return (
		<span className={cn(colorClass, className)}>
			{type === 'credit' ? '+' : '-'}
			{amount}
			{currency ? ` ${getCurrencySymbol(currency)}` : ` ${creditsSuffix}`}
		</span>
	);
};

const WalletTransactionList = () => {
	const { t } = useTranslation(['billing', 'common']);
	const creditsSuffix = t('payments.transactions.creditsSuffix');
	const naLabel = t('common:labels.na');

	const { users } = useAllUsers();

	const userMap = useMemo(() => {
		const map = new Map<string, User>();
		users?.items.forEach((user) => {
			map.set(user.id, user);
		});
		return map;
	}, [users]);

	const formatTransactionTitle = useCallback(
		({ type, reason }: { type: string; reason: string }) => {
			switch (reason) {
				case WALLET_TRANSACTION_REASON.INVOICE_PAYMENT:
					return t('payments.transactions.reasonInvoicePayment');
				case WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT:
					return t('payments.transactions.reasonFreeCreditGrant');
				case WALLET_TRANSACTION_REASON.SUBSCRIPTION_CREDIT_GRANT:
					return t('payments.transactions.reasonSubscriptionCreditGrant');
				case WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_INVOICED:
					return t('payments.transactions.reasonPurchasedCreditInvoiced');
				case WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_DIRECT:
					return t('payments.transactions.reasonPurchasedCreditDirect');
				case WALLET_TRANSACTION_REASON.INVOICE_REFUND:
					return t('payments.transactions.reasonInvoiceRefund');
				case WALLET_TRANSACTION_REASON.CREDIT_EXPIRED:
					return t('payments.transactions.reasonCreditExpired');
				case WALLET_TRANSACTION_REASON.WALLET_TERMINATION:
					return t('payments.transactions.reasonWalletTermination');
				case WALLET_TRANSACTION_REASON.CREDIT_NOTE:
					return t('payments.transactions.reasonCreditNote');
				case WALLET_TRANSACTION_REASON.MANUAL_BALANCE_DEBIT:
					return t('payments.transactions.reasonManualBalanceDebit');
				default:
					return type === 'credit' ? t('payments.transactions.fallbackCredited') : t('payments.transactions.fallbackDebited');
			}
		},
		[t],
	);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'created_at',
				label: t('payments.transactions.sortCreatedAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'amount',
				label: t('payments.transactions.sortAmount'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'customer_id',
				label: t('payments.transactions.filterCustomer'),
				fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				asyncConfig: {
					searchFn: searchCustomersForFilter,
				},
			},
			{
				field: 'type',
				label: t('payments.transactions.filterType'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: WALLET_TRANSACTION_TYPE.CREDIT, label: t('payments.transactions.typeCredit') },
					{ value: WALLET_TRANSACTION_TYPE.DEBIT, label: t('payments.transactions.typeDebit') },
				],
			},
			{
				field: 'created_by',
				label: t('payments.transactions.filterCreatedBy'),
				fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				asyncConfig: {
					searchFn: searchUsersForFilter,
				},
			},
			{
				field: 'created_at',
				label: t('payments.transactions.filterCreatedAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'created_at',
				label: t('payments.transactions.sortCreatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const columns: ColumnData<WalletTransaction>[] = useMemo(
		() => [
			{
				title: t('payments.transactions.columnCustomer'),
				render: (rowData) => {
					if (rowData.customer_id) {
						const customerName = rowData.customer?.name || rowData.customer?.email || rowData.customer_id;
						return <RedirectCell redirectUrl={`${RouteNames.customers}/${rowData.customer_id}`}>{customerName}</RedirectCell>;
					}
					return <span className='text-gray-400'>{naLabel}</span>;
				},
			},
			{
				title: t('payments.transactions.columnTransactionReason'),
				render: (rowData) => formatTransactionTitle({ type: rowData.type, reason: rowData.transaction_reason }),
			},
			{
				title: t('payments.transactions.columnDate'),
				render: (rowData) => <span>{formatDateShort(rowData.created_at)}</span>,
			},
			{
				title: t('payments.transactions.columnCreatedBy'),
				render: (rowData) => {
					if (rowData.created_by) {
						const user = rowData.created_by_user || userMap.get(rowData.created_by);
						if (user) {
							return <span>{user.email || user.name || rowData.created_by}</span>;
						}
						return <span className='text-gray-400 font-mono text-xs'>{rowData.created_by}</span>;
					}
					return <span className='text-gray-400'>{naLabel}</span>;
				},
			},
			{
				title: t('payments.transactions.columnAmount'),
				align: 'right',
				render: (rowData) => {
					return (
						<span className='flex flex-col justify-center items-end'>
							{formatAmount({
								type: rowData.type,
								amount: rowData.amount,
								currency: rowData.currency,
								className: WALLET_AMOUNT_PRIMARY_ROW_CLASS,
								status: rowData.transaction_status,
								creditsSuffix,
							})}
							{rowData.credit_amount > 0 && (
								<span className='text-sm text-gray-500'>
									{formatAmount({
										type: rowData.type,
										amount: rowData.credit_amount,
										className: WALLET_AMOUNT_SECONDARY_ROW_CLASS,
										status: rowData.transaction_status,
										creditsSuffix,
									})}
								</span>
							)}
						</span>
					);
				},
			},
		],
		[userMap, t, naLabel, creditsSuffix, formatTransactionTitle],
	);

	return (
		<QueryableDataArea<WalletTransaction>
			queryConfig={{
				filterOptions,
				sortOptions: sortingOptions,
				initialFilters: [],
				initialSorts,
				debounceTime: 300,
			}}
			dataConfig={{
				queryKey: 'fetchAllWalletTransactionsMain',
				fetchFn: async (params) =>
					WalletApi.getAllWalletTransactionsByFilter({
						...params,
						expand: generateExpandQueryParams([EXPAND.CUSTOMER, EXPAND.CREATED_BY_USER]),
					}),
				probeFetchFn: async (params) =>
					WalletApi.getAllWalletTransactionsByFilter({
						...params,
						limit: 1,
						offset: 0,
						filters: [],
						sort: [],
					}),
			}}
			tableConfig={{
				columns,
				showEmptyRow: true,
			}}
			paginationConfig={{
				unit: t('payments.transactions.paginationUnit'),
				prefix: PAGINATION_PREFIX.WALLET_TRANSACTIONS,
			}}
			emptyStateConfig={{
				heading: t('payments.transactions.emptyHeading'),
				description: t('payments.transactions.emptyDescription'),
				tags: API_DOCS_TAGS.Payments,
			}}
		/>
	);
};

export default WalletTransactionList;
