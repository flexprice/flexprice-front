import { FC, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Info } from 'lucide-react';
import { Button, Card, CardHeader, Chip, Dialog, NoDataCard, Sheet } from '@/components/atoms';
import { FlexpriceTable, ColumnData, AddEntitlementDrawer, EditSubscriptionEntitlementDrawer } from '@/components/molecules';
import JsonCodeBlock from '@/components/molecules/Events/JsonCodeBlock';
import SubscriptionApi from '@/api/SubscriptionApi';
import EntitlementApi from '@/api/EntitlementApi';
import { FEATURE_TYPE } from '@/models/Feature';
import { ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { BsThreeDots } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';
import { ENTITY_STATUS, EXPAND } from '@/models';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import {
	EnrichedSubscriptionEntitlement,
	enrichSubscriptionEntitlements,
	getPrimarySourceLabel,
	getEffectiveStaticValue,
	getEffectiveConfigValue,
} from '@/utils/subscription/subscriptionEntitlementHelpers';
import { JsonObject } from '@/types/common';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

interface SubscriptionEntitlementsSectionProps {
	subscriptionId: string;
	/** When true, add and delete entitlement actions are disabled. */
	readOnly?: boolean;
}

const SubscriptionEntitlementsSection: FC<SubscriptionEntitlementsSectionProps> = ({ subscriptionId, readOnly = false }) => {
	const { t: tc } = useTranslation('common');
	const { t } = useTranslation('catalog');
	const { can } = useCurrentUserPermissions();
	const canWriteEntitlement = can('entitlement', 'write');
	// Only explain the permission-denied case, not the (unrelated) readOnly case, where the
	// button being disabled has nothing to do with the current user's own write access.
	const addButtonDeniedReason = !readOnly && !canWriteEntitlement ? t('plans.entitlementsTab.writeDeniedTooltip') : undefined;
	const [addDrawerOpen, setAddDrawerOpen] = useState(false);
	const [editDrawerOpen, setEditDrawerOpen] = useState(false);
	const [selectedEntitlement, setSelectedEntitlement] = useState<EnrichedSubscriptionEntitlement | null>(null);
	const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [entitlementToDelete, setEntitlementToDelete] = useState<EnrichedSubscriptionEntitlement | null>(null);
	const [configSheet, setConfigSheet] = useState<{ open: boolean; name: string; value: JsonObject | null }>({
		open: false,
		name: '',
		value: null,
	});
	const queryClient = useQueryClient();

	const invalidateEntitlements = () => {
		queryClient.invalidateQueries({ queryKey: ['subscriptionEntitlements', subscriptionId] });
		queryClient.invalidateQueries({ queryKey: ['subscriptionRawEntitlements', subscriptionId] });
	};

	const {
		data: entitlementsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['subscriptionEntitlements', subscriptionId],
		queryFn: async () => {
			try {
				return await SubscriptionApi.getSubscriptionEntitlements(subscriptionId);
			} catch (error) {
				console.error('Failed to fetch subscription entitlements:', error);
				return { features: [], subscription_id: subscriptionId, plan_id: '' };
			}
		},
		enabled: !!subscriptionId,
		retry: false,
		refetchOnWindowFocus: false,
	});

	const planId = entitlementsData?.plan_id;

	const { data: rawSubscriptionEntitlements } = useQuery({
		queryKey: ['subscriptionRawEntitlements', subscriptionId],
		queryFn: async () => {
			try {
				return await EntitlementApi.search({
					entity_type: ENTITLEMENT_ENTITY_TYPE.SUBSCRIPTION,
					entity_ids: [subscriptionId],
					filters: [
						{
							field: 'status',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: ENTITY_STATUS.PUBLISHED },
						},
					],
					expand: generateExpandQueryParams([EXPAND.FEATURES]),
					limit: 1000,
					offset: 0,
				});
			} catch (error) {
				console.error('Failed to fetch raw subscription entitlements:', error);
				return { items: [] };
			}
		},
		enabled: !!subscriptionId,
		retry: false,
		refetchOnWindowFocus: false,
	});

	const { data: planEntitlements } = useQuery({
		queryKey: ['planEntitlements', planId],
		queryFn: async () => {
			if (!planId) return { items: [] };
			try {
				return await EntitlementApi.search({
					filters: [
						{
							field: 'entity_type',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: ENTITLEMENT_ENTITY_TYPE.PLAN },
						},
						{
							field: 'entity_id',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: planId },
						},
						{
							field: 'status',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: ENTITY_STATUS.PUBLISHED },
						},
					],
					expand: generateExpandQueryParams([EXPAND.FEATURES]),
					limit: 1000,
					offset: 0,
				});
			} catch (error) {
				console.error('Failed to fetch plan entitlements:', error);
				return { items: [] };
			}
		},
		enabled: !!planId,
		retry: false,
		refetchOnWindowFocus: false,
	});

	const entitlements = useMemo(
		() =>
			enrichSubscriptionEntitlements(
				entitlementsData?.features ?? [],
				rawSubscriptionEntitlements?.items ?? [],
				planEntitlements?.items ?? [],
			),
		[entitlementsData?.features, rawSubscriptionEntitlements?.items, planEntitlements?.items],
	);

	const { mutate: deleteEntitlement, isPending: isDeletingEntitlement } = useMutation({
		mutationFn: async (entitlementId: string) => {
			return await EntitlementApi.delete(entitlementId);
		},
		onSuccess: () => {
			toast.success(t('entitlements.subscriptionEdit.deleteSuccess'));
			invalidateEntitlements();
			setIsDeleteDialogOpen(false);
			setEntitlementToDelete(null);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('entitlements.subscriptionEdit.deleteFailed'));
		},
	});

	const formatUsageLimit = (value: number | null | undefined) =>
		value === null || value === undefined ? t('entitlements.overridesTable.unlimited') : String(value.toLocaleString());

	const getFeatureTypeChip = (featureType: string) => {
		const type = featureType?.toLowerCase();
		switch (type) {
			case 'metered':
				return <Chip label={tc('labels.metered')} variant='info' />;
			case 'boolean':
				return <Chip label={tc('labels.boolean')} variant='success' />;
			case 'static':
				return <Chip label={tc('labels.static')} variant='warning' />;
			case 'config':
				return <Chip label={tc('labels.config')} variant='default' />;
			default:
				return <Chip label={featureType} variant='info' />;
		}
	};

	const getSourceLabel = (row: EnrichedSubscriptionEntitlement) => {
		if (row.isOverrideOfParent) {
			return t('entitlements.subscriptionEdit.sourceOverride');
		}
		if (row.hasSubscriptionOverride && !row.isOverrideOfParent) {
			return t('entitlements.subscriptionEdit.sourceSubscription');
		}
		const source = getPrimarySourceLabel(row.sources);
		const sourceKeys: Record<string, string> = {
			plan: 'entitlements.subscriptionEdit.sourcePlan',
			addon: 'entitlements.subscriptionEdit.sourceAddon',
			subscription: 'entitlements.subscriptionEdit.sourceSubscription',
		};
		return t(sourceKeys[source] ?? 'entitlements.subscriptionEdit.sourcePlan');
	};

	const getEntitlementValue = (row: EnrichedSubscriptionEntitlement) => {
		const featureType = row.feature_type;
		const entitlementData = row.entitlement;

		if (featureType === FEATURE_TYPE.METERED) {
			const limit = entitlementData?.usage_limit;
			const originalLimit = row.originalUsageLimit;
			const resetPeriod = entitlementData?.usage_reset_period;
			const valueText =
				limit !== null && limit !== undefined
					? `${limit.toLocaleString()}${resetPeriod ? ` / ${resetPeriod.toLowerCase()}` : ''}`
					: tc('labels.unlimited');

			const hasChangedValue = row.isOverrideOfParent && limit !== originalLimit;

			return (
				<div className='flex items-center gap-2'>
					<span>{valueText}</span>
					{hasChangedValue && (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger>
									<Info className='h-4 w-4 text-accent-orange hover:text-accent-orange transition-colors duration-150' />
								</TooltipTrigger>
								<TooltipContent
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[300px]'>
									<div className='space-y-2'>
										<div className='font-medium text-content'>{t('entitlements.overridesTable.overrideAppliedTitle')}</div>
										<div className='text-sm text-content-tertiary'>
											{t('entitlements.overridesTable.tooltipUsageLimit', {
												from: formatUsageLimit(originalLimit),
												to: formatUsageLimit(limit),
											})}
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			);
		}

		if (featureType === FEATURE_TYPE.STATIC) {
			const value = getEffectiveStaticValue(entitlementData) || '--';
			const originalValue = row.originalStaticValue || '--';
			const hasChanged = row.isOverrideOfParent && value !== originalValue;

			return (
				<div className='flex items-center gap-2'>
					<span>{value}</span>
					{hasChanged && (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger>
									<Info className='h-4 w-4 text-accent-orange hover:text-accent-orange transition-colors duration-150' />
								</TooltipTrigger>
								<TooltipContent
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[300px]'>
									<div className='space-y-2'>
										<div className='font-medium text-content'>{t('entitlements.overridesTable.overrideAppliedTitle')}</div>
										<div className='text-sm text-content-tertiary'>
											{t('entitlements.overridesTable.tooltipStaticValue', { from: String(originalValue), to: String(value) })}
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			);
		}

		if (featureType === FEATURE_TYPE.BOOLEAN) {
			const value = entitlementData?.is_enabled ? tc('labels.enabled') : tc('labels.disabled');
			const originalValue =
				row.originalIsEnabled === undefined ? undefined : row.originalIsEnabled ? tc('labels.enabled') : tc('labels.disabled');
			const hasChanged = row.isOverrideOfParent && originalValue !== undefined && value !== originalValue;

			return (
				<div className='flex items-center gap-2'>
					<span>{value}</span>
					{hasChanged && (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger>
									<Info className='h-4 w-4 text-accent-orange hover:text-accent-orange transition-colors duration-150' />
								</TooltipTrigger>
								<TooltipContent
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[300px]'>
									<div className='space-y-2'>
										<div className='font-medium text-content'>{t('entitlements.overridesTable.overrideAppliedTitle')}</div>
										<div className='text-sm text-content-tertiary'>
											{t('entitlements.overridesTable.tooltipStatus', { from: originalValue!, to: value })}
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			);
		}

		if (featureType === FEATURE_TYPE.CONFIG) {
			const cv = getEffectiveConfigValue(row.sources);
			const compact = cv && Object.keys(cv).length > 0 ? JSON.stringify(cv) : null;
			if (!compact) return <span className='text-muted-foreground'>{tc('labels.na')}</span>;
			return (
				<div className='flex items-center gap-2'>
					<button
						type='button'
						className='font-mono text-xs text-left text-muted-foreground rounded border border-transparent transition-all hover:border-border hover:shadow-sm hover:text-foreground max-w-md'
						style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-all' }}
						onClick={() => setConfigSheet({ open: true, name: row.feature?.name ?? '', value: cv ?? null })}>
						{compact}
					</button>
					{row.isOverrideOfParent && (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger>
									<Info className='h-4 w-4 text-accent-orange hover:text-accent-orange transition-colors duration-150' />
								</TooltipTrigger>
								<TooltipContent
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[300px]'>
									<div className='space-y-2'>
										<div className='font-medium text-content'>{t('entitlements.overridesTable.overrideAppliedTitle')}</div>
										<div className='text-sm text-content-tertiary'>{t('entitlements.overridesTable.tooltipConfig')}</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			);
		}

		return '--';
	};

	const handleEdit = (entitlement: EnrichedSubscriptionEntitlement) => {
		setDropdownOpen(null);
		setSelectedEntitlement(entitlement);
		setEditDrawerOpen(true);
	};

	const handleDelete = (entitlement: EnrichedSubscriptionEntitlement) => {
		setDropdownOpen(null);
		setEntitlementToDelete(entitlement);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (entitlementToDelete?.subscriptionEntitlementId) {
			deleteEntitlement(entitlementToDelete.subscriptionEntitlementId);
		}
	};

	const cancelDelete = () => {
		setIsDeleteDialogOpen(false);
		setEntitlementToDelete(null);
	};

	const handleResetOverride = (entitlement: EnrichedSubscriptionEntitlement) => {
		if (entitlement.subscriptionEntitlementId) {
			deleteEntitlement(entitlement.subscriptionEntitlementId);
		}
	};

	const columns: ColumnData<EnrichedSubscriptionEntitlement>[] = [
		{
			title: t('entitlements.overridesTable.columnFeatureName'),
			render: (row) => <span>{row.feature?.name || tc('labels.unknownFeature')}</span>,
		},
		{
			title: t('entitlements.subscriptionEdit.columnSource'),
			render: (row) => <span className='capitalize text-sm text-content-tertiary'>{getSourceLabel(row)}</span>,
		},
		{
			title: t('entitlements.overridesTable.columnFeatureType'),
			render: (row) => getFeatureTypeChip(row.feature_type),
		},
		{
			title: t('entitlements.overridesTable.columnValue'),
			render: (row) => getEntitlementValue(row),
		},
		{
			title: '',
			width: '30px',
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => {
				if (readOnly) {
					return null;
				}

				const canDelete = !!row.subscriptionEntitlementId;
				const canEdit = true;

				if (!canEdit && !canDelete) {
					return null;
				}

				return (
					<div
						data-interactive='true'
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}>
						<DropdownMenu open={dropdownOpen === row.feature_id} onOpenChange={(open) => setDropdownOpen(open ? row.feature_id : null)}>
							<DropdownMenuTrigger asChild>
								<button className='focus:outline-none'>
									<BsThreeDots className='text-base text-muted-foreground hover:text-foreground transition-colors' />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								{(() => {
									const editItem = (
										<DropdownMenuItem
											aria-disabled={!canWriteEntitlement}
											onSelect={(e) => {
												e.preventDefault();
												if (!canWriteEntitlement) return;
												handleEdit(row);
											}}
											className={`flex gap-2 items-center cursor-pointer ${!canWriteEntitlement ? 'opacity-50 cursor-not-allowed' : ''}`}>
											<Pencil className='h-4 w-4' />
											<span>{t('entitlements.overridesTable.edit')}</span>
										</DropdownMenuItem>
									);
									// Tooltip wraps the item directly (asChild merges its trigger props into it)
									// rather than a wrapping <span> — a Radix-disabled item drops out of the
									// menu's roving-focus/collection, so the select is blocked in onSelect
									// instead, keeping the item reachable by arrow-key nav.
									return canWriteEntitlement ? (
										editItem
									) : (
										<TooltipProvider delayDuration={0}>
											<Tooltip>
												<TooltipTrigger asChild>{editItem}</TooltipTrigger>
												<TooltipContent>{t('plans.entitlementsTab.writeDeniedTooltip')}</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									);
								})()}
								{canDelete &&
									(() => {
										const deleteItem = (
											<DropdownMenuItem
												aria-disabled={!canWriteEntitlement}
												onSelect={(e) => {
													e.preventDefault();
													if (!canWriteEntitlement) return;
													handleDelete(row);
												}}
												className={`flex gap-2 items-center cursor-pointer text-danger ${!canWriteEntitlement ? 'opacity-50 cursor-not-allowed' : ''}`}>
												<Trash2 className='h-4 w-4' />
												<span>{row.isOverrideOfParent ? t('entitlements.subscriptionEdit.resetAction') : tc('actions.delete')}</span>
											</DropdownMenuItem>
										);
										return canWriteEntitlement ? (
											deleteItem
										) : (
											<TooltipProvider delayDuration={0}>
												<Tooltip>
													<TooltipTrigger asChild>{deleteItem}</TooltipTrigger>
													<TooltipContent>{t('plans.entitlementsTab.writeDeniedTooltip')}</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										);
									})()}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];

	const handleAddDrawerClose = (value: boolean) => {
		setAddDrawerOpen(value);
		if (!value) {
			invalidateEntitlements();
		}
	};

	if (isLoading) {
		return (
			<Card variant='notched'>
				<CardHeader title={tc('labels.entitlements')} />
				<div className='flex justify-center items-center py-8'>
					<span className='text-content-muted'>{tc('labels.loadingEntitlements')}</span>
				</div>
			</Card>
		);
	}

	if (isError) {
		return null;
	}

	const deleteDialogTitle = entitlementToDelete?.isOverrideOfParent
		? t('entitlements.subscriptionEdit.resetConfirmTitle', { name: entitlementToDelete.feature?.name || tc('labels.thisFeature') })
		: t('entitlements.subscriptionEdit.deleteConfirmTitle', { name: entitlementToDelete?.feature?.name || tc('labels.thisFeature') });

	const deleteDialogDescription = entitlementToDelete?.isOverrideOfParent
		? t('entitlements.subscriptionEdit.resetConfirmDescription')
		: tc('confirm.deleteDescription');

	const deleteButtonLabel = entitlementToDelete?.isOverrideOfParent
		? t('entitlements.subscriptionEdit.resetAction')
		: isDeletingEntitlement
			? tc('status.deleting')
			: tc('actions.delete');

	const addEntitlementButton = addButtonDeniedReason ? (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<span tabIndex={0} className='inline-block'>
						<Button prefixIcon={<Plus />} disabled>
							{tc('actions.add')}
						</Button>
					</span>
				</TooltipTrigger>
				<TooltipContent>{addButtonDeniedReason}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	) : (
		<Button prefixIcon={<Plus />} onClick={() => setAddDrawerOpen(true)} disabled={readOnly}>
			{tc('actions.add')}
		</Button>
	);

	return (
		<>
			{entitlements.length > 0 ? (
				<Card variant='notched'>
					<CardHeader title={tc('labels.entitlements')} cta={addEntitlementButton} />
					<FlexpriceTable showEmptyRow data={entitlements} columns={columns} variant='no-bordered' />
				</Card>
			) : (
				<NoDataCard title={tc('labels.entitlements')} subtitle={tc('labels.noEntitlementsAddedYet')} cta={addEntitlementButton} />
			)}

			<AddEntitlementDrawer
				isOpen={addDrawerOpen}
				onOpenChange={handleAddDrawerClose}
				entityType={ENTITLEMENT_ENTITY_TYPE.SUBSCRIPTION}
				entityId={subscriptionId}
				entitlements={entitlements as never}
			/>

			<EditSubscriptionEntitlementDrawer
				isOpen={editDrawerOpen}
				onOpenChange={setEditDrawerOpen}
				subscriptionId={subscriptionId}
				entitlement={selectedEntitlement}
				onSuccess={invalidateEntitlements}
				onReset={handleResetOverride}
			/>

			<Dialog
				title={deleteDialogTitle}
				description={deleteDialogDescription}
				titleClassName='text-lg font-normal text-content-heading'
				isOpen={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				showCloseButton={false}>
				<div className='flex flex-col gap-4 items-end justify-center'>
					<div className='flex gap-4'>
						<Button variant='outline' onClick={cancelDelete} disabled={isDeletingEntitlement}>
							{tc('actions.cancel')}
						</Button>
						<Button variant='destructive' onClick={confirmDelete} disabled={isDeletingEntitlement}>
							{deleteButtonLabel}
						</Button>
					</div>
				</div>
			</Dialog>

			<Sheet isOpen={configSheet.open} onOpenChange={(open) => setConfigSheet((s) => ({ ...s, open }))} title={configSheet.name} size='2xl'>
				<div className='p-6'>{configSheet.value && <JsonCodeBlock value={configSheet.value} />}</div>
			</Sheet>
		</>
	);
};

export default SubscriptionEntitlementsSection;
