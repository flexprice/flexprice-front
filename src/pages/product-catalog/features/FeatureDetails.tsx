// React and third-party libraries
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { EyeOff, Bell, EllipsisVertical, Pencil } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
// Core utilities and APIs
import { RouteNames } from '@/core/routes/Routes';
import FeatureApi from '@/api/FeatureApi';
import EntitlementApi from '@/api/EntitlementApi';
import formatChips from '@/utils/common/format_chips';

// Store
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';

// Components
import { Button, Card, CardHeader, Chip, CopyIdButton, Divider, Loader, NoDataCard, Page, Sheet, Spacer } from '@/components/atoms';
import {
	ApiDocsContent,
	ColumnData,
	FlexpriceTable,
	RedirectCell,
	DropdownMenu,
	DropdownMenuOption,
	FeatureDrawer,
} from '@/components/molecules';
import JsonCodeBlock from '@/components/molecules/Events/JsonCodeBlock';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { FilterOperator, DataType } from '@/types/common/QueryBuilder';
import { JsonObject } from '@/types/common';
import { FeatureAlertDialog } from '@/components/molecules/FeatureAlertDialog';

// Models and types
import { FEATURE_TYPE } from '@/models/Feature';
import { formatMeterUsageResetPeriodToDisplay } from '@/types/formatters/Feature';

// Local utilities
import { formatAmount } from '@/components/atoms/Input/Input';
import { ApiDocsSnippet } from '@/store/useApiDocsStore';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { ENTITY_STATUS } from '@/models/base';
import { EntitlementResponse } from '@/types/dto';
import { METER_AGGREGATION_TYPE } from '@/models/Meter';
import { ENTITLEMENT_ENTITY_TYPE, PRICE_ENTITY_TYPE } from '@/models';
import { PriceApi } from '@/api/PriceApi';
import { formatBillingPeriodForDisplay } from '@/utils/common/helper_functions';
import { ChargeValueCell } from '@/components/molecules';
import { formatInvoiceCadence } from '@/pages/product-catalog/plans/PlanDetailsPage';
import { AlertSettings } from '@/models/Feature';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { EXPAND } from '@/models/expand';
import { GetPriceResponse } from '@/types/dto/Price';
import { useTranslation } from 'react-i18next';

export const formatAggregationType = (data: string): string => {
	const aggregationTypeMap: Record<string, string> = {
		[METER_AGGREGATION_TYPE.SUM]: 'Sum',
		[METER_AGGREGATION_TYPE.COUNT]: 'Count',
		[METER_AGGREGATION_TYPE.COUNT_UNIQUE]: 'Count Unique',
		[METER_AGGREGATION_TYPE.LATEST]: 'Latest',
		[METER_AGGREGATION_TYPE.SUM_WITH_MULTIPLIER]: 'Sum with Multiplier',
		[METER_AGGREGATION_TYPE.MAX]: 'Max',
		[METER_AGGREGATION_TYPE.WEIGHTED_SUM]: 'Weighted Sum',
		[METER_AGGREGATION_TYPE.AVG]: 'Average',
	};
	return aggregationTypeMap[data] || data;
};

const priceColumns: ColumnData<GetPriceResponse>[] = [
	{
		title: 'Plan/Addon',
		render: (row: GetPriceResponse) => {
			return (
				<RedirectCell
					redirectUrl={
						row.entity_type === PRICE_ENTITY_TYPE.PLAN ? `${RouteNames.plan}/${row.entity_id}` : `${RouteNames.addons}/${row.entity_id}`
					}>
					{row.entity_type === PRICE_ENTITY_TYPE.PLAN ? row.plan?.name : row.addon?.name}
				</RedirectCell>
			);
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
			return <span>{formatBillingPeriodForDisplay(rowData.billing_period as string)}</span>;
		},
	},
	{
		title: 'Value',
		render(rowData) {
			return <ChargeValueCell data={rowData} />;
		},
	},
];

const FeatureDetails = () => {
	const { id: featureId } = useParams() as { id: string };
	const { t } = useTranslation(['catalog', 'common']);
	const { updateBreadcrumb } = useBreadcrumbsStore();
	const [showAlertDialog, setShowAlertDialog] = useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [configSheet, setConfigSheet] = useState<{ open: boolean; name: string; value: JsonObject | null }>({
		open: false,
		name: '',
		value: null,
	});

	const { data, isLoading, isError } = useQuery({
		queryKey: ['fetchFeatureDetails', featureId],
		queryFn: async () => await FeatureApi.getFeatureById(featureId!),
		enabled: !!featureId,
	});

	const { data: linkedEntitlements } = useQuery({
		queryKey: ['fetchLinkedEntitlements', featureId],
		queryFn: async () =>
			await EntitlementApi.search({
				feature_ids: [featureId!],
				expand: generateExpandQueryParams([EXPAND.PLANS, EXPAND.FEATURES, EXPAND.PRICES, EXPAND.ADDONS]),
				status: ENTITY_STATUS.PUBLISHED,
				filters: [
					{
						field: 'entity_type',
						operator: FilterOperator.IN,
						data_type: DataType.ARRAY,
						value: {
							array: [ENTITLEMENT_ENTITY_TYPE.PLAN, ENTITLEMENT_ENTITY_TYPE.ADDON],
						},
					},
				],
			}),
		enabled: !!featureId,
	});

	const { data: linkedPrices } = useQuery({
		queryKey: ['fetchLinkedPrices', featureId, data?.meter?.id],
		queryFn: async () => {
			const prices = await PriceApi.ListPrices({
				expand: generateExpandQueryParams([EXPAND.PLAN, EXPAND.ADDONS]),
				meter_ids: [data?.meter?.id || ''],
				start_date_lt: new Date().toISOString(),
				status: ENTITY_STATUS.PUBLISHED,
				limit: 10000,
				offset: 0,
			});
			// Filter prices to only include PLAN or ADDON entity types
			const filteredPrices = {
				...prices,
				items: prices.items.filter(
					(price) => price.entity_type === PRICE_ENTITY_TYPE.PLAN || price.entity_type === PRICE_ENTITY_TYPE.ADDON,
				),
			};
			return filteredPrices;
		},
		enabled: !!data?.meter?.id,
	});

	const planOrAddonEntitlements = useMemo(
		() =>
			(linkedEntitlements?.items ?? []).filter(
				(e) => e.entity_type === ENTITLEMENT_ENTITY_TYPE.PLAN || e.entity_type === ENTITLEMENT_ENTITY_TYPE.ADDON,
			),
		[linkedEntitlements?.items],
	);

	const { mutate: archiveFeature, isPending: isArchiving } = useMutation({
		mutationFn: async () => await FeatureApi.deleteFeature(featureId!),
		onSuccess: () => {
			refetchQueries(['fetchFeatureDetails', featureId]);
			toast.success('Feature archived successfully');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to archive feature');
		},
	});

	useEffect(() => {
		updateBreadcrumb(1, 'Features', RouteNames.features);
		if (data?.name) {
			updateBreadcrumb(2, data?.name, RouteNames.featureDetails + featureId);
		}
	}, [data, featureId, updateBreadcrumb]);

	const dropdownOptions: DropdownMenuOption[] = useMemo(
		() => [
			{
				icon: <Pencil />,
				label: 'Edit',
				onSelect: () => setIsDrawerOpen(true),
			},
			{
				icon: <Bell />,
				label: 'Alert Settings',
				onSelect: () => setShowAlertDialog(true),
			},
		],
		[],
	);

	const columns: ColumnData<EntitlementResponse>[] = useMemo(
		() => [
			{
				title: 'Plan / Addon',
				render: (rowData) => {
					if (rowData.entity_type === ENTITLEMENT_ENTITY_TYPE.ADDON) {
						return (
							<RedirectCell redirectUrl={`${RouteNames.addons}/${rowData.entity_id}`}>
								{rowData.addon?.name ?? t('common:labels.na')}
							</RedirectCell>
						);
					}
					return (
						<RedirectCell redirectUrl={`${RouteNames.plan}/${rowData.entity_id}`}>
							{rowData.plan?.name ?? t('common:labels.na')}
						</RedirectCell>
					);
				},
			},
			{
				title: 'Status',
				render: (rowData) => {
					const rawStatus = rowData.entity_type === ENTITLEMENT_ENTITY_TYPE.ADDON ? rowData.addon?.status : rowData.plan?.status;
					const label = formatChips(rawStatus || '');
					return <Chip variant={label === 'Active' ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: 'Value',
				render: (rowData) => {
					if (rowData.feature_type === FEATURE_TYPE.BOOLEAN) {
						return rowData.is_enabled ? t('common:labels.yes') : t('common:labels.no');
					}
					if (rowData.feature_type === FEATURE_TYPE.STATIC) {
						return rowData.static_value || '0';
					}
					if (rowData.feature_type === FEATURE_TYPE.METERED) {
						const usageLimit = rowData.usage_limit ? formatAmount(rowData.usage_limit.toString()) : t('common:labels.unlimited');
						const unit =
							rowData.usage_limit === null || rowData.usage_limit > 1
								? rowData.feature?.unit_plural || t('catalog:features.form.unitsDefault')
								: rowData.feature?.unit_singular || t('catalog:features.form.unitDefault');
						return (
							<span className='flex items-end gap-1'>
								{usageLimit}
								<span className='text-muted-foreground text-sm font-sans'>{unit}</span>
							</span>
						);
					}
					if (rowData.feature_type === FEATURE_TYPE.CONFIG) {
						const cv = rowData.config_value;
						const compact = cv && Object.keys(cv).length > 0 ? JSON.stringify(cv) : null;
						return (
							<button
								type='button'
								onClick={() =>
									setConfigSheet({
										open: true,
										name: rowData.plan?.name ?? rowData.addon?.name ?? t('catalog:features.listPage.typeChips.config'),
										value: cv ?? null,
									})
								}
								className='font-mono text-xs text-left text-muted-foreground rounded border border-transparent transition-all hover:border-border hover:shadow-sm hover:text-foreground max-w-xs'
								style={{
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
									wordBreak: 'break-all',
								}}>
								{compact ?? t('common:labels.na')}
							</button>
						);
					}
					return <span className='text-muted-foreground'>{t('common:labels.na')}</span>;
				},
			},
		],
		[t],
	);

	const staticDate = useMemo(() => {
		const start = new Date(2020, 0, 1);
		const end = new Date();
		return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
	}, []);

	const staticEventId = useMemo(() => {
		return 'event_' + uuidv4().replace(/-/g, '').slice(0, 10);
	}, []);

	const curlCommand = `curl --request POST \\
--url https://api.cloud.flexprice.io/v1/events \\
--header 'Content-Type: application/json' \\
--header 'x-api-key: <your_api_key>' \\
--data '{
	"event_id": "${staticEventId}",
	"event_name": "${data?.meter?.event_name || '__MUST_BE_DEFINED__'}",
	"external_customer_id": "__CUSTOMER_ID__",
	"properties": {${[...(data?.meter?.filters || [])]
		.filter((filter) => filter.key && filter.key.trim() !== '')
		.map((filter) => `\n\t\t\t "${filter.key}" : "${filter.values[0] || 'FILTER_VALUE'}"`)
		.join(',')}${data?.meter?.aggregation?.field ? `,\n\t\t\t "${data?.meter?.aggregation.field}":"__VALUE__"` : ''}
	},
	"source": "api",
	"timestamp": "${staticDate}"
}'`;

	const snippets: ApiDocsSnippet[] = [
		{
			label: 'Ingest an event',
			description: 'Ingest an event into FlexPrice',
			curl: curlCommand,
		},
	];

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching feature details');
	}

	return (
		<>
			{/* Config value side sheet */}
			<Sheet isOpen={configSheet.open} onOpenChange={(open) => setConfigSheet((s) => ({ ...s, open }))} title={configSheet.name} size='2xl'>
				<div className='px-6 py-6'>
					<JsonCodeBlock value={configSheet.value ?? {}} title={t('catalog:plans.entitlementsTab.configSheet.title')} />
				</div>
			</Sheet>
			<Page
				headingCTA={
					<div className='flex gap-1'>
						<Button
							isLoading={isArchiving}
							disabled={isArchiving || data?.status !== ENTITY_STATUS.PUBLISHED}
							variant={'outline'}
							size={'lg'}
							onClick={() => archiveFeature()}
							className='flex gap-1 px-3'>
							<EyeOff className='w-4 h-4' />
							{isArchiving ? t('catalog:plans.archive.archiving') : t('common:actions.archive')}
						</Button>
						<DropdownMenu
							options={dropdownOptions}
							trigger={<Button variant={'outline'} prefixIcon={<EllipsisVertical />} size={'icon'} className='h-10 w-10 p-0'></Button>}
						/>
					</div>
				}
				documentTitle={data?.name}
				heading={
					<div className='flex items-center gap-2'>
						{data?.name}
						{data?.id && <CopyIdButton id={data.id} entityType='Feature' />}
					</div>
				}>
				<ApiDocsContent tags={API_DOCS_TAGS.Features} snippets={data?.type === FEATURE_TYPE.METERED ? snippets : undefined} />

				{/* Feature Alert Dialog */}
				<FeatureAlertDialog
					open={showAlertDialog}
					alertSettings={data?.alert_settings}
					onSave={async (alertSettings: AlertSettings) => {
						if (!featureId) return;
						try {
							await FeatureApi.updateFeature(featureId, {
								alert_settings: alertSettings,
							});
							setShowAlertDialog(false);
							refetchQueries(['fetchFeatureDetails', featureId]);
							toast.success('Alert settings updated successfully');
						} catch (e: any) {
							const errorMessage = e?.response?.data?.error?.message || e?.message || 'Failed to update alert settings';
							toast.error(errorMessage);
						}
					}}
					onClose={() => setShowAlertDialog(false)}
				/>

				<Spacer className='!h-4' />
				<div className='space-y-6'>
					{data?.type === FEATURE_TYPE.METERED && (
						<div>
							{linkedPrices?.items?.length && linkedPrices?.items?.length > 0 ? (
								<Card variant='notched'>
									<CardHeader title={t('catalog:features.details.charges')} />
									<FlexpriceTable showEmptyRow columns={priceColumns} data={linkedPrices?.items ?? []} variant='no-bordered' />
								</Card>
							) : (
								<NoDataCard title={t('catalog:features.details.charges')} subtitle='No charges linked to the feature yet' />
							)}
						</div>
					)}

					{planOrAddonEntitlements.length > 0 ? (
						<Card variant='notched'>
							<CardHeader title={t('catalog:features.details.entitlements')} />
							<FlexpriceTable showEmptyRow columns={columns} data={planOrAddonEntitlements} variant='no-bordered' />
						</Card>
					) : (
						<NoDataCard title={t('catalog:features.details.entitlements')} subtitle='No entitlements linked to the feature yet' />
					)}

					{data?.type === FEATURE_TYPE.METERED && (
						<Card variant='notched'>
							<div className='!space-y-6'>
								<CardHeader title={t('catalog:features.details.eventDetails')} className='!p-0 !mb-2' />
								<div>
									<div className='grid grid-cols-[200px_1fr] items-center'>
										<span className='text-muted-foreground text-sm'>{t('catalog:features.details.eventName')}</span>
										<span className='text-foreground text-sm'>{data?.meter?.event_name}</span>
									</div>
								</div>

								<Divider />

								{data?.meter?.filters && data.meter.filters.length > 0 && (
									<>
										<div className='space-y-4'>
											<span className='text-muted-foreground text-sm font-medium block'>{t('catalog:features.details.eventFilters')}</span>
											<div className='space-y-3'>
												{data?.meter?.filters?.map((filter) => {
													return (
														<div className='grid grid-cols-[200px_1fr] items-start'>
															<span className='text-foreground text-sm'>{filter.key}</span>
															<div className='flex gap-1.5 flex-wrap'>
																{filter.values.map((value) => {
																	return <Chip className='text-xs py-0.5' variant='default' label={value} />;
																})}
															</div>
														</div>
													);
												})}
											</div>
										</div>
										<Divider />
									</>
								)}

								<div className='space-y-4'>
									<span className='text-muted-foreground text-sm font-medium block'>{t('catalog:features.details.aggregationDetails')}</span>
									<div className='space-y-3'>
										{/* <div className='grid grid-cols-[200px_1fr] items-center'>
										<span className='text-muted-foreground text-sm'>Aggregation</span>
										<span className='text-foreground text-sm'>{toSentenceCase(data?.meter?.aggregation.type || '--')}</span>
									</div> */}
										<div className='grid grid-cols-[200px_1fr] items-center'>
											<span className='text-muted-foreground text-sm'>{t('catalog:features.details.type')}</span>
											<span className='text-foreground text-sm'>
												{formatAggregationType(data?.meter?.aggregation.type || t('common:labels.na'))}
											</span>
										</div>
										<div className='grid grid-cols-[200px_1fr] items-center'>
											<span className='text-muted-foreground text-sm'>
												{t(
													data?.meter?.aggregation?.expression
														? 'catalog:features.details.customExpression'
														: 'catalog:features.details.value',
												)}
											</span>
											<span className='text-foreground text-sm'>
												{data?.meter?.aggregation?.expression || data?.meter?.aggregation?.field || t('common:labels.na')}
											</span>
										</div>

										<div className='grid grid-cols-[200px_1fr] items-center'>
											<span className='text-muted-foreground text-sm'>{t('catalog:features.details.unitName')}</span>
											<span className='text-foreground text-sm'>{`${data?.unit_singular || t('catalog:features.form.unitDefault')} / ${data?.unit_plural || t('catalog:features.form.unitsDefault')}`}</span>
										</div>
										{data?.reporting_unit && (
											<div className='grid grid-cols-[200px_1fr] items-center'>
												<span className='text-muted-foreground text-sm'>{t('catalog:features.details.displayUnitName')}</span>
												<span className='text-foreground text-sm'>{`${data.reporting_unit.unit_singular || t('common:labels.na')} / ${data.reporting_unit.unit_plural || t('common:labels.na')}`}</span>
											</div>
										)}
										<div className='grid grid-cols-[200px_1fr] items-center'>
											<span className='text-muted-foreground text-sm'>{t('catalog:features.details.usageReset')}</span>
											<span className='text-foreground text-sm'>
												{formatMeterUsageResetPeriodToDisplay(data?.meter?.reset_usage || t('common:labels.na'))}
											</span>
										</div>
										{(data?.meter?.aggregation?.type === METER_AGGREGATION_TYPE.MAX ||
											data?.meter?.aggregation?.type === METER_AGGREGATION_TYPE.SUM) &&
											data?.meter?.aggregation?.bucket_size && (
												<div className='grid grid-cols-[200px_1fr] items-center'>
													<span className='text-muted-foreground text-sm'>{t('catalog:features.details.bucketSize')}</span>
													<span className='text-foreground text-sm'>{data?.meter?.aggregation.bucket_size || t('common:labels.na')}</span>
												</div>
											)}
										{data?.meter?.aggregation?.group_by && (
											<div className='grid grid-cols-[200px_1fr] items-center'>
												<span className='text-muted-foreground text-sm'>{t('catalog:features.details.groupBy')}</span>
												<span className='text-foreground text-sm'>{data.meter.aggregation.group_by}</span>
											</div>
										)}
									</div>
								</div>
							</div>
						</Card>
					)}
				</div>
				{data && (
					<FeatureDrawer
						data={data}
						open={isDrawerOpen}
						onOpenChange={setIsDrawerOpen}
						refetchQueryKeys={['fetchFeatureDetails', featureId]}
					/>
				)}
			</Page>
		</>
	);
};

export default FeatureDetails;
