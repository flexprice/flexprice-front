import { Button, CardHeader, Chip, Loader, Page, ShortPagination, Spacer, NoDataCard } from '@/components/atoms';
import { ApiDocsContent, ColumnData, FlexpriceTable, CostSheetDrawer } from '@/components/molecules';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { DetailsCard } from '@/components/molecules';
import { RouteNames } from '@/core/routes/Routes';
import { Price } from '@/models/Price';
import { ENTITY_STATUS } from '@/models';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import CostSheetApi from '@/api/CostSheetApi';
import { PriceApi } from '@/api/PriceApi';
import { PRICE_ENTITY_TYPE } from '@/models/Price';
import { getPriceTypeLabel } from '@/utils/common/helper_functions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { EyeOff, Plus, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import { Card } from '@/components/atoms';
import formatChips from '@/utils/common/format_chips';
import { ChargeValueCell } from '@/components/molecules';
import { BILLING_PERIOD } from '@/constants/constants';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';

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

const chargeColumns: ColumnData<Price>[] = [
	{
		title: 'Charge Type',
		render: (row) => {
			return <span>{getPriceTypeLabel(row.type)}</span>;
		},
	},
	{
		title: 'Feature',
		render(rowData) {
			return <span>{rowData.meter?.name ?? '--'}</span>;
		},
	},
	{
		title: 'Billing Timing',
		render(rowData) {
			return <span>{formatInvoiceCadence(rowData.invoice_cadence as string)}</span>;
		},
	},
	{
		title: 'Billing Period',
		render(rowData) {
			return <span>{formatBillingPeriod(rowData.billing_period as string)}</span>;
		},
	},
	{
		title: 'Value',
		render(rowData) {
			return <ChargeValueCell data={rowData} />;
		},
	},
];

const CostSheetDetails = () => {
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
	const { limit, offset } = usePagination({
		initialLimit: 10,
		prefix: PAGINATION_PREFIX.COST_SHEET_CHARGES,
	});

	const { data: pricesResponse, isLoading: pricesLoading } = useQuery({
		queryKey: ['costSheetCharges', id, limit, offset],
		queryFn: () =>
			PriceApi.searchPrices({
				filters: [
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
				limit,
				offset,
			}),
		enabled: !!id && !!costSheetData,
	});

	useEffect(() => {
		if (costSheetData?.name) {
			updateBreadcrumb(2, costSheetData.name);
		}
	}, [costSheetData, updateBreadcrumb]);

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

	const costSheetDetails = [
		{ label: 'Cost Sheet Name', value: costSheetData?.name },
		{ label: 'Lookup Key', value: costSheetData?.lookup_key },
		{
			label: 'Status',
			value: (
				<Chip
					label={formatChips(costSheetData?.status)}
					variant={costSheetData?.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'}
				/>
			),
		},
		{ label: 'Description', value: costSheetData?.description || '--' },
	];

	return (
		<Page
			documentTitle={costSheetData?.name}
			heading={costSheetData?.name}
			headingCTA={
				<>
					<Button onClick={() => setCostSheetDrawerOpen(true)} variant={'outline'} className='flex gap-2'>
						<Pencil />
						Edit
					</Button>

					<Button
						onClick={() => archiveCostSheet()}
						disabled={costSheetData?.status !== ENTITY_STATUS.PUBLISHED}
						variant={'outline'}
						className='flex gap-2'>
						<EyeOff />
						Archive
					</Button>
				</>
			}>
			<CostSheetDrawer
				data={costSheetData}
				open={costSheetDrawerOpen}
				onOpenChange={setCostSheetDrawerOpen}
				refetchQueryKeys={['fetchCostSheet', 'costSheetCharges']}
			/>
			<ApiDocsContent tags={[...API_DOCS_TAGS.Costs]} />
			<div className='space-y-6'>
				<DetailsCard variant='stacked' title='Cost Sheet Details' data={costSheetDetails} />

				{/* cost sheet charges table (prices from Price API by cost sheet id) */}
				{pricesLoading ? (
					<Card variant='notched'>
						<CardHeader title='Charges' />
						<div className='p-8 flex justify-center'>
							<Loader />
						</div>
					</Card>
				) : (pricesResponse?.pagination?.total ?? 0) > 0 ? (
					<Card variant='notched'>
						<CardHeader
							title='Charges'
							cta={
								<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.costSheetCharges.replace(':costSheetId', id!)}`)}>
									Add
								</Button>
							}
						/>
						<FlexpriceTable columns={chargeColumns} data={pricesResponse?.items ?? []} />
						<ShortPagination
							unit='charges'
							totalItems={pricesResponse?.pagination?.total ?? 0}
							prefix={PAGINATION_PREFIX.COST_SHEET_CHARGES}
						/>
					</Card>
				) : (
					<NoDataCard
						title='Charges'
						subtitle='No charges added to the cost sheet yet'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.costSheetCharges.replace(':costSheetId', id!)}`)}>
								Add
							</Button>
						}
					/>
				)}

				{costSheetData.metadata && Object.keys(costSheetData.metadata).length > 0 && (
					<Card variant='notched'>
						<CardHeader title='Metadata' />
						<div className='p-4'>
							<pre className='text-sm bg-gray-50 p-3 rounded overflow-auto'>{JSON.stringify(costSheetData.metadata, null, 2)}</pre>
						</div>
					</Card>
				)}

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default CostSheetDetails;
