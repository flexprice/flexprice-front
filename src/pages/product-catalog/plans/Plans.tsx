import { AddButton, Button, Dialog, Page, Chip, Tooltip } from '@/components/atoms';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import { ApiDocsContent, DropdownMenu, DuplicatePlanDialog, PlanDrawer, getCopyIdOption } from '@/components/molecules';
import type { DropdownMenuOption } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { Plan } from '@/models/Plan';
import { QueryableDataArea } from '@/components/organisms';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PlanApi } from '@/api/PlanApi';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import { ENTITY_STATUS } from '@/models';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import toast from 'react-hot-toast';
import { Copy, EyeOff, Pencil, WandSparkles } from 'lucide-react';
import { BsThreeDots } from 'react-icons/bs';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { useTranslation } from 'react-i18next';

const initialFilters: FilterCondition[] = [
	{
		field: 'name',
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-name',
	},
	{
		field: 'lookup_key',
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-lookup_key',
	},
	{
		field: 'status',
		operator: FilterOperator.IN,
		valueArray: [ENTITY_STATUS.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

const PlansPage = () => {
	const { t, i18n } = useTranslation(['catalog', 'common']);
	const { t: tGuide } = useTranslation('guides');
	const { t: tc } = useTranslation('common');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const [activePlan, setActivePlan] = useState<Plan | null>(null);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
	const [planToDuplicate, setPlanToDuplicate] = useState<Plan | null>(null);
	const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
	const [planToArchive, setPlanToArchive] = useState<Plan | null>(null);
	const navigate = useNavigate();
	const { can } = useCurrentUserPermissions();
	// Computed once and reused everywhere on this page that needs the same
	// decision, rather than each control independently re-deriving it.
	const canWritePlan = can('plan', 'write');
	// orchestrateSetup (src/api/ai/orchestrator.ts) can create features, plans, prices, and -
	// depending on what the AI-derived schema calls for - entitlements and credit grants. The
	// schema isn't known until after the user describes their pricing, so this CTA has to gate
	// on every permission the flow could ever need; missing any one of them lets a user start a
	// flow that then fails partway through, leaving partially-created plan data behind.
	const canUseAiPricing =
		canWritePlan && can('feature', 'write') && can('price', 'write') && can('entitlement', 'write') && can('creditgrant', 'write');

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('plans.listPage.sortLabels.name'),
				direction: SortDirection.ASC,
			},
			{
				field: 'created_at',
				label: t('plans.listPage.sortLabels.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'updated_at',
				label: t('plans.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('plans.listPage.filterLabels.name'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'lookup_key',
				label: t('plans.listPage.filterLabels.lookupKey'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'status',
				label: t('plans.listPage.filterLabels.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: ENTITY_STATUS.PUBLISHED, label: t('plans.listPage.filterStatus.active') },
					{ value: ENTITY_STATUS.ARCHIVED, label: t('plans.listPage.filterStatus.inactive') },
				],
			},
			{
				field: 'created_at',
				label: t('plans.listPage.filterLabels.createdAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'updated_at',
				label: t('plans.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	/** When the account has at least one plan, show Create with AI in the header; hide it on the true empty state to avoid duplicating the in-panel CTA. */
	const { data: hasAnyPlanInSystem } = useQuery({
		queryKey: ['fetchPlans', 'header-probe-has-plans'],
		queryFn: async () => {
			const response = await PlanApi.getPlansByFilter({ limit: 1, offset: 0, filters: [], sort: [] });
			const total = response.pagination?.total;
			if (typeof total === 'number') return total > 0;
			return (response.items?.length ?? 0) > 0;
		},
	});

	const { mutate: archivePlan, isPending: isArchiving } = useMutation({
		mutationFn: (id: string) => PlanApi.deletePlan(id),
		onSuccess: async () => {
			toast.success(i18n.t('catalog:plans.listPage.toast.archiveSuccess'));
			setArchiveDialogOpen(false);
			setPlanToArchive(null);
			await refetchQueries('fetchPlans');
		},
		onError: (error: Error) => {
			toast.error(error.message || i18n.t('catalog:plans.listPage.toast.archiveErrorFallback'));
		},
	});

	const handleOnAdd = useCallback(() => {
		setActivePlan(null);
		setPlanDrawerOpen(true);
	}, []);

	const handleEdit = useCallback((plan: Plan) => {
		setActivePlan(plan);
		setPlanDrawerOpen(true);
	}, []);

	const handleDuplicate = useCallback((plan: Plan) => {
		setPlanToDuplicate(plan);
		setDuplicateDialogOpen(true);
	}, []);

	const getRowDropdownOptions = useCallback(
		(row: Plan): DropdownMenuOption[] => {
			return [
				getCopyIdOption(row.id, tc, { entityType: 'Plan' }),
				{
					label: t('plans.listPage.rowActions.edit'),
					icon: <Pencil />,
					onSelect: () => handleEdit(row),
					disabled: !canWritePlan,
					disabledReason: canWritePlan ? undefined : t('plans.listPage.writeDeniedTooltip'),
				},
				{
					label: t('plans.listPage.rowActions.duplicate'),
					icon: <Copy />,
					onSelect: () => handleDuplicate(row),
					disabled: !canWritePlan,
					disabledReason: canWritePlan ? undefined : t('plans.listPage.writeDeniedTooltip'),
				},
				{
					label: t('plans.listPage.rowActions.archive'),
					icon: <EyeOff />,
					onSelect: () => {
						setPlanToArchive(row);
						setArchiveDialogOpen(true);
					},
					disabled: row.status !== ENTITY_STATUS.PUBLISHED || !canWritePlan,
					disabledReason: canWritePlan ? undefined : t('plans.listPage.writeDeniedTooltip'),
				},
			];
		},
		[t, tc, handleEdit, handleDuplicate, canWritePlan],
	);

	const columns: ColumnData<Plan>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: t('plans.listPage.columns.name'),
			},
			{
				title: t('plans.listPage.columns.status'),
				render: (row) => {
					const isActive = row.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('plans.listPage.filterStatus.active') : t('plans.listPage.filterStatus.inactive');
					return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('plans.listPage.columns.updatedAt'),
				render: (row) => {
					return formatDate(row.updated_at);
				},
			},
			{
				fieldVariant: 'interactive',
				render: (row) => (
					<DropdownMenu
						options={getRowDropdownOptions(row)}
						trigger={
							<Button variant='ghost' size='icon' className='size-8'>
								<BsThreeDots className='size-4' />
							</Button>
						}
					/>
				),
			},
		],
		[t, getRowDropdownOptions],
	);

	const emptyStateCustom = useMemo(
		() => (
			<div className='mx-auto flex h-[360px] w-full flex-col items-center justify-center rounded-[6px] border border-line-hairline bg-surface-faint px-4 dark:border-line dark:bg-surface'>
				<div className='mb-4 text-center text-[20px] font-medium leading-normal text-content-secondary'>
					{t('plans.listPage.emptyStateCustom.heading')}
				</div>
				<div className='mb-8 max-w-[350px] bg-surface-faint-inner text-center text-[16px] font-normal leading-normal text-content-subtle dark:bg-transparent'>
					{t('plans.listPage.emptyStateCustom.description')}
				</div>
				{canUseAiPricing ? (
					<Button
						variant='outline'
						prefixIcon={<WandSparkles className='text-content-black' />}
						onClick={() => navigate(RouteNames.pricingSetup, { state: { from: 'plans' } })}
						className='!border-accent-indigo-line !bg-surface !p-5 text-accent-indigo hover:bg-accent-indigo-muted hover:text-accent-indigo-strong'>
						<span className='analyzing-prompt-shimmer text-sm font-medium'>{t('plans.listPage.createWithAi')}</span>
					</Button>
				) : (
					<Tooltip content={t('plans.listPage.aiPricingWriteDeniedTooltip')}>
						<span tabIndex={0} className='inline-block cursor-not-allowed'>
							<Button
								disabled
								variant='outline'
								prefixIcon={<WandSparkles className='text-content-black' />}
								className='!border-accent-indigo-line !bg-surface !p-5 text-accent-indigo'>
								<span className='text-sm font-medium'>{t('plans.listPage.createWithAi')}</span>
							</Button>
						</span>
					</Tooltip>
				)}
			</div>
		),
		[t, navigate, canUseAiPricing],
	);

	return (
		<Page
			heading={t('plans.listPage.title')}
			headingCTA={
				<div className='flex items-center gap-2'>
					{hasAnyPlanInSystem &&
						(canUseAiPricing ? (
							<Button
								variant='outline'
								prefixIcon={<WandSparkles className='text-accent-indigo' />}
								onClick={() => navigate(RouteNames.pricingSetup, { state: { from: 'plans' } })}
								className='border-accent-indigo-line text-accent-indigo hover:bg-accent-indigo-muted hover:text-accent-indigo-strong'>
								<span className='analyzing-prompt-shimmer font-medium'>{t('plans.listPage.createWithAi')}</span>
							</Button>
						) : (
							<Tooltip content={t('plans.listPage.aiPricingWriteDeniedTooltip')}>
								<span tabIndex={0} className='inline-block cursor-not-allowed'>
									<Button
										disabled
										variant='outline'
										prefixIcon={<WandSparkles className='text-accent-indigo' />}
										className='border-accent-indigo-line text-accent-indigo'>
										<span className='font-medium'>{t('plans.listPage.createWithAi')}</span>
									</Button>
								</span>
							</Tooltip>
						))}
					{canWritePlan ? (
						<AddButton onClick={handleOnAdd} />
					) : (
						<Tooltip content={t('plans.listPage.writeDeniedTooltip')}>
							<span tabIndex={0} className='inline-block cursor-not-allowed'>
								<AddButton disabled onClick={handleOnAdd} />
							</span>
						</Tooltip>
					)}
				</div>
			}>
			<PlanDrawer data={activePlan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlans']} />
			<DuplicatePlanDialog
				planId={planToDuplicate?.id ?? ''}
				plan={planToDuplicate}
				open={duplicateDialogOpen}
				onOpenChange={(open) => {
					setDuplicateDialogOpen(open);
					if (!open) setPlanToDuplicate(null);
				}}
				refetchQueryKeys={['fetchPlans']}
			/>
			<Dialog
				isOpen={archiveDialogOpen}
				onOpenChange={setArchiveDialogOpen}
				title={t('plans.archive.title')}
				description={t('plans.archive.confirmDescription', { name: planToArchive?.name ?? '' })}>
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={() => setArchiveDialogOpen(false)}>
						{t('common:actions.cancel')}
					</Button>
					<Button variant='destructive' onClick={() => planToArchive && archivePlan(planToArchive.id)} disabled={isArchiving}>
						{isArchiving ? t('plans.archive.archiving') : t('common:actions.archive')}
					</Button>
				</div>
			</Dialog>
			<ApiDocsContent tags={API_DOCS_TAGS.Plans} />
			<div className='space-y-6'>
				<QueryableDataArea<Plan>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 300,
					}}
					dataConfig={{
						queryKey: 'fetchPlans',
						fetchFn: async (params) => {
							const response = await PlanApi.getPlansByFilter(params);
							return {
								items: response.items as Plan[],
								pagination: response.pagination,
							};
						},
						probeFetchFn: async (params) => {
							const response = await PlanApi.getPlansByFilter({
								...params,
								limit: 1,
								offset: 0,
								filters: [],
								sort: [],
							});
							return {
								items: response.items as Plan[],
								pagination: response.pagination,
							};
						},
					}}
					tableConfig={{
						columns,
						onRowClick: (row) => {
							navigate(RouteNames.plan + `/${row.id}`);
						},
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: t('plans.listPage.paginationUnit'),
					}}
					emptyStateConfig={{
						customComponent: emptyStateCustom,
						tags: API_DOCS_TAGS.Plans,
						tutorials: guides.plans.tutorials,
					}}
				/>
			</div>
		</Page>
	);
};

export default PlansPage;
