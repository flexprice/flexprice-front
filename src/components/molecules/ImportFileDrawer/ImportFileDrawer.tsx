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
import { refetchQueries } from '@/core/services/tanstack/queryClient';
import useUser from '@/hooks/useUser';
import { useEnvironment } from '@/hooks/useEnvironment';

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

// Map backend 400 messages from the csvbox import endpoint to friendly copy.
// The backend surfaces two specific strings we want to distinguish; anything
// else falls through to the caller's generic error.
const getCsvImportErrorKey = (message: string | undefined): string | null => {
	if (!message) return null;
	const m = message.toLowerCase();
	if (m.includes('csv imports are not configured')) return 'import.errors.notConfigured';
	if (m.includes('invalid upload_id')) return 'import.errors.invalidUploadId';
	return null;
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

	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();
	const tenantId = user?.tenant?.id;
	const environmentId = activeEnvironment?.id;
	// Backend derives the S3 key from `{upload_id}_{customer_id}.csv`, where
	// customer_id must be `<tenant>__<env>` (double underscore). Anything else
	// makes the upload undownloadable on the backend.
	const csvBoxCustomerId = tenantId && environmentId ? `${tenantId}__${environmentId}` : '';

	const csvBoxKey = useMemo(
		() => `${entityType?.value ? getLicenseKey(entityType.value) : ''}-${JSON.stringify(entityType?.label)}-${csvBoxCustomerId}`,
		[entityType, csvBoxCustomerId],
	);

	// Cleared to {} before each import attempt, so every field is optional.
	const [errors, seterrors] = useState<Partial<Record<'file' | 'entity_type' | 'file_type' | 'task_type', string>>>({
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
			const meta = data ?? uploadedFile;
			const importId = meta?.import_id;
			return await TaskApi.addTask({
				entity_type: entityType?.value || '',
				file_type: fileTypeOptions[0].value,
				task_type: taskTypeOptions[0].value,
				file_provider: 'csvbox',
				upload_id: importId != null ? String(importId) : '',
				file_name: meta?.original_filename || '',
			});
		},
		onSuccess: async () => {
			setEntityType(undefined);
			setUploadedFile(undefined);
			await refetchQueries('importTasks');
		},
		onError: (error: Error) => {
			const mappedKey = getCsvImportErrorKey(error.message);
			toast.error(mappedKey ? t(mappedKey) : error.message || t('common:toast.genericError'));
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
		seterrors({});
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
								'w-full flex justify-between items-center gap-2 group min-h-9 rounded-md border-dashed bg-surface-strong bg-background border px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:opacity-50 md:text-sm disabled:cursor-not-allowed',
								'focus-within:border-line-inverse',
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
										'w-full flex justify-between items-center gap-2 group min-h-9 rounded-md border-dashed bg-surface-strong bg-background border px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:opacity-50 md:text-sm disabled:cursor-not-allowed',
										'focus-within:border-line-inverse',
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
										// Object form matches CSV Box's docs. The bare-string form is accepted by
										// their postMessage bridge but stalls the destination-push stage on staging
										// (the "Uploading Data (n/n)" screen never advances). Object form works.
										user={{ user_id: csvBoxCustomerId }}
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
										render={(launch, isLoading) => {
											const disabled = isLoading || !csvBoxCustomerId;
											return (
												<div
													onClick={() => {
														if (disabled) return;
														launch();
													}}
													className={cn(!csvBoxCustomerId ? 'cursor-not-allowed' : 'cursor-pointer')}>
													<div className='space-y-1 w-full flex flex-col'>
														{/* Label */}
														<label className={cn(' block text-sm font-medium', 'text-content-zinc')}>{t('import.importFileLabel')}</label>
														<div aria-disabled={disabled} className={cn(disabled && 'text-content-zinc-muted')}>
															<button disabled={disabled} className={'p-2 border border-line-zinc rounded-lg py-2 px-4 w-full'}>
																<p className='font-medium text-sm flex gap-2 items-center justify-start'>{t('import.chooseFile')}</p>
															</button>
														</div>
														<p className={cn('text-sm', 'text-muted-foreground')}>{t('import.maxFileSizeHint')}</p>
														{!csvBoxCustomerId && <p className='text-sm text-destructive'>{t('import.errors.missingTenantOrEnv')}</p>}
														{errors.file && <p className='text-sm text-destructive'>{errors.file}</p>}
													</div>
												</div>
											);
										}}
									/>
									<div className='card !px-4 !py-3 border flex items-start mb-2 gap-3'>
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
											{/* Rendered as an anchor because the Button atom's default size adds
											    a border + fixed height that visually conflicts with a link. */}
											<a
												href={getSampleFileUrl(entityType?.value || '')}
												target='_blank'
												rel='noreferrer'
												className='mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80'>
												{t('common:labels.sampleCsv')}
												<Download className='size-3.5' />
											</a>
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
											<div className='text-sm text-content-zinc text-end'>{detail.value}</div>
										</div>
									))}
								</div>
								<div className='h-[1px] bg-surface-selected my-4'></div>
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
							<div className='flex flex-col gap-2'>
								{uploadedTaskDetails.error_summary && (
									<p className='text-sm text-destructive'>
										{/download/i.test(uploadedTaskDetails.error_summary)
											? t('import.errors.downloadFailedHint')
											: uploadedTaskDetails.error_summary}
									</p>
								)}
								<div className='flex gap-2 items-center'>
									{uploadedTaskDetails.file_url && (
										<Button
											onClick={() => {
												window.open(uploadedTaskDetails.file_url || uploadedFile?.raw_file, '_blank');
											}}
											variant={'outline'}
											className='flex gap-2 items-center'>
											{t('common:labels.downloadCsv')}
										</Button>
									)}
									<Button
										onClick={() => {
											// Reset local state so the CSV Box widget re-opens for a fresh upload.
											// The backend derives the S3 key from upload_id, so we can't blindly
											// resubmit a failed task's file_url like the legacy flow did.
											setuploadedTaskDetails(undefined);
											setUploadedFile(undefined);
											setEntityType(importTypeOptions.find((option) => option.value === uploadedTaskDetails.entity_type));
										}}
										className='flex gap-2 items-center'>
										{t('common:labels.tryAgain')}
									</Button>
								</div>
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
