import { FormHeader, Loader, Page, Button, AddButton } from '@/components/atoms';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Trash2, Eye, Plus } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TaskApi, ConnectionApi } from '@/api';
import { ENTITY_STATUS } from '@/models';
import toast from 'react-hot-toast';
import ExportDrawer from '@/components/molecules/ExportDrawer/ExportDrawer';
import { formatEntityType } from '@/utils/common/helper_functions';

const ExportManagement = () => {
	const { t } = useTranslation('settings');
	const { i18n } = useTranslation();
	const { connectionId } = useParams<{ connectionId: string }>();
	const navigate = useNavigate();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	// Fetch connection details
	const { data: connection, isLoading: isLoadingConnection } = useQuery({
		queryKey: ['connection', connectionId],
		queryFn: () => ConnectionApi.Get(connectionId!),
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
	const tasks = (tasksResponse?.items || []).filter((task) => task.status !== ENTITY_STATUS.DELETED);

	// Delete task mutation
	const { mutate: deleteTask, isPending: isDeletingTask } = useMutation({
		mutationFn: (id: string) => TaskApi.deleteScheduledTask(id),
		onSuccess: () => {
			toast.success('Export task deleted successfully');
			refetchTasks();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete export task');
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

	const connectionDisplayName = connection?.name ?? t('insightsTools.exports.fallbackS3ConnectionName');
	const pageTitle = t('insightsTools.exports.exportManagementDocumentTitle', { name: connectionDisplayName });

	return (
		<Page documentTitle={pageTitle} heading={pageTitle}>
			{/* Back button and Add Export Button */}
			<div className='mb-6 flex items-center justify-between'>
				<Button variant='outline' onClick={() => navigate('/tools/exports/s3')} className='flex items-center gap-2'>
					<ArrowLeft className='w-4 h-4' />
					{t('insightsTools.exports.backToS3Connections')}
				</Button>
				<AddButton
					onClick={() => {
						setIsDrawerOpen(true);
					}}
				/>
			</div>

			{/* Exports List */}
			{tasks.length > 0 ? (
				<div className='mb-8'>
					<FormHeader variant='form-component-title' title={t('insightsTools.exports.exportTasksTitle')} />
					<div className='card'>
						{tasks.map((task, idx) => (
							<div key={idx} className='flex items-center justify-between text-sm p-4 border-b last:border-b-0'>
								<div className='flex-1'>
									<div className='flex items-center gap-3'>
										<div className={`w-3 h-3 rounded-full ${task.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
										<div>
											<p className='text-gray-900 font-medium'>
												{t('insightsTools.exports.entityExportSuffix', { entity: formatEntityType(task.entity_type) })}
											</p>
											<p className='text-xs text-gray-500'>
												{task.interval} • {task.job_config.bucket} • {task.job_config.region}
											</p>
										</div>
									</div>
								</div>
								<div className='flex items-center gap-6'>
									<Button variant='outline' size='sm' onClick={() => handleViewDetails(task.id)} className='flex items-center gap-1'>
										<Eye className='w-3 h-3' />
										{i18n.t('actions.view', { ns: 'common' })}
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
				<div className='card text-center !py-12'>
					<div className='text-gray-500 mb-4'>
						<h3 className='text-lg font-medium text-gray-900 mb-2'>{t('insightsTools.exports.noExportTasks')}</h3>
						<p className='text-gray-500 mb-4 max-w-[500px] mx-auto'>{t('insightsTools.exports.noExportTasksHint')}</p>
						<Button
							variant='outline'
							onClick={() => {
								setIsDrawerOpen(true);
							}}
							className='!p-5 !bg-[#fbfbfb] !border-[#CFCFCF] flex items-center gap-2 mx-auto'>
							<Plus className='w-4 h-4' />
							{t('insightsTools.exports.addExportTask')}
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
				connection={connection}
				exportTask={null}
				onSave={handleSaveExport}
			/>
		</Page>
	);
};

export default ExportManagement;
