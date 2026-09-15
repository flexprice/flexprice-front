import { ActionButton, Button, CardHeader, Chip, Loader, Page, Spacer, NoDataCard, Tooltip } from '@/components/atoms';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import {
	ApiDocsContent,
	ColumnData,
	FlexpriceTable,
	AddonDrawer,
	AddEntitlementDrawer,
	RedirectCell,
	DetailsCard,
	AddonCreditGrantsSection,
	DropdownMenu,
	TerminatePriceModal,
	UpdatePriceDialog,
	UpdatePriceDetailsDrawer,
} from '@/components/molecules';
import { Dialog } from '@/components/ui';
import { PriceApi } from '@/api/PriceApi';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { DeletePriceRequest } from '@/types/dto';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { RouteNames } from '@/core/routes/Routes';
import { Price } from '@/models/Price';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import AddonApi from '@/api/AddonApi';
import EntitlementApi from '@/api/EntitlementApi';
import { copyToClipboard, getPriceTypeLabel } from '@/utils/common/helper_functions';
import { ChargeActionHandlers } from '@/types/common';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, EyeOff, FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { Card } from '@/components/atoms';
import formatChips from '@/utils/common/format_chips';
import { ChargeValueCell } from '@/components/molecules';
import { BILLING_PERIOD } from '@/constants/constants';
import { getFeatureTypeChips } from '@/components/molecules/CustomerUsageTable/CustomerUsageTable';
import { ENTITY_STATUS } from '@/models';
import { ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import { EntitlementResponse } from '@/types/dto';
import type { TFunction } from 'i18next';
import { formatAllowanceValue, formatAllowanceReset, isParallelAllowance } from '@/utils/entitlement/allowanceLabel';

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

const ChargeRowMenu = ({ row, onEditPrice, onEditDetails, onTerminatePrice, canWritePrice }: ChargeActionHandlers & { row: Price }) => {
	const [isOpen, setIsOpen] = useState(false);
	const actionsDisabled = !!row.end_date || !canWritePrice;

	return (
		<div
			data-interactive='true'
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setIsOpen(!isOpen);
			}}>
			<DropdownMenu
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				options={[
					{
						label: 'Copy Price ID',
						icon: <Copy />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							void copyToClipboard(row.id, 'Price ID copied to clipboard').catch(() => undefined);
						},
					},
					{
						label: 'Update Price',
						icon: <Pencil />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							onEditPrice(row);
						},
						disabled: actionsDisabled,
					},
					{
						label: 'Edit Details',
						icon: <FileText />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							onEditDetails(row);
						},
						disabled: actionsDisabled,
					},
					{
						label: 'Terminate Price',
						icon: <Trash2 />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							onTerminatePrice(row);
						},
						disabled: actionsDisabled,
					},
				]}
			/>
		</div>
	);
};

const getChargeColumns = (naLabel: string, handlers: ChargeActionHandlers): ColumnData<Price>[] => [
	{
		title: 'Display Name',
		render(rowData) {
			return <span>{rowData.display_name ?? naLabel}</span>;
		},
	},
	{
		title: 'Charge Type',
		render: (row) => {
			return <span>{getPriceTypeLabel(row.type)}</span>;
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
	{
		fieldVariant: 'interactive',
		width: '30px',
		hideOnEmpty: true,
		render(rowData) {
			return <ChargeRowMenu row={rowData} {...handlers} />;
		},
	},
];

const getEntitlementColumns = (
	_addonId: string,
	t: TFunction<'catalog'>,
	canWriteEntitlement: boolean,
	entitlementWriteDeniedTooltip: string,
): ColumnData<EntitlementResponse>[] => [
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
			return (
				<span className='flex items-center gap-2'>
					<span>{formatAllowanceValue(row, t)}</span>
					{isParallelAllowance(row) && <Chip variant='default' label={t('entitlements.allowance.separateAllowances')} />}
				</span>
			);
		},
	},
	{
		title: 'Usage Reset',
		render(row) {
			return <span className='capitalize'>{formatAllowanceReset(row, t)}</span>;
		},
	},
	{
		fieldVariant: 'interactive',
		width: '30px',
		hideOnEmpty: true,
		render(row) {
			return (
				<ActionButton
					id={row?.id}
					copyId={{ entityType: 'Entitlement' }}
					deleteMutationFn={async () => {
						return await EntitlementApi.delete(row?.id);
					}}
					refetchQueryKey='fetchAddon'
					entityName={row?.feature?.name}
					edit={{ enabled: false }}
					archive={{
						enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
						text: 'Delete',
						icon: <Trash2 />,
						disabled: !canWriteEntitlement,
						disabledReason: canWriteEntitlement ? undefined : entitlementWriteDeniedTooltip,
					}}
				/>
			);
		},
	},
];

const AddonDetails = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const navigate = useNavigate();
	const { id } = useParams<Params>();
	const [addonDrawerOpen, setAddonDrawerOpen] = useState(false);
	const [entitlementDrawerOpen, setEntitlementDrawerOpen] = useState(false);
	const { can } = useCurrentUserPermissions();
	const canWriteAddon = can('addon', 'write');
	const canWriteEntitlement = can('entitlement', 'write');
	const canWritePrice = can('price', 'write');
	const [selectedPriceForEdit, setSelectedPriceForEdit] = useState<Price | null>(null);
	const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
	const [selectedPriceForDetailsEdit, setSelectedPriceForDetailsEdit] = useState<Price | null>(null);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedPriceForTermination, setSelectedPriceForTermination] = useState<Price | null>(null);
	const [showTerminateModal, setShowTerminateModal] = useState(false);

	const {
		data: addonData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchAddon', id],
		queryFn: async () => {
			return await AddonApi.Get(id!);
		},
		enabled: !!id,
	});

	const { mutate: archiveAddon } = useMutation({
		mutationFn: async () => {
			return await AddonApi.Delete(id!);
		},
		onSuccess: () => {
			toast.success('Addon archived successfully');
			navigate(RouteNames.addons);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to archive addon');
		},
	});

	const { updateBreadcrumb } = useBreadcrumbsStore();

	useEffect(() => {
		if (addonData?.name) {
			updateBreadcrumb(2, addonData.name);
		}
	}, [addonData, updateBreadcrumb]);

	const { mutateAsync: deletePrice, isPending: isDeletingPrice } = useMutation({
		mutationFn: async ({ priceId, data }: { priceId: string; data?: DeletePriceRequest }) => {
			return await PriceApi.DeletePrice(priceId, data);
		},
		onSuccess: () => {
			void refetchQueries(['fetchAddon']);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Error terminating price');
		},
	});

	const handleEditPrice = useCallback((price: Price) => {
		setSelectedPriceForEdit(price);
		setIsPriceDialogOpen(true);
	}, []);

	const handleEditDetails = useCallback((price: Price) => {
		setSelectedPriceForDetailsEdit(price);
		setIsDetailsDrawerOpen(true);
	}, []);

	const handleTerminatePrice = useCallback((price: Price) => {
		setSelectedPriceForTermination(price);
		setShowTerminateModal(true);
	}, []);

	const handlePriceUpdateSuccess = useCallback(() => {
		setIsPriceDialogOpen(false);
		setSelectedPriceForEdit(null);
		void refetchQueries(['fetchAddon']);
	}, []);

	const handleTerminateConfirm = useCallback(
		async (endDate: string | undefined) => {
			if (!selectedPriceForTermination) return;
			try {
				await deletePrice({ priceId: selectedPriceForTermination.id, data: endDate ? { end_date: endDate } : undefined });
				toast.success('Price terminated successfully');
				setShowTerminateModal(false);
				setSelectedPriceForTermination(null);
			} catch {
				// onError already surfaced the failure; keep the modal open so the user can retry.
			}
		},
		[selectedPriceForTermination, deletePrice],
	);

	const chargeColumns = useMemo(
		() =>
			getChargeColumns(t('common:labels.na'), {
				onEditPrice: handleEditPrice,
				onEditDetails: handleEditDetails,
				onTerminatePrice: handleTerminatePrice,
				canWritePrice,
			}),
		[t, handleEditPrice, handleEditDetails, handleTerminatePrice, canWritePrice],
	);

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

	const addChargeCta = canWritePrice ? (
		<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.addonCharges.replace(':addonId', id!)}`)}>
			{t('common:actions.add')}
		</Button>
	) : (
		<Tooltip content={t('catalog:addons.details.chargesWriteDeniedTooltip')}>
			<span tabIndex={0} className='inline-block'>
				<Button disabled prefixIcon={<Plus />}>
					{t('common:actions.add')}
				</Button>
			</span>
		</Tooltip>
	);

	const addEntitlementCta = canWriteEntitlement ? (
		<Button prefixIcon={<Plus />} onClick={() => setEntitlementDrawerOpen(true)}>
			{t('common:actions.add')}
		</Button>
	) : (
		<Tooltip content={t('catalog:plans.entitlementsTab.writeDeniedTooltip')}>
			<span tabIndex={0} className='inline-block'>
				<Button disabled prefixIcon={<Plus />}>
					{t('common:actions.add')}
				</Button>
			</span>
		</Tooltip>
	);

	const addonDetails = [
		{ label: 'Addon Name', value: addonData?.name },
		{ label: 'Lookup Key', value: addonData?.lookup_key },
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
			documentTitle={addonData?.name}
			heading={addonData?.name}
			headingCTA={
				<>
					{canWriteAddon ? (
						<Button onClick={() => setAddonDrawerOpen(true)} variant={'outline'} className='flex gap-2'>
							<Pencil />
							Edit
						</Button>
					) : (
						<Tooltip content={t('catalog:addons.writeDeniedTooltip')}>
							<span tabIndex={0} className='inline-block'>
								<Button disabled variant={'outline'} className='flex gap-2'>
									<Pencil />
									Edit
								</Button>
							</span>
						</Tooltip>
					)}

					{canWriteAddon ? (
						<Button
							onClick={() => archiveAddon()}
							disabled={addonData?.status !== ENTITY_STATUS.PUBLISHED}
							variant={'outline'}
							className='flex gap-2'>
							<EyeOff />
							Archive
						</Button>
					) : (
						<Tooltip content={t('catalog:addons.writeDeniedTooltip')}>
							<span tabIndex={0} className='inline-block'>
								<Button disabled variant={'outline'} className='flex gap-2'>
									<EyeOff />
									Archive
								</Button>
							</span>
						</Tooltip>
					)}
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
			<ApiDocsContent tags={API_DOCS_TAGS.Addons} />

			{/* Update Price Dialog (critical fields — versioned update) */}
			{selectedPriceForEdit && (
				<UpdatePriceDialog
					isOpen={isPriceDialogOpen}
					onOpenChange={setIsPriceDialogOpen}
					price={selectedPriceForEdit}
					planId={addonData.id}
					onSuccess={handlePriceUpdateSuccess}
				/>
			)}

			{/* Update Price Details Drawer (non-critical fields) */}
			{selectedPriceForDetailsEdit && (
				<UpdatePriceDetailsDrawer
					price={selectedPriceForDetailsEdit}
					open={isDetailsDrawerOpen}
					onOpenChange={setIsDetailsDrawerOpen}
					refetchQueryKeys={['fetchAddon']}
				/>
			)}

			{/* Terminate Price Modal */}
			<Dialog open={showTerminateModal} onOpenChange={setShowTerminateModal}>
				{selectedPriceForTermination && (
					<TerminatePriceModal
						planId={addonData.id}
						price={selectedPriceForTermination}
						onCancel={() => {
							setShowTerminateModal(false);
							setSelectedPriceForTermination(null);
						}}
						onConfirm={handleTerminateConfirm}
						isLoading={isDeletingPrice}
					/>
				)}
			</Dialog>
			<div className='space-y-6'>
				<DetailsCard variant='stacked' title={t('catalog:addons.details.title')} data={addonDetails} />

				{/* addon charges table */}
				{(addonData?.prices?.length ?? 0) > 0 ? (
					<Card variant='notched'>
						<CardHeader title={t('catalog:addons.details.charges')} cta={addChargeCta} />
						<FlexpriceTable columns={chargeColumns} data={addonData?.prices ?? []} />
					</Card>
				) : (
					<NoDataCard title={t('catalog:addons.details.charges')} subtitle='No charges added to the addon yet' cta={addChargeCta} />
				)}

				{/* Entitlements Section */}
				{(addonData?.entitlements?.length ?? 0) > 0 ? (
					<Card variant='notched'>
						<CardHeader title={t('catalog:addons.details.entitlements')} cta={addEntitlementCta} />
						<FlexpriceTable
							showEmptyRow
							data={addonData.entitlements || []}
							columns={getEntitlementColumns(addonData.id, t, canWriteEntitlement, t('catalog:plans.entitlementsTab.writeDeniedTooltip'))}
						/>
					</Card>
				) : (
					<NoDataCard
						title={t('catalog:addons.details.entitlements')}
						subtitle='No entitlements added to the addon yet'
						cta={addEntitlementCta}
					/>
				)}

				{/* Credit Grants Section */}
				<AddonCreditGrantsSection addonId={addonData.id} />

				{addonData.metadata && Object.keys(addonData.metadata).length > 0 && (
					<Card variant='notched'>
						<CardHeader title={t('catalog:addons.details.metadata')} />
						<div className='p-4'>
							<pre className='text-sm bg-surface-subtle p-3 rounded overflow-auto'>{JSON.stringify(addonData.metadata, null, 2)}</pre>
						</div>
					</Card>
				)}

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default AddonDetails;
