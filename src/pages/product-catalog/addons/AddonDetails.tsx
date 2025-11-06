import { ActionButton, Button, CardHeader, Chip, Loader, Page, Spacer, NoDataCard } from '@/components/atoms';
import { ApiDocsContent, ColumnData, FlexpriceTable, AddonDrawer, AddEntitlementDrawer, RedirectCell } from '@/components/molecules';
import { DetailsCard } from '@/components/molecules';
import { RouteNames } from '@/core/routes/Routes';
import { Price } from '@/models/Price';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import AddonApi from '@/api/AddonApi';
import EntitlementApi from '@/api/EntitlementApi';
import { getPriceTypeLabel } from '@/utils/common/helper_functions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { EyeOff, Plus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/atoms';
import formatChips from '@/utils/common/format_chips';
import { ChargeValueCell } from '@/components/molecules';
import { BILLING_PERIOD } from '@/constants/constants';
import { ADDON_TYPE } from '@/models/Addon';
import { FEATURE_TYPE } from '@/models/Feature';
import { getFeatureTypeChips } from '@/components/molecules/CustomerUsageTable/CustomerUsageTable';
import { formatAmount } from '@/components/atoms/Input/Input';
import { Entitlement } from '@/models/Entitlement';
import { ENTITY_STATUS } from '@/models/base';
import { ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import { EntitlementResponse } from '@/types/dto';

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

const getEntitlementColumns = (_addonId: string): ColumnData<EntitlementResponse>[] => [
	{
		title: 'Feature Name',
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
					isArchiveDisabled={row?.status === ENTITY_STATUS.ARCHIVED}
					refetchQueryKey={'fetchAddon'}
					entityName={row?.feature?.name}
				/>
			);
		},
	},
];

const getFeatureValue = (entitlement: Entitlement) => {
	const value = entitlement.usage_limit?.toFixed() || '';

	switch (entitlement.feature_type) {
		case FEATURE_TYPE.STATIC:
			return entitlement.static_value;
		case FEATURE_TYPE.METERED:
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
		case FEATURE_TYPE.BOOLEAN:
			return entitlement.is_enabled ? 'Yes' : 'No';
		default:
			return '--';
	}
};

const AddonDetails = () => {
	const navigate = useNavigate();
	const { id } = useParams<Params>();
	const [addonDrawerOpen, setAddonDrawerOpen] = useState(false);
	const [entitlementDrawerOpen, setEntitlementDrawerOpen] = useState(false);

	const {
		data: addonData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchAddon', id],
		queryFn: async () => {
			return await AddonApi.GetAddonById(id!);
		},
		enabled: !!id,
	});

	const { mutate: archiveAddon } = useMutation({
		mutationFn: async () => {
			return await AddonApi.DeleteAddon(id!);
		},
		onSuccess: () => {
			toast.success('Addon archived successfully');
			navigate(RouteNames.addons);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to archive addon');
		},
	});

	const { updateBreadcrumb } = useBreadcrumbsStore();

	useEffect(() => {
		if (addonData?.name) {
			updateBreadcrumb(2, addonData.name);
		}
	}, [addonData, updateBreadcrumb]);

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error loading addon data');
		return null;
	}

	if (!addonData) {
		toast.error('No addon data available');
		return null;
	}

	const addonDetails = [
		{ label: 'Addon Name', value: addonData?.name },
		{ label: 'Lookup Key', value: addonData?.lookup_key },
		{ label: 'Type', value: addonData?.type === ADDON_TYPE.ONETIME ? 'One Time' : 'Multiple' },
		{
			label: 'Status',
			value: (
				<Chip label={formatChips(addonData?.status)} variant={addonData?.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'} />
			),
		},
		{ label: 'Description', value: addonData?.description || '--' },
	];

	return (
		<Page
			heading={addonData?.name}
			headingCTA={
				<>
					<Button onClick={() => setAddonDrawerOpen(true)} variant={'outline'} className='flex gap-2'>
						<Pencil />
						Edit
					</Button>

					<Button onClick={() => archiveAddon()} disabled={addonData?.status !== 'published'} variant={'outline'} className='flex gap-2'>
						<EyeOff />
						Archive
					</Button>
				</>
			}>
			<AddonDrawer data={addonData} open={addonDrawerOpen} onOpenChange={setAddonDrawerOpen} refetchQueryKeys={['fetchAddon']} />
			<AddEntitlementDrawer
				selectedFeatures={addonData.entitlements?.map((v) => v.feature)}
				entitlements={addonData.entitlements}
				entityType={ENTITLEMENT_ENTITY_TYPE.ADDON}
				entityId={addonData.id}
				isOpen={entitlementDrawerOpen}
				onOpenChange={(value) => setEntitlementDrawerOpen(value)}
				refetchQueryKeys={['fetchAddon', 'fetchEntitlements']}
			/>
			<ApiDocsContent tags={['Addons']} />
			<div className='space-y-6'>
				<DetailsCard variant='stacked' title='Addon Details' data={addonDetails} />

				{/* addon charges table */}
				{(addonData?.prices?.length ?? 0) > 0 ? (
					<Card variant='notched'>
						<CardHeader
							title='Charges'
							cta={
								<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.addonCharges.replace(':addonId', id!)}`)}>
									Add
								</Button>
							}
						/>
						<FlexpriceTable columns={chargeColumns} data={addonData?.prices ?? []} />
					</Card>
				) : (
					<NoDataCard
						title='Charges'
						subtitle='No charges added to the addon yet'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.addonCharges.replace(':addonId', id!)}`)}>
								Add
							</Button>
						}
					/>
				)}

				{/* Entitlements Section */}
				{(addonData.entitlements?.length || 0) > 0 ? (
					<Card variant='notched'>
						<CardHeader
							title='Entitlements'
							cta={
								<Button prefixIcon={<Plus />} onClick={() => setEntitlementDrawerOpen(true)}>
									Add
								</Button>
							}
						/>
						<FlexpriceTable showEmptyRow data={addonData.entitlements || []} columns={getEntitlementColumns(addonData.id)} />
					</Card>
				) : (
					<NoDataCard
						title='Entitlements'
						subtitle='No entitlements added to the addon yet'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => setEntitlementDrawerOpen(true)}>
								Add
							</Button>
						}
					/>
				)}

				{addonData.metadata && Object.keys(addonData.metadata).length > 0 && (
					<Card variant='notched'>
						<CardHeader title='Metadata' />
						<div className='p-4'>
							<pre className='text-sm bg-gray-50 p-3 rounded overflow-auto'>{JSON.stringify(addonData.metadata, null, 2)}</pre>
						</div>
					</Card>
				)}

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default AddonDetails;
