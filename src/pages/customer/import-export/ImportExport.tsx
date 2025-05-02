import { Button, Chip, Loader, Page, ShortPagination } from '@/components/atoms';
import { ApiDocsContent, ColumnData, FlexpriceTable, ImportFileDrawer } from '@/components/molecules';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import usePagination from '@/hooks/usePagination';
import { ImportTask } from '@/models/ImportTask';
import TaskApi from '@/api/TaskApi';
import formatDate from '@/utils/common/format_date';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { useQuery } from '@tanstack/react-query';
import { Import, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const mapStatusChips = (status: string) => {
	if (status === 'COMPLETED') {
		return 'Successful';
	} else if (status === 'FAILED') {
		return 'Failed';
	} else if (status === 'PROCESSING' || status === 'PENDING') {
		return 'Queued';
	}
};

const columns: ColumnData<ImportTask>[] = [
	{
		title: 'File Name',
		render(rowData) {
			return <div>{rowData.file_name || '--'}</div>;
		},
		fieldVariant: 'title',
	},
	{
		title: 'Entity Type',
		render(rowData) {
			return <div>{toSentenceCase(rowData.entity_type)}</div>;
		},
	},
	{
		title: 'Status',

		render(rowData) {
			return (
				<Chip variant={rowData?.task_status === 'COMPLETED' ? 'success' : 'default'} label={mapStatusChips(rowData?.task_status || '')} />
			);
		},
	},
	{
		title: 'Started At',
		render: (rowData) => formatDate(rowData.started_at),
	},
	{
		title: 'Updated At',
		render: (rowData) => formatDate(rowData.updated_at),
	},
];
const ImportExport = () => {
	const [drawerOpen, setdrawerOpen] = useState(false);
	const { limit, offset, page } = usePagination();
	const [activeTask, setactiveTask] = useState();

	useEffect(() => {
		if (!drawerOpen) {
			setactiveTask(undefined);
		}
	}, [drawerOpen]);

	const {
		data,
		isLoading,
		error,
		refetch: refetchTasks,
	} = useQuery({
		queryKey: ['importTasks', page],
		queryFn: async () => {
			return await TaskApi.getAllTasks({
				limit,
				offset,
			});
		},
	});

	if (isLoading) {
		return <Loader />;
	}

	if (error) {
		toast.error('Failed to fetch data');
	}

	if (data?.items.length === 0) {
		return (
			<EmptyPage
				onAddClick={() => setdrawerOpen(true)}
				tutorials={GUIDES.importExport.tutorials}
				heading='Import Tasks'
				tags={['Import Export', 'Tasks']}>
				<ImportFileDrawer taskId={activeTask} isOpen={drawerOpen} onOpenChange={(value) => setdrawerOpen(value)} />
			</EmptyPage>
		);
	}

	return (
		<Page
			heading='Bulk Imports'
			headingCTA={
				<>
					<Button
						variant='outline'
						onClick={() => {
							refetchTasks();
						}}>
						<RefreshCw />
					</Button>
					<Button onClick={() => setdrawerOpen(true)} className='flex gap-2 items-center '>
						<Import />
						<span>Import File</span>
					</Button>
				</>
			}>
			<ApiDocsContent tags={['Import Export', 'Tasks']} />
			{/* import export drawer */}
			<ImportFileDrawer taskId={activeTask} isOpen={drawerOpen} onOpenChange={(value) => setdrawerOpen(value)} />

			<div>
				<FlexpriceTable
					onRowClick={(row) => {
						setactiveTask(row.id);
						setdrawerOpen(true);
					}}
					data={data?.items ?? []}
					columns={columns}
					showEmptyRow
				/>

				<ShortPagination unit='Import Tasks' totalItems={data?.pagination.total ?? 0} />
			</div>
		</Page>
	);
};

export default ImportExport;
