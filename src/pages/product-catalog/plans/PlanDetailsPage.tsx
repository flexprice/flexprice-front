// React imports
import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router';

// Third-party libraries
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, EyeOff, EllipsisVertical, Pencil, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Internal components
import { Button, CopyIdButton, Loader, Page } from '@/components/atoms';
import { ApiDocsContent, DropdownMenu, DuplicatePlanDialog, PlanDrawer } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import type { DropdownMenuOption } from '@/components/molecules';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';

// API imports
import { PlanApi, WorkflowApi } from '@/api';

// Core services and routes
import { RouteNames } from '@/core/routes/Routes';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

// Models and types
import { Plan, ENTITY_STATUS } from '@/models';

// Constants and utilities
import { getPlanPriceSyncWorkflowFilters } from '@/constants/workflow';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { INVOICE_CADENCE } from '@/models';
import { DataType, FilterOperator, SortDirection } from '@/types/common/QueryBuilder';
import { useTranslation } from 'react-i18next';

export const formatInvoiceCadence = (cadence: string): string => {
	switch (cadence.toUpperCase()) {
		case INVOICE_CADENCE.ADVANCE:
			return 'Advance';
		case INVOICE_CADENCE.ARREAR:
			return 'Arrear';
		default:
			return '--';
	}
};

const tabs = [
	{ id: '', label: 'Overview' },
	{ id: 'entitlements', label: 'Entitlements' },
	{ id: 'credit-grants', label: 'Credit Grants' },
	{ id: 'information', label: 'Information' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const getActiveTab = (pathTabId: string): TabId => {
	const validTabId = tabs.find((tab) => tab.id === pathTabId);
	return validTabId ? validTabId.id : '';
};

type Params = {
	planId: string;
};

const PlanDetailsPage = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const navigate = useNavigate();
	const location = useLocation();
	const { planId } = useParams<Params>();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
	const { can } = useCurrentUserPermissions();
	const canWritePlan = can('plan', 'write');

	const {
		data: planData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPlan', planId],
		queryFn: async () => {
			const response = await PlanApi.getPlansByFilter({
				filters: [{ field: 'id', operator: FilterOperator.EQUAL, data_type: DataType.STRING, value: { string: planId } }],
				limit: 1,
				offset: 0,
				sort: [],
				expand: 'price_sync_status',
			});
			return response.items[0] ?? null;
		},
		enabled: !!planId,
	});

	const isFullySynced = planData?.price_sync_status?.synced ?? false;
	const unsyncedCount = planData?.price_sync_status?.unsynced_subscription_count ?? 0;

	const { data: syncWorkflowsData } = useQuery({
		queryKey: ['planSyncWorkflows', planId],
		queryFn: async () =>
			WorkflowApi.search({
				filters: getPlanPriceSyncWorkflowFilters(planId!),
				sort: [{ field: 'start_time', direction: SortDirection.DESC }],
				limit: 1,
				offset: 0,
			}),
		enabled: !!planId,
		refetchInterval: (query) => {
			const data = query.state.data as { items?: { status?: string; entity_id?: string }[] } | undefined;
			const items = data?.items ?? [];
			const latest = items[0];
			return latest?.status === 'Running' ? 60000 : false;
		},
	});

	// Latest run by timestamp (first item when sorted by start_time desc); scope to this plan when entity_id is set
	const planRuns = useMemo(
		() => syncWorkflowsData?.items?.filter((w) => !w.entity_id || w.entity_id === planId) ?? [],
		[syncWorkflowsData?.items, planId],
	);
	const latestRun = planRuns[0];
	const isSyncRunning = latestRun?.status === 'Running';
	const isTerminalSyncStatus = latestRun?.status === 'Completed' || latestRun?.status === 'Failed';

	// Refetch plan data after a sync we started reaches a terminal workflow status —
	// including when the first poll is already Completed and never passed through Running.
	// Also refetch if a run that was already Running when this page loaded later finishes.
	const wasSyncRunning = useRef(isSyncRunning);
	const awaitingPlanRefresh = useRef(false);
	const workflowKeyWhenSyncStarted = useRef<string | undefined>(undefined);
	useEffect(() => {
		const finishedObservedRun = wasSyncRunning.current && !isSyncRunning;
		const finishedStartedRun =
			awaitingPlanRefresh.current && isTerminalSyncStatus && latestRun?.run_id !== workflowKeyWhenSyncStarted.current;
		if (finishedObservedRun || finishedStartedRun) {
			awaitingPlanRefresh.current = false;
			void queryClient.invalidateQueries({ queryKey: ['fetchPlan', planId] });
		}
		wasSyncRunning.current = isSyncRunning;
	}, [isSyncRunning, isTerminalSyncStatus, latestRun?.run_id, planId, queryClient]);

	const { mutate: archivePlan } = useMutation({
		mutationFn: async () => {
			return await PlanApi.deletePlan(planId!);
		},
		onSuccess: () => {
			toast.success('Plan archived successfully');
			navigate(RouteNames.plan);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to archive plan');
		},
	});

	const { mutate: syncPlan, isPending: isSyncing } = useMutation({
		mutationFn: () => PlanApi.synchronizePlanPricesWithSubscription(planId!),
		onSuccess: () => {
			toast.success('Sync has been started and will take up to 1 hour to complete.');
			awaitingPlanRefresh.current = true;
			workflowKeyWhenSyncStarted.current = latestRun?.run_id;
			void queryClient.invalidateQueries({ queryKey: ['planSyncWorkflows', planId] });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Error synchronizing plan with subscriptions');
		},
	});

	const { updateBreadcrumb, setSegmentLoading } = useBreadcrumbsStore();

	const dropdownOptions: DropdownMenuOption[] = useMemo(
		() => [
			{
				label: 'Edit',
				icon: <Pencil />,
				onSelect: () => setPlanDrawerOpen(true),
				disabled: !canWritePlan,
				disabledReason: canWritePlan ? undefined : t('plans.detailsPage.writeDeniedTooltip'),
			},
			{
				label: 'Duplicate',
				icon: <Copy />,
				onSelect: () => setDuplicateDialogOpen(true),
				disabled: !canWritePlan,
				disabledReason: canWritePlan ? undefined : t('plans.detailsPage.writeDeniedTooltip'),
			},
			{
				label: 'Archive',
				icon: <EyeOff />,
				onSelect: () => archivePlan(),
				disabled: planData?.status !== ENTITY_STATUS.PUBLISHED || !canWritePlan,
				disabledReason: canWritePlan ? undefined : t('plans.detailsPage.writeDeniedTooltip'),
			},
		],
		[archivePlan, planData?.status, canWritePlan, t],
	);

	// Handle tab changes based on URL
	useEffect(() => {
		const currentPath = location.pathname.split('/');
		// Path structure: /product-catalog/plan/:planId/:tabId
		// So index 4 would be the tabId (or empty for overview)
		const pathTabId = currentPath[4] || '';
		const newActiveTab = getActiveTab(pathTabId);
		setActiveTab(newActiveTab);
	}, [location.pathname]);

	// Update breadcrumbs based on active tab
	useEffect(() => {
		if (activeTab !== '') {
			setSegmentLoading(3, true);
		}

		const activeTabData = tabs.find((tab) => tab.id === activeTab);
		setSegmentLoading(2, true);

		if (activeTab !== '' && activeTabData) {
			updateBreadcrumb(3, activeTabData.label);
		}
		if (planData?.name) {
			updateBreadcrumb(2, planData.name);
		}
	}, [activeTab, updateBreadcrumb, setSegmentLoading, planData]);

	const onTabChange = (tabId: TabId) => {
		if (tabId === '') {
			navigate(`${RouteNames.plan}/${planId}`);
		} else {
			navigate(`${RouteNames.plan}/${planId}/${tabId}`);
		}
	};

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

	return (
		<Page
			documentTitle={planData.name}
			heading={
				<div className='flex items-center gap-2'>
					<span>{planData.name}</span>
					{planData.id && <CopyIdButton id={planData.id} entityType='Plan' />}
				</div>
			}
			headingCTA={
				<div className='flex items-center gap-2'>
					<TooltipProvider delayDuration={0}>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className='relative inline-block'>
									<Button
										onClick={() => syncPlan()}
										disabled={isSyncing || isSyncRunning || !canWritePlan || isFullySynced}
										isLoading={isSyncing}
										variant='outline'
										className='flex gap-2'>
										<RefreshCw />
										Sync Usage Charges
									</Button>
									{unsyncedCount > 0 && (
										<span
											className='absolute -right-1.5 -top-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground pointer-events-none'
											aria-label={t('plans.detailsPage.unsyncedCountAria', { count: unsyncedCount })}>
											{unsyncedCount > 99 ? '99+' : unsyncedCount}
										</span>
									)}
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{!canWritePlan ? (
									<span className='text-sm'>{t('plans.detailsPage.syncWriteDeniedTooltip')}</span>
								) : isSyncing ? (
									<span className='text-sm'>Syncing...</span>
								) : isSyncRunning ? (
									<span className='text-sm'>
										Sync in progress. You can check status in{' '}
										<button
											onClick={() => navigate(`${RouteNames.workflows}?entity_id=${planId}`)}
											className='text-info hover:text-info-deep underline'>
											Workflows
										</button>
										.
									</span>
								) : isFullySynced ? (
									<span className='text-sm'>All subscriptions are already in sync with this plan's prices.</span>
								) : unsyncedCount > 0 ? (
									<span className='text-sm'>{t('plans.detailsPage.unsyncedCountTooltip', { count: unsyncedCount })}</span>
								) : latestRun?.status === 'Completed' ? (
									<span className='text-sm'>Sync completed. You can sync again.</span>
								) : latestRun?.status === 'Failed' ? (
									<span className='text-sm'>Sync failed. You can try again.</span>
								) : (
									<span className='text-sm'>Synchronize plan prices with existing subscriptions</span>
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<DropdownMenu options={dropdownOptions} trigger={<Button variant='outline' prefixIcon={<EllipsisVertical />} size='icon' />} />
				</div>
			}>
			<PlanDrawer data={planData as Plan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlan']} />
			<DuplicatePlanDialog
				planId={planId!}
				plan={planData}
				open={duplicateDialogOpen}
				onOpenChange={setDuplicateDialogOpen}
				refetchQueryKeys={['fetchPlan', 'planEntitlements']}
			/>

			<ApiDocsContent tags={API_DOCS_TAGS.Plans} />

			<div className='border-b border-border mt-4 mb-6'>
				<nav className='flex space-x-4' aria-label={t('common:labels.tabs')}>
					{tabs.map((tab, index) => {
						return (
							<button
								key={tab.id}
								onClick={() => onTabChange(tab.id)}
								className={cn(
									'px-4 py-2 text-sm font-normal transition-colors focus-visible:outline-none',
									index === 0 && 'px-0',
									activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
								)}
								role='tab'
								aria-selected={activeTab === tab.id}>
								{tab.label}
							</button>
						);
					})}
				</nav>
			</div>
			<Outlet />
		</Page>
	);
};

export default PlanDetailsPage;
