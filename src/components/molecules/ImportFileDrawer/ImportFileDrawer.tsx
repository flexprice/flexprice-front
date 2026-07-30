import { Button, Chip, FormHeader, Select, SelectOption, Sheet, Spacer } from '@/components/atoms';
import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CSVBoxButton } from '@csvbox/react';
import { cn } from '@/lib/utils';
import { CircleAlert, Download, LoaderCircleIcon, RefreshCcw, X } from 'lucide-react';
import formatDate from '@/utils/common/format_date';
import { useMutation, useQuery } from '@tanstack/react-query';
import TaskApi from '@/api/TaskApi';
import { ImportTask } from '@/models/ImportTask';
import { toSentenceCase } from '@/utils/common/helper_functions';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
	taskId?: string;
}

interface ImportMeta {
	user_id: string;
	destination_type: string;
	env_name: string;
	ev_failed: number;
	external_validation: number;
	external_validations_failed_requests: number;
	import_description: string;
	import_endtime: number;
	import_id: number;
	import_starttime: number;
	import_status: string;
	original_filename: string;
	raw_file: string;
	row_count: number;
	row_fail: number;
	row_success: number;
	sheet_id: number;
	sheet_name: string;
}

const getLicenseKey = (tab: string): string => {
	switch (tab.toLowerCase()) {
		// this is original license key for events
		case 'events':
			return 'Nd50fKMwC54Ri7AoD4ifG1dxL7koqW';

		// this is original license key for customers
		case 'customers':
			return 'W5t0iJSKSM3AH8Etzq9Jf3X3lvsKuw';

		case 'features':
			return '2tzeM0vIEIITBYCuSStqjhJnhJIhfi';
		case 'feature_mapping':
			return 'HwXBfGhJ7Qq4qikGTTeMcUqkBocl5V';
		case 'prices':
			return '3DzHoox4HqnuXcpdmjmgxNRGRR0RWP';
		default:
			return 'Nd50fKMwC54Ri7AoD4ifG1dxL7koqW';
	}
};

const getSampleFileUrl = (tab: string): string => {
	switch (tab.toLowerCase()) {
		case 'events':
			return '/assets/csv/sample.csv';
		case 'customer':
		case 'customers':
			return '/assets/csv/sample_customer.csv';
		case 'feature':
		case 'features':
			return '/assets/csv/sample_feature.csv';
		case 'feature_mapping':
			return '/assets/csv/sample_feature_mapping.csv';
		case 'prices':
			return '/assets/csv/sample_prices.csv';
		default:
			return '/assets/csv/sample_event.csv';
	}
};

const getTaskStatusChips = (status: string, t: (k: string) => string) => {
	const mapStatusChips = (s: string) => {
		if (s === 'COMPLETED') return t('import.taskStatus.successful');
		if (s === 'FAILED') return t('import.taskStatus.failed');
		if (s === 'PROCESSING' || s === 'PENDING') return t('import.taskStatus.queued');
		return s;
	};
	if (status === 'COMPLETED') {
		return <Chip variant='success' label={mapStatusChips(status)} />;
	} else if (status === 'FAILED') {
		return <Chip variant='failed' label={mapStatusChips(status)} />;
	} else if (status === 'PROCESSING' || status === 'PENDING') {
		return <Chip variant='default' label={mapStatusChips(status)} />;
	} else {
		return <Chip variant='default' label={status} />;
	}
};

const ImportFileDrawer: FC<Props> = ({ isOpen, onOpenChange, taskId }) => {
	const { t } = useTranslation(['settings', 'common']);

	const importTypeOptions: SelectOption[] = useMemo(
		() => [
			{ label: t('import.entityTypes.events'), value: 'EVENTS' },
			{ label: t('import.entityTypes.customers'), value: 'CUSTOMERS' },
			{ label: t('import.entityTypes.features'), value: 'FEATURES' },
			{ label: t('import.entityTypes.prices'), value: 'PRICES' },
		],
		[t],
	);
	const fileTypeOptions: SelectOption[] = useMemo(
		() => [
			{ label: t('import.fileTypes.csv'), value: 'CSV' },
			{ label: t('import.fileTypes.json'), value: 'JSON' },
		],
		[t],
	);

	const taskTypeOptions: SelectOption[] = useMemo(
		() => [
			{ label: t('import.taskTypes.import'), value: 'IMPORT' },
			{ label: t('import.taskTypes.export'), value: 'EXPORT' },
		],
		[t],
	);

	const [uploadedFile, setUploadedFile] = useState<Partial<ImportMeta>>();

	const [entityType, setEntityType] = useState<SelectOption>();
	const [uploadedTaskDetails, setuploadedTaskDetails] = useState<ImportTask>();

	const csvBoxKey = useMemo(
		() => `${entityType?.value ? getLicenseKey(entityType.value) : ''}-${JSON.stringify(entityType?.label)}`,
		[entityType],
	);

	const [errors, seterrors] = useState({
		file: '',
		entity_type: '',
		file_type: '',
		task_type: '',
	});

	const {
		mutate: addTask,
		data: task,
		isPending,
		// error,
	} = useMutation({
		mutationFn: async (data?: Partial<ImportMeta>) => {
			return await TaskApi.addTask({
				entity_type: entityType?.value || '',
				file_type: fileTypeOptions[0].value,
				file_url: (data?.raw_file ?? uploadedFile?.raw_file) || '',
				task_type: taskTypeOptions[0].value,
				file_name: (data?.original_filename ?? uploadedFile?.original_filename) || '',
			});
		},
		onSuccess: async () => {
			setEntityType(undefined);
			setUploadedFile(undefined);
			await refetchQueries('importTasks');
		},
		onError: (error: Error) => {
			toast.error(error.message || t('common:toast.genericError'));
		},
	});

	const {
		data: importTask,
		isLoading,
		refetch: refreshTaskStatus,
	} = useQuery({
		queryKey: ['task', taskId ?? task?.id],
		queryFn: async (): Promise<ImportTask> => {
			return await TaskApi.getTaskById((taskId ?? task?.id) || '');
		},
		enabled: Boolean(taskId ?? task?.id) && isOpen,
	});

	useEffect(() => {
		if (importTask) {
			setuploadedTaskDetails(importTask);
		}
	}, [importTask]);

	useEffect(() => {
		if (!isOpen) {
			setUploadedFile(undefined);
			setEntityType(undefined);
			seterrors({
				file: '',
				entity_type: '',
				file_type: '',
				task_type: '',
			});
			setuploadedTaskDetails(undefined);
		}
	}, [isOpen]);

	const importDetails = useMemo(
		() => [
			{
				label: t('import.detailLabels.type'),
				value: uploadedTaskDetails?.entity_type && toSentenceCase(uploadedTaskDetails.entity_type),
			},
			{
				label: t('import.detailLabels.status'),
				value: getTaskStatusChips(uploadedTaskDetails?.task_status || '', t),
			},
			{
				label: t('import.detailLabels.importStartedAt'),
				value: uploadedTaskDetails?.started_at ? formatDate(new Date(uploadedTaskDetails.started_at)) : formatDate(new Date()),
			},
			{
				label: t('import.detailLabels.importCompletedAt'),
				value: uploadedTaskDetails?.completed_at ? formatDate(new Date(uploadedTaskDetails.completed_at)) : formatDate(new Date()),
			},
		],
		[uploadedTaskDetails, t],
	);

	const processedRows = useMemo(
		() => [
			{
				label: t('import.rowStats.totalRows'),
				value:
					uploadedTaskDetails?.total_records || uploadedTaskDetails?.successful_records || 0 + (uploadedTaskDetails?.failed_records || 0),
			},
			{
				label: t('import.rowStats.failedRows'),
				value: uploadedTaskDetails?.failed_records,
			},
			{
				label: t('import.rowStats.successfulRows'),
				value: uploadedTaskDetails?.successful_records,
			},
		],
		[uploadedTaskDetails, t],
	);

	const handleImport = (file?: Partial<ImportMeta>) => {
		seterrors({} as any);
		if (!file && !uploadedFile) {
			seterrors((prev) => ({ ...prev, file: t('import.validation.uploadFile') }));
		}
		if (!entityType) {
			seterrors((prev) => ({ ...prev, entity_type: t('import.validation.selectEntityType') }));
		}

		if (file || (uploadedFile && entityType)) {
			addTask(file || uploadedFile);
		}
	};

	if (isLoading && taskId) {
		return null;
	}

	return (
		<div>
			<Sheet
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				title={t('common:labels.importFile')}
				description={t('common:labels.importFileDescription')}>
				<div className='mt-6'>
					{!uploadedTaskDetails && (
						<Select
							error={errors.entity_type}
							options={importTypeOptions}
							value={entityType?.value}
							label={t('common:labels.importType')}
							onChange={(value) => {
								setEntityType(importTypeOptions.find((option) => option.value === value));
							}}
							description={t('common:labels.selectImportType')}
						/>
					)}
					<Spacer height={12} />
					{uploadedTaskDetails && (
						<div
							className={cn(
								'w-full flex justify-between items-center gap-2 group min-h-9 rounded-md border-dashed bg-gray-200 bg-background border px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:opacity-50 md:text-sm disabled:cursor-not-allowed',
								'focus-within:border-black',
								'mb-4',
							)}>
							{uploadedTaskDetails?.file_name || t('common:labels.na')}
							<button
								onClick={() => {
									setuploadedTaskDetails(undefined);
									setUploadedFile(undefined);
								}}
								className='size-4'>
								<Download
									className='size-4 underline'
									onClick={() => {
										window.open(uploadedTaskDetails?.file_url, '_blank');
									}}
								/>
							</button>
						</div>
					)}

					{entityType?.value && (
						<>
							{uploadedFile && !uploadedTaskDetails ? (
								<div
									className={cn(
										'w-full flex justify-between items-center gap-2 group min-h-9 rounded-md border-dashed bg-gray-200 bg-background border px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:opacity-50 md:text-sm disabled:cursor-not-allowed',
										'focus-within:border-black',
										'mb-4',
									)}>
									{uploadedFile.original_filename}
									<button
										onClick={() => {
											setuploadedTaskDetails(undefined);
											setUploadedFile(undefined);
										}}
										className='size-4'>
										<X className='size-4' />
									</button>
								</div>
							) : (
								<div className='space-y-4'>
									<CSVBoxButton
										key={csvBoxKey}
										user='user_id'
										onImport={(data: boolean, meta: ImportMeta) => {
											setUploadedFile(meta);
											if (data) {
												handleImport(meta);
												toast.success(t('import.toast.uploadSuccess', { filename: meta.original_filename }));
											} else {
												toast.error(t('import.toast.uploadFailed', { filename: meta.original_filename }));
											}
										}}
										licenseKey={getLicenseKey(entityType?.value || '')}
										render={(launch, isLoading) => (
											<div onClick={launch} className='cursor-pointer'>
												<div className='space-y-1 w-full flex flex-col'>
													{/* Label */}
													<label className={cn(' block text-sm font-medium', 'text-zinc-950')}>{t('import.importFileLabel')}</label>
													<div aria-disabled={isLoading} className={cn(isLoading && 'text-zinc-500')}>
														<button className={'p-2 border border-[#E4E4E7] rounded-lg py-2 px-4 w-full'}>
															<p className='font-medium text-sm flex gap-2 items-center justify-start'>{t('import.chooseFile')}</p>
														</button>
													</div>
													<p className={cn('text-sm', 'text-muted-foreground')}>{t('import.maxFileSizeHint')}</p>
													{errors.file && <p className='text-sm text-destructive'>{errors.file}</p>}
												</div>
											</div>
										)}
									/>
									<div className='card !px-4 !py-3 border flex  items-start mb-2 gap-3'>
										<div className='py-1'>
											<CircleAlert className='size-4' />
										</div>
										<div className='flex flex-col justify-start items-start'>
											<FormHeader
												title={t('common:labels.compareFileFormatting')}
												variant='form-component-title'
												className='mb-0'
												titleClassName='mb-0'
												subtitle={t('common:labels.maxFileSizeSubtitle')}
											/>
											<Button
												className='flex gap-2 !p-0 m-0 underline'
												variant={'link'}
												onClick={() => {
													window.open(getSampleFileUrl(entityType?.value || ''), '_blank');
												}}>
												{t('common:labels.sampleCsv')}
												<Download className='size-4 underline' />
											</Button>
										</div>
									</div>
								</div>
							)}
						</>
					)}

					<div>
						{uploadedTaskDetails && (
							<div>
								<FormHeader title={t('common:labels.importDetails')} variant='form-component-title' />

								<div className='space-y-4 mt-4'>
									{importDetails.map((detail, index) => (
										<div key={index} className='flex justify-between items-start gap-2'>
											<p className='text-sm text-muted-foreground'>{detail.label}</p>
											<div className='text-sm text-zinc-950 text-end'>{detail.value}</div>
										</div>
									))}
								</div>
								<div className='h-[1px] bg-[#E4E4E7] my-4'></div>
								<div className='space-y-4 mt-4'>
									{processedRows.map((detail, index) => (
										<div key={index} className='flex justify-between'>
											<p className='text-sm text-muted-foreground'>{detail.label}</p>
											<p className='text-sm'>{detail.value}</p>
										</div>
									))}
								</div>
							</div>
						)}
						<Spacer height={12} />
						{uploadedTaskDetails?.task_status === 'PENDING' ||
							(uploadedTaskDetails?.task_status === 'PROCESSING' && (
								<Button
									disabled={isPending || isLoading}
									onClick={() => {
										refreshTaskStatus();
									}}
									className='flex gap-2 items-center'>
									{isPending ? (
										<LoaderCircleIcon className='size-4 animate-spin' />
									) : (
										<>
											<RefreshCcw />
											{t('common:actions.refresh')}
										</>
									)}
								</Button>
							))}

						{uploadedTaskDetails?.task_status === 'COMPLETED' && (
							<Button
								disabled={isPending || isLoading}
								onClick={() => {
									onOpenChange(false);
								}}
								className='flex gap-2 items-center'>
								{t('common:actions.done')}
							</Button>
						)}

						{uploadedTaskDetails && uploadedTaskDetails.task_status === 'FAILED' && (
							<div className='flex gap-2 items-center'>
								<Button
									onClick={() => {
										window.open(uploadedTaskDetails.file_url || uploadedFile?.raw_file, '_blank');
									}}
									variant={'outline'}
									className='flex gap-2 items-center'>
									{t('common:labels.downloadCsv')}
								</Button>
								<Button
									onClick={() => {
										if (taskId && uploadedTaskDetails) {
											setEntityType(importTypeOptions.find((option) => option.value === uploadedTaskDetails.entity_type));
											setUploadedFile({
												original_filename: uploadedTaskDetails.file_name,
												raw_file: uploadedTaskDetails.file_url,
											});
											addTask(uploadedFile);
										}
									}}
									className='flex gap-2 items-center'>
									{t('common:labels.tryAgain')}
								</Button>
							</div>
						)}
						{/* <div className='border rounded-md border-destructive text-destructive p-4 mt-4 flex gap-3 items-start fonts-sans text-sm'>
							<CircleAlert className='text-destructive w-12' />
							<div className='flex flex-col '>
								<p className='font-medium mb-2'>The records are not in correct format</p>
								<p>20 records found to be in incorrect format. Download the CSV to containing the results of this import action.</p>
							</div>
						</div> */}
					</div>
					{!uploadedTaskDetails && (
						<Button
							disabled={isPending || isLoading || !uploadedFile || !entityType}
							onClick={() => {
								handleImport();
							}}>
							{isPending ? <LoaderCircleIcon className='size-4 animate-spin' /> : t('common:labels.importData')}
						</Button>
					)}
				</div>
			</Sheet>
		</div>
	);
};

export default ImportFileDrawer;
