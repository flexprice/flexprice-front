import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Chip, Button, Card, CardHeader, NoDataCard, Loader, Sheet, Tooltip } from '@/components/atoms';
import { Plus } from 'lucide-react';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import JsonCodeBlock from '@/components/molecules/Events/JsonCodeBlock';
import { EntitlementApi } from '@/api';
import { FlexpriceTable, ColumnData, RedirectCell, AddEntitlementDrawer } from '@/components/molecules';
import { formatAllowanceValue, formatAllowanceReset, isParallelAllowance } from '@/utils/entitlement/allowanceLabel';
import { getFeatureTypeChips } from '@/components/molecules/CustomerUsageTable/CustomerUsageTable';
import { ENTITY_STATUS, FEATURE_TYPE, ENTITLEMENT_ENTITY_TYPE, EXPAND } from '@/models';
import { EntitlementResponse } from '@/types';
import { RouteNames } from '@/core/routes/Routes';
import { ActionButton } from '@/components/atoms';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { useTranslation } from 'react-i18next';
import { JsonObject } from '@/types/common';

const PlanEntitlementsTab = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const { can } = useCurrentUserPermissions();
	const canWriteEntitlement = can('entitlement', 'write');
	const { planId } = useParams<{ planId: string }>();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [configSheet, setConfigSheet] = useState<{ open: boolean; name: string; value: JsonObject | null }>({
		open: false,
		name: '',
		value: null,
	});
	const openConfigSheet = (name: string, value: JsonObject | null) => {
		setConfigSheet({ open: true, name, value });
	};

	const {
		data: entitlementsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['planEntitlements', planId],
		queryFn: async () => {
			return await EntitlementApi.search({
				entity_ids: [planId!],
				entity_type: ENTITLEMENT_ENTITY_TYPE.PLAN,
				expand: generateExpandQueryParams([EXPAND.FEATURES]),
				status: ENTITY_STATUS.PUBLISHED,
			});
		},
		enabled: !!planId,
	});

	const columnData: ColumnData<EntitlementResponse>[] = [
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
				// Config features carry no allowance — keep the existing JSON viewer.
				if (row?.feature_type === FEATURE_TYPE.CONFIG) {
					const cv = row.config_value;
					const compact = cv && Object.keys(cv).length > 0 ? JSON.stringify(cv) : null;
					return (
						<button
							type='button'
							onClick={() => openConfigSheet(row.feature?.name ?? t('catalog:features.listPage.typeChips.config'), cv ?? null)}
							className='font-mono text-xs text-left text-muted-foreground rounded border border-transparent transition-all hover:border-border hover:shadow-sm hover:text-foreground max-w-md'
							style={{
								display: '-webkit-box',
								WebkitLineClamp: 3,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
								wordBreak: 'break-all',
							}}>
							{compact ?? t('common:labels.na')}
						</button>
					);
				}
				return (
					<span className='flex items-center gap-2'>
						<span>{formatAllowanceValue(row, t)}</span>
						{isParallelAllowance(row) && <Chip variant='default' label={t('entitlements.allowance.separateAllowances')} />}
					</span>
				);
			},
		},
		{
			// A grant's cadence lives here: "5 days", "billing period", or "--" for
			// features that have no reset at all.
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
						refetchQueryKey='planEntitlements'
						entityName={row?.feature?.name}
						edit={{ enabled: false }}
						archive={{
							enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
							text: 'Delete',
							icon: <Trash2 />,
							disabled: !canWriteEntitlement,
							disabledReason: !canWriteEntitlement ? t('catalog:plans.entitlementsTab.writeDeniedTooltip') : undefined,
						}}
					/>
				);
			},
		},
	];

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error loading entitlements');
		return null;
	}

	const entitlements = entitlementsData?.items || [];

	const addButton = canWriteEntitlement ? (
		<Button prefixIcon={<Plus />} onClick={() => setDrawerOpen(true)}>
			{t('common:actions.add')}
		</Button>
	) : (
		<Tooltip content={t('catalog:plans.entitlementsTab.writeDeniedTooltip')}>
			<span tabIndex={0} className='inline-block cursor-not-allowed'>
				<Button disabled prefixIcon={<Plus />}>
					{t('common:actions.add')}
				</Button>
			</span>
		</Tooltip>
	);

	return (
		<>
			<AddEntitlementDrawer
				selectedFeatures={entitlements?.map((v: any) => v.feature)}
				entitlements={entitlements}
				planId={planId!}
				entityType={ENTITLEMENT_ENTITY_TYPE.PLAN}
				entityId={planId!}
				isOpen={drawerOpen}
				onOpenChange={setDrawerOpen}
				refetchQueryKeys={['planEntitlements', planId!]}
			/>

			{/* Config value side sheet */}
			<Sheet isOpen={configSheet.open} onOpenChange={(open) => setConfigSheet((s) => ({ ...s, open }))} title={configSheet.name} size='2xl'>
				<div className='flex flex-col h-full'>
					<div className='px-6 py-6'>
						<JsonCodeBlock value={configSheet.value ?? {}} title={t('catalog:plans.entitlementsTab.configSheet.title')} />
					</div>
				</div>
			</Sheet>

			<div className='space-y-6'>
				{entitlements.length > 0 ? (
					<Card variant='notched'>
						<CardHeader title={t('catalog:plans.tabs.entitlements')} cta={addButton} />
						<FlexpriceTable showEmptyRow data={entitlements} columns={columnData} />
					</Card>
				) : (
					<NoDataCard
						title={t('catalog:plans.tabs.entitlements')}
						subtitle={t('catalog:plans.entitlementsTab.emptyStateSubtitle')}
						cta={addButton}
					/>
				)}
			</div>
		</>
	);
};

export default PlanEntitlementsTab;
