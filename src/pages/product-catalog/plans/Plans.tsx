import { AddButton, Button, Dialog, Page, Chip } from '@/components/atoms';
import { ApiDocsContent, DropdownMenu, DuplicatePlanDialog, PlanDrawer } from '@/components/molecules';
import type { DropdownMenuOption } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { Plan } from '@/models/Plan';
import { QueryableDataArea } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import { useState, useMemo } from 'react';
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
import formatChips from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';
import toast from 'react-hot-toast';
import { Copy, EllipsisVertical, EyeOff, Pencil, WandSparkles } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

const sortingOptions: SortOption[] = [
	{
		field: 'name',
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: 'created_at',
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: 'updated_at',
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

const filterOptions: FilterField[] = [
	{
		field: 'name',
		label: 'Name',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'lookup_key',
		label: 'Lookup Key',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'status',
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: ENTITY_STATUS.PUBLISHED, label: 'Active' },
			{ value: ENTITY_STATUS.ARCHIVED, label: 'Inactive' },
		],
	},
	{
		field: 'created_at',
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
];

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

const initialSorts: SortOption[] = [
	{
		field: 'updated_at',
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

const PlansPage = () => {
	const [activePlan, setActivePlan] = useState<Plan | null>(null);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
	const [planToDuplicate, setPlanToDuplicate] = useState<Plan | null>(null);
	const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
	const [planToArchive, setPlanToArchive] = useState<Plan | null>(null);
	const navigate = useNavigate();

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
			toast.success('Plan archived successfully');
			setArchiveDialogOpen(false);
			setPlanToArchive(null);
			await refetchQueries('fetchPlans');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to archive plan');
		},
	});

	const handleOnAdd = () => {
		setActivePlan(null);
		setPlanDrawerOpen(true);
	};

	const handleEdit = (plan: Plan) => {
		setActivePlan(plan);
		setPlanDrawerOpen(true);
	};

	const handleDuplicate = (plan: Plan) => {
		setPlanToDuplicate(plan);
		setDuplicateDialogOpen(true);
	};

	const getRowDropdownOptions = (row: Plan): DropdownMenuOption[] => [
		{
			label: 'Edit',
			icon: <Pencil />,
			onSelect: () => handleEdit(row),
		},
		{
			label: 'Duplicate',
			icon: <Copy />,
			onSelect: () => handleDuplicate(row),
		},
		{
			label: 'Archive',
			icon: <EyeOff />,
			onSelect: () => {
				setPlanToArchive(row);
				setArchiveDialogOpen(true);
			},
			disabled: row.status !== ENTITY_STATUS.PUBLISHED,
		},
	];

	const columns: ColumnData<Plan>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: 'Name',
			},
			{
				title: 'Status',
				render: (row) => {
					const label = formatChips(row.status);
					return <Chip variant={label === 'Active' ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: 'Updated at',
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
								<EllipsisVertical className='size-4' />
							</Button>
						}
					/>
				),
			},
		],
		[],
	);

	return (
		<Page
			heading='Plans'
			headingCTA={
				<div className='flex items-center gap-2'>
					{hasAnyPlanInSystem ? (
						<Button
							variant='outline'
							prefixIcon={<WandSparkles className='text-indigo-600' />}
							onClick={() => navigate(RouteNames.pricingSetup, { state: { from: 'plans' } })}
							className='border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700'>
							<span className='analyzing-prompt-shimmer font-medium'>Create with AI</span>
						</Button>
					) : null}
					<AddButton onClick={handleOnAdd} />
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
				title='Archive plan'
				description={`Are you sure you want to archive "${planToArchive?.name}"? This plan will no longer be available for new subscriptions.`}>
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={() => setArchiveDialogOpen(false)}>
						Cancel
					</Button>
					<Button variant='destructive' onClick={() => planToArchive && archivePlan(planToArchive.id)} disabled={isArchiving}>
						{isArchiving ? 'Archiving…' : 'Archive'}
					</Button>
				</div>
			</Dialog>
			<ApiDocsContent tags={['Plans']} />
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
						unit: 'Pricing Plans',
					}}
					emptyStateConfig={{
						customComponent: (
							<div className='mx-auto flex h-[360px] w-full flex-col items-center justify-center rounded-[6px] border border-[#E9E9E9] bg-[#fafafa] px-4'>
								<div className='mb-4 text-center text-[20px] font-medium leading-normal text-gray-700'>Plans</div>
								<div className='mb-8 max-w-[350px] bg-[#F9F9F9] text-center text-[16px] font-normal leading-normal text-gray-400'>
									Create a plan to display pricing and start billing customers.
								</div>
								<Button
									variant='outline'
									prefixIcon={<WandSparkles className='text-black' />}
									onClick={() => navigate(RouteNames.pricingSetup, { state: { from: 'plans' } })}
									className='!border-indigo-200 !bg-white !p-5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700'>
									<span className='analyzing-prompt-shimmer text-sm font-medium'>Create with AI</span>
								</Button>
							</div>
						),
						tags: ['Plans'],
						tutorials: GUIDES.plans.tutorials,
					}}
				/>
			</div>
		</Page>
	);
};

export default PlansPage;
