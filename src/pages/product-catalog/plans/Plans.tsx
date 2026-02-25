import { AddButton, Button, Dialog, Page, Chip } from '@/components/atoms';
import { ApiDocsContent, DropdownMenu, DuplicatePlanDialog, PlanDrawer } from '@/components/molecules';
import type { DropdownMenuOption } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { Plan } from '@/models/Plan';
import { QueryableDataArea } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { Copy, EllipsisVertical, EyeOff, Pencil } from 'lucide-react';
import { ServerError } from '@/core/axios/types';
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

	const { mutate: archivePlan, isPending: isArchiving } = useMutation({
		mutationFn: (id: string) => PlanApi.deletePlan(id),
		onSuccess: async () => {
			toast.success('Plan archived successfully');
			setArchiveDialogOpen(false);
			setPlanToArchive(null);
			await refetchQueries('fetchPlans');
		},
		onError: (error: ServerError) => {
			toast.error(error?.error?.message || 'Failed to archive plan');
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
		<Page heading='Plans' headingCTA={<AddButton onClick={handleOnAdd} />}>
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
						heading: 'Plans',
						description: 'Create a plan to display pricing and start billing customers.',
						buttonLabel: 'Create Plan',
						buttonAction: handleOnAdd,
						tags: ['Plans'],
						tutorials: GUIDES.plans.tutorials,
					}}
				/>
			</div>
		</Page>
	);
};

export default PlansPage;
