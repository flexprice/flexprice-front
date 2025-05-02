import { Button, Chip, FormHeader, Select, SelectOption, Sheet, Spacer } from '@/components/atoms';
import { FC, useEffect, useMemo, useState } from 'react';
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

const mapStatusChips = (status: string) => {
	if (status === 'COMPLETED') {
		return 'Successful';
	} else if (status === 'FAILED') {
		return 'Failed';
	} else if (status === 'PROCESSING' || status === 'PENDING') {
		return 'Queued';
	}
};

const getLicenseKey = (tab: string): string => {
	switch (tab.toLowerCase()) {
		// this is original license key for events
		case 'events':
			return 'Nd50fKMwC54Ri7AoD4ifG1dxL7koqW';

		// this is original license key for customers
		case 'customers':
			return 'W5t0iJSKSM3AH8Etzq9Jf3X3lvsKuw';

		case 'feature':
			return '2tzeM0vIEIITBYCuSStqjhJnhJIhfi';
		case 'feature_mapping':
			return 'HwXBfGhJ7Qq4qikGTTeMcUqkBocl5V';
		default:
			return 'Nd50fKMwC54Ri7AoD4ifG1dxL7koqW';
	}
};

const getSampleFileUrl = (tab: string): string => {
	switch (tab.toLowerCase()) {
		case 'events':
			return '/assets/csv/sample.csv';
		case 'customer':
			return '/assets/csv/sample_customer.csv';
		case 'feature':
			return '/assets/csv/sample.csv';
		case 'feature_mapping':
			return '/assets/csv/sample_feature_mapping.csv';
		default:
			return '/assets/csv/sample_event.csv';
	}
};

const getTaskStatusChips = (status: string) => {
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
	const importTypeOptions: SelectOption[] = [
		{
			label: 'Events',
			value: 'EVENTS',
		},
		{
			label: 'Customers',
			value: 'CUSTOMERS',
		},
	];
	const fileTypeOptions: SelectOption[] = [
		{
			label: 'Csv',
			value: 'CSV',
		},
		{
			label: 'Json',
			value: 'JSON',
		},
	];

	const taskTypeOptions: SelectOption[] = [
		{
			label: 'Import',
			value: 'IMPORT',
		},
		{
			label: 'Export',
			value: 'EXPORT',
		},
	];

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
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Something went wrong. Please try again.');
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

	const importDetails = [
		{
			label: 'Type',
			value: uploadedTaskDetails?.entity_type && toSentenceCase(uploadedTaskDetails.entity_type),
		},
		// {
		// 	label: 'Meter',
		// 	value: 'Billable Meter',
		// },
		{
			label: 'Status',
			// value: getTaskStatusChips(uploadedTaskDetails?.task_status || ''),
			value: getTaskStatusChips(uploadedTaskDetails?.task_status || ''),
		},
		{
			label: 'Import Started at',
			value: uploadedTaskDetails?.started_at ? formatDate(new Date(uploadedTaskDetails.started_at)) : formatDate(new Date()),
		},
		{
			label: 'Import Completed at',
			value: uploadedTaskDetails?.completed_at ? formatDate(new Date(uploadedTaskDetails.completed_at)) : formatDate(new Date()),
		},
	];

	const processedRows = [
		{
			label: 'Total Rows',
			value:
				uploadedTaskDetails?.total_records || uploadedTaskDetails?.successful_records || 0 + (uploadedTaskDetails?.failed_records || 0),
		},
		{
			label: 'Failed Rows',
			value: uploadedTaskDetails?.failed_records,
		},
		{
			label: 'Successful Rows',
			value: uploadedTaskDetails?.successful_records,
		},
	];

	const handleImport = (file?: Partial<ImportMeta>) => {
		seterrors({} as any);
		if (!file && !uploadedFile) {
			seterrors((prev) => ({ ...prev, file: 'Please upload a file' }));
		}
		if (!entityType) {
			seterrors((prev) => ({ ...prev, entity_type: 'Please select an entity type' }));
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
				title={'Import File'}
				description={'Easily upload and manage your bulk data imports.'}>
				<div className='mt-6'>
					{!uploadedTaskDetails && (
						<Select
							error={errors.entity_type}
							options={importTypeOptions}
							value={entityType?.value}
							label='Import Type'
							onChange={(value) => {
								setEntityType(importTypeOptions.find((option) => option.value === value));
							}}
							description='Select the type of data you want to import'
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
							{uploadedTaskDetails?.file_name || '--'}
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
												toast.success(`${meta.original_filename} uploaded successfully`);
											} else {
												toast.error(`${meta.original_filename} upload failed`);
											}
										}}
										licenseKey={getLicenseKey(entityType?.value || '')}
										render={(launch, isLoading) => (
											<div onClick={launch} className='cursor-pointer'>
												<div className='space-y-1 w-full flex flex-col'>
													{/* Label */}
													<label className={cn('font-inter block text-sm font-medium', 'text-zinc-950')}>Import file</label>
													<div aria-disabled={isLoading} className={cn(isLoading && 'text-zinc-500')}>
														<button className={'p-2 border border-[#E4E4E7] rounded-lg py-2 px-4 w-full'}>
															<p className='font-medium text-sm flex gap-2 items-center justify-start'>Choose File to Upload</p>
														</button>
													</div>
													<p className={cn('text-sm', 'text-muted-foreground')}>Max File Size: 5 MB. .csv format accepted.</p>
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
												title='Compare your file formatting'
												variant='form-component-title'
												className='mb-0'
												titleClassName='mb-0'
												subtitle='Max file size: 5 MB. Only .csv format is accepted.'
											/>
											<Button
												className='flex gap-2 !p-0 m-0 underline'
												variant={'link'}
												onClick={() => {
													window.open(getSampleFileUrl(entityType?.value || ''), '_blank');
												}}>
												Sample CSV
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
								<FormHeader title='Import Details' variant='form-component-title' />

								<div className='space-y-4 mt-4'>
									{importDetails.map((detail, index) => (
										<div key={index} className='flex justify-between'>
											<p className='text-sm text-muted-foreground'>{detail.label}</p>
											<p className='text-sm text-zinc-950'>{detail.value}</p>
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
											Refresh
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
								Done
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
									Download CSV
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
									Try Again
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
							{isPending ? <LoaderCircleIcon className='size-4 animate-spin' /> : 'Import Data'}
						</Button>
					)}
				</div>
			</Sheet>
		</div>
	);
};

export default ImportFileDrawer;
