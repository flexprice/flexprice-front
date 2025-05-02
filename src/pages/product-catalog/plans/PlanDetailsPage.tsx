import { ActionButton, Button, CardHeader, Chip, Loader, Page, Spacer, NoDataCard } from '@/components/atoms';
import { AddEntitlementDrawer, ApiDocsContent, ColumnData, FlexpriceTable, RedirectCell, PlanDrawer } from '@/components/molecules';
import { DetailsCard } from '@/components/molecules';
import { RouteNames } from '@/core/routes/Routes';
import { Price } from '@/models/Price';
import { FeatureType } from '@/models/Feature';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import EntitlementApi, { ExtendedEntitlement } from '@/api/EntitlementApi';
import { PlanApi } from '@/api/PlanApi';
import formatDate from '@/utils/common/format_date';
import { getPriceTypeLabel } from '@/utils/common/helper_functions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { EyeOff, Plus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/atoms';
import formatChips from '@/utils/common/format_chips';
import { getFeatureTypeChips } from '@/components/molecules/CustomerUsageTable/CustomerUsageTable';
import { formatAmount } from '@/components/atoms/Input/Input';
import ChargeValueCell from './ChargeValueCell';
import { BaseEntityStatus } from '@/types/common';
import { BILLING_PERIOD } from '@/core/data/constants';

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
	planId: string;
};

const chargeColumns: ColumnData<Price>[] = [
	{
		title: 'Charge Type',
		render: (row) => {
			return <span>{getPriceTypeLabel(row.type)}</span>;
		},
		fieldVariant: 'title',
	},
	{
		title: 'Feature',
		render(rowData) {
			return <span>{rowData.meter?.name ?? '--'}</span>;
		},
	},
	{
		title: 'Billing timing ',
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

const getFeatureValue = (entitlement: ExtendedEntitlement) => {
	const value = entitlement.usage_limit?.toFixed() || '';

	switch (entitlement.feature_type) {
		case FeatureType.static:
			return entitlement.static_value;
		case FeatureType.metered:
			return (
				<span className='flex items-end gap-1'>
					{formatAmount(value || 'Unlimited')}
					<span className='text-[#64748B] text-sm font-normal font-sans'>
						{value
							? Number(value) > 0
								? entitlement.feature.unit_plural || 'units'
								: entitlement.feature.unit_singular || 'unit'
							: entitlement.feature.unit_plural || 'units'}
					</span>
				</span>
			);
		case FeatureType.boolean:
			return entitlement.is_enabled ? 'Yes' : 'No';
		default:
			return '--';
	}
};

const PlanDetailsPage = () => {
	const navigate = useNavigate();
	const { planId } = useParams<Params>();
	const [drawerOpen, setdrawerOpen] = useState(false);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

	const {
		data: planData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPlan', planId],
		queryFn: async () => {
			return await PlanApi.getPlanById(planId!);
		},
		enabled: !!planId,
	});

	const { mutate: archivePlan } = useMutation({
		mutationFn: async () => {
			return await PlanApi.deletePlan(planId!);
		},
		onSuccess: () => {
			toast.success('Plan archived successfully');
			navigate(RouteNames.plan);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to archive plan');
		},
	});

	const { updateBreadcrumb } = useBreadcrumbsStore();

	useEffect(() => {
		if (planData?.name) {
			updateBreadcrumb(2, planData.name);
		}
	}, [planData, updateBreadcrumb]);

	const columnData: ColumnData<ExtendedEntitlement>[] = [
		{
			title: 'Feature Name',
			fieldVariant: 'title',
			render(row) {
				return <RedirectCell redirectUrl={`${RouteNames.featureDetails}/${row?.feature?.id}`}>{row?.feature?.name}</RedirectCell>;
			},
		},
		{
			title: 'Type',
			render(row) {
				return getFeatureTypeChips({ type: row?.feature_type || '', showIcon: true, showLabel: true });
			},
		},
		{
			title: 'Value',

			render(row) {
				return getFeatureValue(row);
			},
		},
		{
			fieldVariant: 'interactive',
			width: '30px',
			hideOnEmpty: true,
			render(row) {
				return (
					<ActionButton
						deleteMutationFn={async () => {
							return await EntitlementApi.deleteEntitlementById(row?.id);
						}}
						archiveIcon={<Trash2 />}
						archiveText='Delete'
						id={row?.id}
						isEditDisabled={true}
						isArchiveDisabled={row?.status === BaseEntityStatus.ARCHIVED}
						refetchQueryKey={'fetchPlan'}
						entityName={row?.feature?.name}
					/>
				);
			},
		},
	];

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error loading plan data');
		return null;
	}

	if (!planData) {
		toast.error('No plan data available');
		return null;
	}

	const planDetails = [
		{ label: 'Plan Name', value: planData?.name },
		{ label: 'Plan Description', value: planData?.description || '--' },
		{ label: 'Created Date', value: formatDate(planData?.created_at ?? '') },
		{
			label: 'Status',
			value: <Chip label={formatChips(planData?.status)} variant={planData?.status === 'published' ? 'success' : 'default'} />,
		},
	];

	return (
		<Page
			heading={planData?.name}
			headingCTA={
				<>
					<Button onClick={() => setPlanDrawerOpen(true)} variant={'outline'} className='flex gap-2'>
						<Pencil />
						Edit
					</Button>

					<Button onClick={() => archivePlan()} disabled={planData?.status !== 'published'} variant={'outline'} className='flex gap-2'>
						<EyeOff />
						Archive
					</Button>
				</>
			}>
			<PlanDrawer data={planData} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlan']} />
			<ApiDocsContent tags={['Plans']} />
			<AddEntitlementDrawer
				selectedFeatures={planData.entitlements?.map((v) => v.feature)}
				entitlements={planData.entitlements}
				planId={planData.id}
				isOpen={drawerOpen}
				onOpenChange={(value) => setdrawerOpen(value)}
			/>

			<div className='space-y-6'>
				<DetailsCard variant='stacked' title='Plan Details' data={planDetails} />

				{/* plan charges table */}
				{(planData?.prices?.length ?? 0) > 0 ? (
					<Card variant='notched'>
						<CardHeader
							title='Charges'
							cta={
								<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.plan}/${planId}/add-charges`)}>
									Add
								</Button>
							}
						/>
						<FlexpriceTable columns={chargeColumns} data={planData?.prices ?? []} />
					</Card>
				) : (
					<NoDataCard
						title='Charges'
						subtitle='No charges added to the plan yet'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.plan}/${planId}/add-charges`)}>
								Add
							</Button>
						}
					/>
				)}

				{planData.entitlements?.length || 0 > 0 ? (
					<Card variant='notched'>
						<CardHeader
							title='Entitlements'
							cta={
								<Button prefixIcon={<Plus />} onClick={() => setdrawerOpen(true)}>
									Add
								</Button>
							}
						/>
						<FlexpriceTable showEmptyRow data={planData.entitlements || []} columns={columnData} />
					</Card>
				) : (
					<NoDataCard
						title='Entitlements'
						subtitle='No entitlements added to the plan yet'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => setdrawerOpen(true)}>
								Add
							</Button>
						}
					/>
				)}
				<Spacer className='!h-10' />
			</div>
		</Page>
	);
};

export default PlanDetailsPage;
