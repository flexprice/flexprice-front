import { AddButton, Page, ActionButton, Chip } from '@/components/atoms';
import { CreateCustomerDrawer, ApiDocsContent } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { CustomerOrgTypeFilterValue } from '@/constants/customerOrgTypeFilter';
import Customer from '@/models/Customer';
import CustomerApi from '@/api/CustomerApi';
import { useState, useMemo, useCallback, FC } from 'react';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import { extractMetadataFromTypedFilters, METADATA_TYPED_FILTER_FIELD } from '@/types/formatters/QueryBuilder';
import { ENTITY_STATUS } from '@/models';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import { ExternalLink } from 'lucide-react';
import { useCustomerPortalUrl } from '@/hooks/useCustomerPortalUrl';
import { useTenantFeatureAllowlist } from '@/hooks/useTenantFeatureAllowlist';
import { useTranslation } from 'react-i18next';
import { mergeCustomerSearchMetadata } from '@/utils/customer/mergeCustomerSearchMetadata';

const ActionButtonWithPortal: FC<{ customer: Customer; onEdit: (customer: Customer) => void }> = ({ customer, onEdit }) => {
	const { t } = useTranslation(['customers', 'common']);
	const { openInNewTab } = useCustomerPortalUrl(customer.external_id);
	return (
		<ActionButton
			id={customer.id}
			copyId={{ entityType: 'Customer' }}
			deleteMutationFn={(id) => CustomerApi.deleteCustomerById(id)}
			refetchQueryKey='fetchCustomers'
			entityName={t('list.entityName')}
			edit={{
				enabled: customer.status === ENTITY_STATUS.PUBLISHED,
				path: `/billing/customers/edit-customer?id=${customer.id}`,
				onClick: () => onEdit(customer),
			}}
			archive={{
				enabled: customer.status === ENTITY_STATUS.PUBLISHED,
			}}
			customActions={[
				{
					text: t('list.openPortal'),
					icon: <ExternalLink className='h-4 w-4' />,
					onClick: openInNewTab,
				},
			]}
		/>
	);
};

const CustomerListPage = () => {
	const { t } = useTranslation(['customers', 'common']);
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const [activeCustomer, setactiveCustomer] = useState<Customer>();
	const [customerDrawerOpen, setcustomerDrawerOpen] = useState(false);
	const [orgTypeFilter, setOrgTypeFilter] = useState<CustomerOrgTypeFilterValue | null>(null);
	const showOrgTypeFilter = useTenantFeatureAllowlist();
	const navigate = useNavigate();

	const handleCreateCustomer = useCallback(() => {
		setactiveCustomer(undefined);
		setcustomerDrawerOpen(true);
	}, []);

	const handleEdit = useCallback((customer: Customer) => {
		setactiveCustomer(customer);
		setcustomerDrawerOpen(true);
	}, []);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('list.sort.name'),
				direction: SortDirection.ASC,
			},
			{
				field: 'email',
				label: t('list.sort.email'),
				direction: SortDirection.ASC,
			},
			{
				field: 'created_at',
				label: t('list.sort.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'updated_at',
				label: t('list.sort.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('list.filters.name'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'external_id',
				label: t('list.filters.externalId'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'email',
				label: t('list.filters.email'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'created_at',
				label: t('list.filters.createdAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
			{
				field: 'status',
				label: t('list.filters.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: ENTITY_STATUS.PUBLISHED, label: t('common:status.active') },
					{ value: ENTITY_STATUS.ARCHIVED, label: t('common:status.inactive') },
				],
			},
			{
				field: METADATA_TYPED_FILTER_FIELD,
				label: t('list.filters.metadata'),
				fieldType: FilterFieldType.METADATA,
				operators: [FilterOperator.EQUAL],
				dataType: DataType.STRING,
			},
		],
		[t],
	);

	const initialFilters: FilterCondition[] = useMemo(
		() => [
			{
				field: 'name',
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-name',
			},
			{
				field: 'external_id',
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-external-id',
			},
			{
				field: 'status',
				operator: FilterOperator.IN,
				valueArray: [ENTITY_STATUS.PUBLISHED],
				dataType: DataType.ARRAY,
				id: 'initial-status',
			},
		],
		[],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'updated_at',
				label: t('list.sort.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const columns: ColumnData<Customer>[] = useMemo(
		() => [
			{ fieldName: 'name', title: t('list.columns.name'), width: '400px' },
			{ fieldName: 'external_id', title: t('list.columns.externalId') },
			{
				title: t('list.columns.status'),
				render: (row) => {
					const label = row.status === ENTITY_STATUS.PUBLISHED ? t('common:status.active') : t('common:status.inactive');
					return <Chip variant={row.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('list.columns.updatedAt'),
				render: (row) => {
					return <>{formatDate(row.updated_at)}</>;
				},
			},
			{
				title: t('list.columns.actions'),
				fieldVariant: 'interactive',
				render: (row) => <ActionButtonWithPortal customer={row} onEdit={handleEdit} />,
			},
		],
		[handleEdit, t],
	);

	const additionalQueryParams = useMemo(() => ({ orgTypeFilter }), [orgTypeFilter]);

	return (
		<Page
			heading={t('list.title')}
			headingCTA={
				<div className='flex justify-between gap-2 items-center'>
					<CreateCustomerDrawer
						trigger={
							<AddButton
								onClick={() => {
									setactiveCustomer(undefined);
								}}
							/>
						}
						open={customerDrawerOpen}
						onOpenChange={setcustomerDrawerOpen}
						data={activeCustomer}
					/>
				</div>
			}>
			<ApiDocsContent tags={API_DOCS_TAGS.Customers} />
			<QueryableDataArea<Customer>
				queryConfig={{
					filterOptions,
					sortOptions: sortingOptions,
					initialFilters,
					initialSorts,
					debounceTime: 300,
					...(showOrgTypeFilter
						? {
								orgTypeMetadataFilter: {
									value: orgTypeFilter,
									onChange: setOrgTypeFilter,
								},
							}
						: {}),
				}}
				dataConfig={{
					queryKey: 'fetchCustomers',
					additionalQueryParams,
					fetchFn: async (params) => {
						const { orgTypeFilter, filters: rawFilters, sort, limit, offset } = params;
						const { filters, metadata } = extractMetadataFromTypedFilters(rawFilters);
						const mergedMetadata = mergeCustomerSearchMetadata(metadata, orgTypeFilter);
						return CustomerApi.getCustomersByFilters({
							limit,
							offset,
							sort,
							filters,
							...(mergedMetadata ? { metadata: mergedMetadata } : {}),
						});
					},
					probeFetchFn: async (params) =>
						CustomerApi.getCustomersByFilters({
							...params,
							limit: 1,
							offset: 0,
							filters: [],
							sort: [],
						}),
				}}
				tableConfig={{
					columns,
					onRowClick: (row) => {
						navigate(RouteNames.customers + `/${row?.id}`);
					},
					showEmptyRow: true,
				}}
				paginationConfig={{
					unit: t('list.paginationUnit'),
				}}
				emptyStateConfig={{
					heading: t('list.emptyHeading'),
					description: t('list.emptyDescription'),
					buttonLabel: t('list.createCustomer'),
					buttonAction: handleCreateCustomer,
					tags: API_DOCS_TAGS.Customers,
					tutorials: guides.customers.tutorials,
				}}
			/>
		</Page>
	);
};

export default CustomerListPage;
