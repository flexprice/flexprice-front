import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Card, CardHeader, NoDataCard, Loader, Sheet } from '@/components/atoms';
import { Plus } from 'lucide-react';
import JsonCodeBlock from '@/components/molecules/Events/JsonCodeBlock';
import { EntitlementApi } from '@/api';
import { FlexpriceTable, ColumnData, RedirectCell, AddEntitlementDrawer } from '@/components/molecules';
import { getFeatureTypeChips } from '@/components/molecules/CustomerUsageTable/CustomerUsageTable';
import { formatAmount } from '@/components/atoms/Input/Input';
import { Entitlement, ENTITY_STATUS, FEATURE_TYPE, ENTITLEMENT_ENTITY_TYPE, EXPAND, ENTITLEMENT_USAGE_RESET_PERIOD } from '@/models';
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

	const getFeatureValue = (entitlement: Entitlement) => {
		const value = entitlement.usage_limit?.toFixed() || '';
		const unlimited = t('common:labels.unlimited');
		const unitLabel = t('catalog:features.form.unitDefault');
		const unitsLabel = t('catalog:features.form.unitsDefault');

		switch (entitlement.feature_type) {
			case FEATURE_TYPE.STATIC:
				return entitlement.static_value;
			case FEATURE_TYPE.METERED:
				return (
					<span className='flex items-end gap-1'>
						{formatAmount(value || unlimited)}
						<span className='text-[#64748B] text-sm font-normal font-sans'>
							{value
								? Number(value) > 0
									? entitlement.feature?.unit_plural || unitsLabel
									: entitlement.feature?.unit_singular || unitLabel
								: entitlement.feature?.unit_plural || unitsLabel}
						</span>
					</span>
				);
			case FEATURE_TYPE.BOOLEAN:
				return entitlement.is_enabled ? t('common:labels.yes') : t('common:labels.no');
			case FEATURE_TYPE.CONFIG: {
				const cv = entitlement.config_value;
				const compact = cv && Object.keys(cv).length > 0 ? JSON.stringify(cv) : null;
				return (
					<button
						type='button'
						onClick={() => openConfigSheet(entitlement.feature?.name ?? t('catalog:features.listPage.typeChips.config'), cv ?? null)}
						className='font-mono text-xs text-left text-muted-foreground rounded border border-transparent transition-all hover:border-border hover:shadow-sm hover:text-foreground max-w-md'
						style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-all' }}>
						{compact ?? t('common:labels.na')}
					</button>
				);
			}
			default:
				return t('common:labels.na');
		}
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
			title: 'Usage Reset',
			render(row) {
				const period = row?.usage_reset_period as ENTITLEMENT_USAGE_RESET_PERIOD | '' | null;
				return period && Object.values(ENTITLEMENT_USAGE_RESET_PERIOD).includes(period as ENTITLEMENT_USAGE_RESET_PERIOD) ? period : '--';
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
						<CardHeader
							title={t('catalog:plans.tabs.entitlements')}
							cta={
								<Button prefixIcon={<Plus />} onClick={() => setDrawerOpen(true)}>
									Add
								</Button>
							}
						/>
						<FlexpriceTable showEmptyRow data={entitlements} columns={columnData} />
					</Card>
				) : (
					<NoDataCard
						title={t('catalog:plans.tabs.entitlements')}
						subtitle='No entitlements added to the plan yet'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => setDrawerOpen(true)}>
								Add
							</Button>
						}
					/>
				)}
			</div>
		</>
	);
};

export default PlanEntitlementsTab;
