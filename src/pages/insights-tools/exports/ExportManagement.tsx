import { FormHeader, Loader, Page, Button } from '@/components/atoms';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Eye, Settings } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TaskApi, ConnectionApi } from '@/api';
import toast from 'react-hot-toast';
import ExportDrawer from '@/components/molecules/ExportDrawer/ExportDrawer';
import { formatEntityType } from '@/utils/common/helper_functions';

const ExportManagement = () => {
	const { connectionId } = useParams<{ connectionId: string }>();
	const navigate = useNavigate();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	// Fetch connection details
	const { data: connection, isLoading: isLoadingConnection } = useQuery({
		queryKey: ['connection', connectionId],
		queryFn: () => ConnectionApi.getConnectionById(connectionId!),
		enabled: !!connectionId,
	});

	// Fetch scheduled tasks for this connection
	const {
		data: tasksResponse,
		refetch: refetchTasks,
		isLoading: isLoadingTasks,
	} = useQuery({
		queryKey: ['scheduled-tasks', connectionId],
		queryFn: () => TaskApi.getAllScheduledTasks({ connection_id: connectionId! }),
		enabled: !!connectionId,
	});

	// Filter out deleted tasks
	const tasks = (tasksResponse?.items || []).filter((task) => task.status !== 'deleted');

	// Delete task mutation
	const { mutate: deleteTask, isPending: isDeletingTask } = useMutation({
		mutationFn: (id: string) => TaskApi.deleteScheduledTask(id),
		onSuccess: () => {
			toast.success('Export task deleted successfully');
			refetchTasks();
		},
		onError: (error: any) => {
			toast.error(error?.message || 'Failed to delete export task');
		},
	});

	const handleSaveExport = () => {
		refetchTasks();
	};

	const handleDeleteTask = (id: string, entityType: string) => {
		if (window.confirm(`Are you sure you want to delete the ${formatEntityType(entityType)} export task?`)) {
			deleteTask(id);
		}
	};

	const handleViewDetails = (taskId: string) => {
		navigate(`/tools/exports/s3/${connectionId}/export/${taskId}`);
	};

	if (isLoadingConnection || isLoadingTasks) {
		return <Loader />;
	}

	return (
		<Page heading={`Export Management - ${connection?.name || 'S3 Connection'}`}>
			{/* Back button and Add Export Button */}
			<div className='mb-6 flex items-center justify-between'>
				<Button variant='outline' onClick={() => navigate('/tools/exports/s3')} className='flex items-center gap-2'>
					<ArrowLeft className='w-4 h-4' />
					Back to S3 Connections
				</Button>
				<Button
					onClick={() => {
						setIsDrawerOpen(true);
					}}
					className='flex items-center gap-2'>
					<Plus className='w-4 h-4' />
					Add Export Task
				</Button>
			</div>

			{/* Exports List */}
			{tasks.length > 0 ? (
				<div className='mb-8'>
					<FormHeader variant='form-component-title' title='Export Tasks' />
					<div className='card'>
						{tasks.map((task, idx) => (
							<div key={idx} className='flex items-center justify-between text-sm p-4 border-b last:border-b-0'>
								<div className='flex-1'>
									<div className='flex items-center gap-3'>
										<div className={`w-3 h-3 rounded-full ${task.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
										<div>
											<p className='text-gray-900 font-medium'>{formatEntityType(task.entity_type)} Export</p>
											<p className='text-xs text-gray-500'>
												{task.interval} • {task.job_config.bucket} • {task.job_config.region}
											</p>
										</div>
									</div>
								</div>
								<div className='flex items-center gap-6'>
									<Button variant='outline' size='sm' onClick={() => handleViewDetails(task.id)} className='flex items-center gap-1'>
										<Eye className='w-3 h-3' />
										View
									</Button>
									<Button
										variant='outline'
										size='icon'
										onClick={() => handleDeleteTask(task.id, task.entity_type)}
										disabled={isDeletingTask}
										isLoading={isDeletingTask}>
										<Trash2 className='size-4' />
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className='card text-center py-12'>
					<div className='text-gray-500 mb-4'>
						<Settings className='w-12 h-12 mx-auto mb-4 text-gray-300' />
						<h3 className='text-lg font-medium text-gray-900 mb-2'>No Export Tasks</h3>
						<p className='text-gray-500 mb-4'>Create your first export task to start syncing data to S3.</p>
						<Button
							onClick={() => {
								setIsDrawerOpen(true);
							}}
							className='flex items-center gap-2 mx-auto'>
							<Plus className='w-4 h-4' />
							Add Export Task
						</Button>
					</div>
				</div>
			)}

			{/* Export Drawer */}
			<ExportDrawer
				isOpen={isDrawerOpen}
				onOpenChange={(open) => {
					setIsDrawerOpen(open);
				}}
				connectionId={connectionId!}
				exportTask={null}
				onSave={handleSaveExport}
			/>
		</Page>
	);
};

export default ExportManagement;
