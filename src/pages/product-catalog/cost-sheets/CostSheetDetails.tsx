import { Button, CardHeader, Chip, Loader, Page, ShortPagination, Spacer, NoDataCard, Input, Tooltip } from '@/components/atoms';
import { ApiDocsContent, ColumnData, FlexpriceTable, CostSheetDrawer, DetailsCard, QueryBuilder } from '@/components/molecules';
import type { Detail } from '@/components/molecules/DetailsCard/DetailsCard';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import useFilterSorting from '@/hooks/useFilterSorting';
import { RouteNames } from '@/core/routes/Routes';
import { Price } from '@/models/Price';
import { ENTITY_STATUS } from '@/models';
import { PRICE_TYPE, PRICE_ENTITY_TYPE } from '@/models/Price';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import CostSheetApi from '@/api/CostSheetApi';
import { PriceApi } from '@/api/PriceApi';
import { getPriceTypeLabel } from '@/utils/common/helper_functions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { EyeOff, Plus, Pencil, Search } from 'lucide-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { Card } from '@/components/atoms';
import formatChips from '@/utils/common/format_chips';
import { ChargeValueCell } from '@/components/molecules';
import { BILLING_PERIOD } from '@/constants/constants';
import { cn } from '@/lib/utils';
import {
	DataType,
	FilterCondition,
	FilterField,
	FilterFieldType,
	FilterOperator,
	SortDirection,
	SortOption,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
} from '@/types/common/QueryBuilder';

const formatBillingPeriod = (billingPeriod: string) => {
	switch (billingPeriod.toUpperCase()) {
		case BILLING_PERIOD.DAILY:
			return 'Daily';
		case BILLING_PERIOD.WEEKLY:
			return 'Weekly';
		case BILLING_PERIOD.MONTHLY:
			return 'Monthly';
		case BILLING_PERIOD.ANNUAL:
			return 'Yearly';
		case BILLING_PERIOD.QUARTERLY:
			return 'Quarterly';
		case BILLING_PERIOD.HALF_YEARLY:
			return 'Half Yearly';
		case BILLING_PERIOD.ONETIME:
			return 'One-time';
		default:
			return '--';
	}
};

const formatInvoiceCadence = (cadence: string): string => {
	switch (cadence.toUpperCase()) {
		case 'ADVANCE':
			return 'Advance';
		case 'ARREAR':
			return 'Arrear';
		default:
			return '';
	}
};

type Params = {
	id: string;
};

const CHARGE_SORT_OPTIONS: SortOption[] = [
	{ field: 'display_name', label: 'Name', direction: SortDirection.ASC },
	{ field: 'created_at', label: 'Created At', direction: SortDirection.DESC },
	{ field: 'updated_at', label: 'Updated At', direction: SortDirection.DESC },
];

const CHARGE_FILTER_OPTIONS: FilterField[] = [
	{
		field: 'display_name',
		label: 'Name',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'type',
		label: 'Charge Type',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
		dataType: DataType.ARRAY,
		options: [
			{ value: PRICE_TYPE.FIXED, label: 'Fixed' },
			{ value: PRICE_TYPE.USAGE, label: 'Usage' },
		],
	},
	{
		field: 'billing_period',
		label: 'Billing Period',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
		dataType: DataType.ARRAY,
		options: [
			{ value: BILLING_PERIOD.MONTHLY, label: 'Monthly' },
			{ value: BILLING_PERIOD.ANNUAL, label: 'Yearly' },
			{ value: BILLING_PERIOD.QUARTERLY, label: 'Quarterly' },
			{ value: BILLING_PERIOD.WEEKLY, label: 'Weekly' },
			{ value: BILLING_PERIOD.DAILY, label: 'Daily' },
			{ value: BILLING_PERIOD.HALF_YEARLY, label: 'Half Yearly' },
			{ value: BILLING_PERIOD.ONETIME, label: 'One-time' },
		],
	},
];

const INITIAL_CHARGE_FILTERS: FilterCondition[] = [
	{ field: 'display_name', operator: FilterOperator.CONTAINS, valueString: '', dataType: DataType.STRING, id: 'cs-charge-name' },
];

const TruncatedText: FC<{ text: string; className?: string }> = ({ text, className }) => (
	<Tooltip content={text} side='top' align='start'>
		<span className={cn('block max-w-full truncate', className)}>{text}</span>
	</Tooltip>
);

const getChargeColumns = (naLabel: string, t: (key: string) => string): ColumnData<Price>[] => [
	{
		title: t('catalog:costSheets.details.columns.feature'),
		width: '36%',
		className: 'min-w-0',
		render(rowData) {
			const label = rowData.display_name ?? naLabel;
			return <TruncatedText text={label} className='text-sm text-foreground' />;
		},
	},
	{
		title: t('catalog:costSheets.details.columns.chargeType'),
		width: 128,
		render: (row) => <span className='whitespace-nowrap text-muted-foreground'>{getPriceTypeLabel(row.type)}</span>,
	},
	{
		title: t('catalog:costSheets.details.columns.billingTiming'),
		width: 112,
		render(rowData) {
			const cadence = formatInvoiceCadence(rowData.invoice_cadence as string);
			return <span className='whitespace-nowrap text-muted-foreground'>{cadence || naLabel}</span>;
		},
	},
	{
		title: t('catalog:costSheets.details.columns.billingPeriod'),
		width: 112,
		render(rowData) {
			return <span className='whitespace-nowrap text-muted-foreground'>{formatBillingPeriod(rowData.billing_period as string)}</span>;
		},
	},
	{
		title: t('catalog:costSheets.details.columns.value'),
		width: 148,
		align: 'right',
		render(rowData) {
			return (
				<div className='flex justify-end tabular-nums'>
					<ChargeValueCell data={rowData} />
				</div>
			);
		},
	},
];

const CostSheetDetails = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const navigate = useNavigate();
	const { id } = useParams<Params>();
	const [costSheetDrawerOpen, setCostSheetDrawerOpen] = useState(false);

	const {
		data: costSheetData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchCostSheet', id],
		queryFn: async () => {
			return await CostSheetApi.GetCostSheetById(id!);
		},
		enabled: !!id,
	});

	const { mutate: archiveCostSheet } = useMutation({
		mutationFn: async () => {
			return await CostSheetApi.DeleteCostSheet(id!);
		},
		onSuccess: () => {
			toast.success('Cost Sheet archived successfully');
			navigate(RouteNames.costSheets);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to archive cost sheet');
		},
	});

	const { updateBreadcrumb } = useBreadcrumbsStore();
	const { limit, offset, reset } = usePagination({
		initialLimit: 10,
		prefix: PAGINATION_PREFIX.COST_SHEET_CHARGES,
	});

	const { filters, setFilters, sorts, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: INITIAL_CHARGE_FILTERS,
		debounceTime: 500,
		onFilterChange: () => reset(),
		onSortChange: () => reset(),
	});

	const searchTerm = useMemo(() => filters.find((f) => f.field === 'display_name')?.valueString ?? '', [filters]);

	const hasActiveChargeFilters = useMemo(() => {
		if (searchTerm.trim()) return true;
		return filters.some((f) => {
			if (f.field === 'display_name') return false;
			if (f.valueArray && f.valueArray.length > 0) return true;
			return Boolean(f.valueString?.trim());
		});
	}, [filters, searchTerm]);

	const handleSearch = useCallback(
		(value: string) => {
			setFilters((prev) => prev.map((f) => (f.field === 'display_name' ? { ...f, valueString: value } : f)));
			reset();
		},
		[setFilters, reset],
	);

	const baseFilters = useMemo(
		() => [
			{
				field: 'entity_type',
				operator: FilterOperator.EQUAL,
				data_type: DataType.STRING,
				value: { string: PRICE_ENTITY_TYPE.COST_SHEET },
			},
			{
				field: 'entity_id',
				operator: FilterOperator.EQUAL,
				data_type: DataType.STRING,
				value: { string: id! },
			},
		],
		[id],
	);

	const mergedFilters = useMemo(() => [...baseFilters, ...sanitizedFilters], [baseFilters, sanitizedFilters]);

	const { data: pricesResponse, isLoading: pricesLoading } = useQuery({
		queryKey: ['costSheetCharges', id, limit, offset, mergedFilters, sanitizedSorts],
		queryFn: () =>
			PriceApi.searchPrices({
				filters: mergedFilters,
				sorts: sanitizedSorts,
				limit,
				offset,
			}),
		enabled: !!id && !!costSheetData,
	});

	const totalCharges = pricesResponse?.pagination?.total ?? 0;
	const showChargesSection = pricesLoading || totalCharges > 0 || hasActiveChargeFilters;

	useEffect(() => {
		if (costSheetData?.name) {
			updateBreadcrumb(2, costSheetData.name);
		}
	}, [costSheetData, updateBreadcrumb]);

	const chargeColumns = useMemo(() => getChargeColumns(t('common:labels.na'), t), [t]);

	const handleAddCharges = useCallback(() => {
		navigate(`${RouteNames.costSheetCharges.replace(':costSheetId', id!)}`);
	}, [navigate, id]);

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error loading cost sheet data');
		return null;
	}

	if (!costSheetData) {
		toast.error('No cost sheet data available');
		return null;
	}

	const costSheetDetails: Detail[] = [
		{ label: t('catalog:costSheets.details.fields.costSheetName'), value: costSheetData.name },
		{ label: t('catalog:costSheets.details.fields.lookupKey'), value: costSheetData.lookup_key },
		{
			label: t('catalog:costSheets.details.fields.status'),
			value: (
				<Chip
					label={formatChips(costSheetData.status)}
					variant={costSheetData.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'}
				/>
			),
		},
		{ label: t('catalog:costSheets.details.fields.description'), value: costSheetData.description || '--' },
	];

	return (
		<Page
			documentTitle={costSheetData.name}
			heading={costSheetData.name}
			headingCTA={
				<div className='flex flex-wrap items-center gap-2'>
					<Button onClick={() => setCostSheetDrawerOpen(true)} variant='outline' prefixIcon={<Pencil />}>
						{t('common:actions.edit')}
					</Button>
					<Button
						onClick={() => archiveCostSheet()}
						disabled={costSheetData.status !== ENTITY_STATUS.PUBLISHED}
						variant='outline'
						prefixIcon={<EyeOff />}>
						{t('common:actions.archive')}
					</Button>
				</div>
			}>
			<CostSheetDrawer
				data={costSheetData}
				open={costSheetDrawerOpen}
				onOpenChange={setCostSheetDrawerOpen}
				refetchQueryKeys={['fetchCostSheet', 'costSheetCharges']}
			/>
			<ApiDocsContent tags={API_DOCS_TAGS.Costs} />
			<div className='space-y-6'>
				<DetailsCard variant='stacked' title={t('catalog:costSheets.details.title')} data={costSheetDetails} />

				{showChargesSection ? (
					<Card noPadding className='card bg-surface overflow-hidden'>
						<CardHeader
							title={t('catalog:costSheets.details.charges')}
							cta={
								<Button prefixIcon={<Plus />} onClick={handleAddCharges}>
									{t('common:actions.add')}
								</Button>
							}
						/>

						<div className='mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
							<div className='relative w-full lg:max-w-sm'>
								<Search className='pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
								<Input
									type='search'
									placeholder={t('catalog:costSheets.details.searchCharges')}
									value={searchTerm}
									onChange={handleSearch}
									className='ps-9'
								/>
							</div>
							<QueryBuilder
								filterOptions={CHARGE_FILTER_OPTIONS}
								filters={filters}
								onFilterChange={setFilters}
								sortOptions={CHARGE_SORT_OPTIONS}
								selectedSorts={sorts}
								onSortChange={setSorts}
							/>
						</div>

						{pricesLoading ? (
							<div className='flex justify-center py-12'>
								<Loader />
							</div>
						) : (
							<>
								<FlexpriceTable
									columns={chargeColumns}
									data={pricesResponse?.items ?? []}
									showEmptyRow
									tableClassName='table-fixed w-full'
								/>
								<div className='pt-2'>
									<ShortPagination unit='charges' totalItems={totalCharges} prefix={PAGINATION_PREFIX.COST_SHEET_CHARGES} />
								</div>
							</>
						)}
					</Card>
				) : (
					<NoDataCard
						title={t('catalog:costSheets.details.charges')}
						subtitle={t('catalog:costSheets.details.noChargesSubtitle')}
						cta={
							<Button prefixIcon={<Plus />} onClick={handleAddCharges}>
								{t('common:actions.add')}
							</Button>
						}
					/>
				)}

				{costSheetData.metadata && Object.keys(costSheetData.metadata).length > 0 && (
					<Card variant='notched'>
						<CardHeader title={t('catalog:costSheets.details.metadata')} />
						<div className='p-4 pt-0'>
							<pre className='overflow-auto rounded-md bg-muted/40 p-3 text-xs text-muted-foreground'>
								{JSON.stringify(costSheetData.metadata, null, 2)}
							</pre>
						</div>
					</Card>
				)}

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default CostSheetDetails;
