import { FormHeader, Loader, Page, Button } from '@/components/atoms';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Play, Pause, Trash2, RefreshCw } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TaskApi, ConnectionApi } from '@/api';
import { ENTITY_STATUS } from '@/models';
import toast from 'react-hot-toast';
import ForceRunDrawer from '@/components/molecules/ForceRunDrawer/ForceRunDrawer';
import TaskRunsTable from '@/components/molecules/TaskRunsTable/TaskRunsTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { formatEntityType } from '@/utils/common/helper_functions';

const ExportDetails = () => {
	const { t } = useTranslation('settings');
	const { i18n } = useTranslation();
	const { connectionId, exportId } = useParams<{ connectionId: string; exportId: string }>();
	const navigate = useNavigate();
	const [isForceRunDrawerOpen, setIsForceRunDrawerOpen] = useState(false);
	const [activeTab, setActiveTab] = useState('overview');

	// Fetch export task details
	const {
		data: exportTask,
		isLoading: isLoadingExport,
		refetch: refetchExport,
	} = useQuery({
		queryKey: ['scheduled-task', exportId],
		queryFn: () => TaskApi.getScheduledTaskById(exportId!),
		enabled: !!exportId,
	});

	// Fetch connection details
	const { data: connection, isLoading: isLoadingConnection } = useQuery({
		queryKey: ['connection', connectionId],
		queryFn: () => ConnectionApi.Get(connectionId!),
		enabled: !!connectionId,
	});

	// Toggle task enabled/disabled
	const { mutate: toggleTask, isPending: isTogglingTask } = useMutation({
		mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => TaskApi.updateScheduledTask(id, { enabled }),
		onSuccess: () => {
			toast.success('Export task updated successfully');
			refetchExport();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update export task');
		},
	});

	// Force run task
	const { mutate: forceRunTask, isPending: isForceRunning } = useMutation({
		mutationFn: ({ id, startTime, endTime }: { id: string; startTime?: string; endTime?: string }) =>
			TaskApi.forceRunScheduledTask(id, startTime && endTime ? { start_time: startTime, end_time: endTime } : undefined),
		onSuccess: () => {
			toast.success('Export task started successfully');
			setIsForceRunDrawerOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to start export task');
		},
	});

	// Delete task
	const { mutate: deleteTask, isPending: isDeletingTask } = useMutation({
		mutationFn: (id: string) => TaskApi.deleteScheduledTask(id),
		onSuccess: () => {
			toast.success('Export task deleted successfully');
			navigate(`/tools/exports/s3/${connectionId}/export`);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete export task');
		},
	});

	const handleToggleTask = () => {
		if (exportTask) {
			toggleTask({ id: exportTask.id, enabled: !exportTask.enabled });
		}
	};

	const handleForceRun = (startTime?: string, endTime?: string) => {
		if (exportTask) {
			forceRunTask({ id: exportTask.id, startTime, endTime });
		}
	};

	const handleDeleteTask = () => {
		if (exportTask && window.confirm('Are you sure you want to delete this export task?')) {
			deleteTask(exportTask.id);
		}
	};

	if (isLoadingExport || isLoadingConnection) {
		return <Loader />;
	}

	const entityLabel = formatEntityType(exportTask?.entity_type ?? '');
	const exportDetailsTitle =
		exportTask && exportTask.status !== ENTITY_STATUS.DELETED
			? t('insightsTools.exports.exportDetailsDocumentTitle', { entity: entityLabel })
			: t('insightsTools.exports.exportNotFound');

	if (!exportTask || exportTask.status === ENTITY_STATUS.DELETED) {
		return (
			<Page heading={t('insightsTools.exports.exportNotFound')}>
				<div className='text-center py-12'>
					<h3 className='text-lg font-medium text-gray-900 mb-2'>{t('insightsTools.exports.exportNotFound')}</h3>
					<p className='text-gray-500 mb-4'>{t('insightsTools.exports.exportNotFoundDescription')}</p>
					<Button onClick={() => navigate(`/tools/exports/s3/${connectionId}/export`)}>{t('insightsTools.exports.backToExports')}</Button>
				</div>
			</Page>
		);
	}

	return (
		<Page documentTitle={exportDetailsTitle} heading={exportDetailsTitle}>
			{/* Back button and Action Buttons */}
			<div className='mb-6 flex items-center justify-between'>
				<Button variant='outline' onClick={() => navigate(`/tools/exports/s3/${connectionId}/export`)} className='flex items-center gap-2'>
					<ArrowLeft className='w-4 h-4' />
					{t('insightsTools.exports.backToExports')}
				</Button>

				<div className='flex gap-2'>
					<Button onClick={handleToggleTask} disabled={isTogglingTask} isLoading={isTogglingTask} className='flex items-center gap-2'>
						{exportTask.enabled ? <Pause className='w-4 h-4' /> : <Play className='w-4 h-4' />}
						{exportTask.enabled ? t('insightsTools.exports.pause') : t('insightsTools.exports.resume')}
					</Button>
					<Button
						variant='outline'
						onClick={() => setIsForceRunDrawerOpen(true)}
						disabled={isForceRunning}
						isLoading={isForceRunning}
						className='flex items-center gap-2'>
						<RefreshCw className='w-4 h-4' />
						{t('insightsTools.exports.manualExport')}
					</Button>
					<Button
						variant='outline'
						onClick={handleDeleteTask}
						disabled={isDeletingTask}
						isLoading={isDeletingTask}
						className='flex items-center gap-2 text-red-600 hover:text-red-700'>
						<Trash2 className='w-4 h-4' />
						{i18n.t('actions.delete', { ns: 'common' })}
					</Button>
				</div>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
				<TabsList className='mb-6'>
					<TabsTrigger value='overview'>{t('insightsTools.exports.overviewTab')}</TabsTrigger>
					<TabsTrigger value='runs'>{t('insightsTools.exports.runsTab')}</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value='overview'>
					{/* Export Details */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{/* Basic Information */}
						<div className='card'>
							<FormHeader variant='form-component-title' title={t('insightsTools.exports.basicInformation')} />
							<div className='space-y-4'>
								<div>
									<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.statusLabel')}</label>
									<div className='flex items-center gap-2 mt-1'>
										<div className={`w-3 h-3 rounded-full ${exportTask.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
										<span className='text-sm text-gray-600'>
											{exportTask.enabled ? i18n.t('status.active', { ns: 'common' }) : i18n.t('status.paused', { ns: 'common' })}
										</span>
									</div>
								</div>
								<div>
									<label className='text-sm font-medium text-gray-900'>{t('exportDrawer.entityType')}</label>
									<p className='text-sm text-gray-600 mt-1'>{formatEntityType(exportTask.entity_type)}</p>
								</div>
								<div>
									<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.intervalLabel')}</label>
									<p className='text-sm text-gray-600 capitalize mt-1'>{exportTask.interval}</p>
								</div>
								<div>
									<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.connectionLabel')}</label>
									<p className='text-sm text-gray-600 mt-1'>{connection?.name || i18n.t('labels.unknown', { ns: 'common' })}</p>
								</div>
							</div>
						</div>

						{/* S3 Configuration */}
						<div className='card'>
							<FormHeader variant='form-component-title' title={t('insightsTools.exports.s3Configuration')} />
							<div className='space-y-4'>
								<div>
									<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.bucketLabel')}</label>
									<p className='text-sm text-gray-600 mt-1'>{exportTask.job_config.bucket}</p>
								</div>
								<div>
									<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.regionLabel')}</label>
									<p className='text-sm text-gray-600 mt-1'>{exportTask.job_config.region}</p>
								</div>
								<div className='min-w-0'>
									<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.keyPrefixLabel')}</label>
									<p className='text-sm text-gray-600 mt-1 break-all min-w-0'>
										{exportTask.job_config?.key_prefix ?? i18n.t('labels.na', { ns: 'common' })}
									</p>
								</div>
								<div>
									<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.compressionLabel')}</label>
									<p className='text-sm text-gray-600 mt-1'>{exportTask.job_config.compression || t('exportDrawer.compression.none')}</p>
								</div>
								<div>
									<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.encryptionLabel')}</label>
									<p className='text-sm text-gray-600 mt-1'>
										{exportTask.job_config.encryption || t('insightsTools.exports.fallbackEncryptionDisplay')}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Timestamps */}
					<div className='card mt-6'>
						<FormHeader variant='form-component-title' title={t('insightsTools.exports.timestamps')} />
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.createdAt')}</label>
								<p className='text-sm text-gray-600 mt-1'>{new Date(exportTask.created_at).toLocaleString()}</p>
							</div>
							<div>
								<label className='text-sm font-medium text-gray-900'>{t('insightsTools.exports.lastUpdated')}</label>
								<p className='text-sm text-gray-600 mt-1'>{new Date(exportTask.updated_at).toLocaleString()}</p>
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Runs Tab */}
				<TabsContent value='runs'>
					<TaskRunsTable scheduledTaskId={exportId!} taskType='EXPORT' />
				</TabsContent>
			</Tabs>

			{/* Force Run Drawer */}
			<ForceRunDrawer
				isOpen={isForceRunDrawerOpen}
				onOpenChange={setIsForceRunDrawerOpen}
				onConfirm={handleForceRun}
				isLoading={isForceRunning}
			/>
		</Page>
	);
};

export default ExportDetails;
