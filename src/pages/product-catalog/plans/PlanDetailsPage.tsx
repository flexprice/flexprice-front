// React imports
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router';

// Third-party libraries
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, EyeOff, EllipsisVertical, Pencil, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Internal components
import { Button, CopyIdButton, Loader, Page } from '@/components/atoms';
import { ApiDocsContent, DropdownMenu, DuplicatePlanDialog, PlanDrawer } from '@/components/molecules';
import type { DropdownMenuOption } from '@/components/molecules';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';

// API imports
import { PlanApi, WorkflowApi } from '@/api';

// Core services and routes
import { RouteNames } from '@/core/routes/Routes';

// Models and types
import { Plan, ENTITY_STATUS } from '@/models';

// Constants and utilities
import { getPlanPriceSyncWorkflowFilters } from '@/constants/workflow';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { ServerError } from '@/core/axios/types';
import { INVOICE_CADENCE } from '@/models';
import { SortDirection } from '@/types/common/QueryBuilder';

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
	const navigate = useNavigate();
	const location = useLocation();
	const { planId } = useParams<Params>();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

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

	const { mutate: syncPlan, isPending: isSyncing } = useMutation({
		mutationFn: () => PlanApi.synchronizePlanPricesWithSubscription(planId!),
		onSuccess: () => {
			toast.success('Sync has been started and will take up to 1 hour to complete.');
			void queryClient.invalidateQueries({ queryKey: ['planSyncWorkflows', planId] });
		},
		onError: (error: ServerError) => {
			toast.error(error?.error?.message || 'Error synchronizing plan with subscriptions');
		},
	});

	const { updateBreadcrumb, setSegmentLoading } = useBreadcrumbsStore();

	const dropdownOptions: DropdownMenuOption[] = useMemo(
		() => [
			{
				label: 'Edit',
				icon: <Pencil />,
				onSelect: () => setPlanDrawerOpen(true),
			},
			{
				label: 'Duplicate',
				icon: <Copy />,
				onSelect: () => setDuplicateDialogOpen(true),
			},
			{
				label: 'Archive',
				icon: <EyeOff />,
				onSelect: () => archivePlan(),
				disabled: planData?.status !== ENTITY_STATUS.PUBLISHED,
			},
		],
		[archivePlan, planData?.status],
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
								<span className='inline-block'>
									<Button
										onClick={() => syncPlan()}
										disabled={isSyncing || isSyncRunning}
										isLoading={isSyncing}
										variant='outline'
										className='flex gap-2'>
										<RefreshCw />
										Sync
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{isSyncing ? (
									<span className='text-sm'>Syncing...</span>
								) : isSyncRunning ? (
									<span className='text-sm'>Sync in progress. You can check status in Developer → Workflows.</span>
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

			<ApiDocsContent tags={['Plans']} />

			<div className='border-b border-border mt-4 mb-6'>
				<nav className='flex space-x-4' aria-label='Tabs'>
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
