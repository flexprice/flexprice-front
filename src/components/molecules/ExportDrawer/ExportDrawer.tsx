import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer, Select, Tooltip } from '@/components/atoms';
import { useMutation } from '@tanstack/react-query';
import { TaskApi } from '@/api';
import {
	ScheduledTask,
	SCHEDULED_ENTITY_TYPE,
	SCHEDULED_TASK_INTERVAL,
	EXPORT_METADATA_ENTITY_TYPE,
	ALLOWED_METADATA_ENTITY_TYPES,
} from '@/models';
import { CreateScheduledTaskPayload } from '@/types/dto';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight, Info, Plus, Trash2 } from 'lucide-react';
import type { HttpRejectedError } from '@/core/axios/types';

interface ExportDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connectionId: string;
	connection?: any; // Connection object to check if Flexprice Managed
	exportTask?: ScheduledTask | null; // for editing
	onSave: (exportTask: any) => void;
}

interface MetadataField {
	entity_type: EXPORT_METADATA_ENTITY_TYPE;
	field_key: string;
	column_name: string;
}

interface ExportFormData {
	entity_type: SCHEDULED_ENTITY_TYPE;
	interval: SCHEDULED_TASK_INTERVAL;
	enabled: boolean;
	bucket: string;
	region: string;
	key_prefix: string;
	compression: string;
	encryption: string;
	export_metadata_fields: MetadataField[];
	endpoint_url: string;
	use_path_style: boolean;
}

interface ValidationErrors {
	entity_type?: string;
	interval?: string;
	bucket?: string;
	region?: string;
	key_prefix?: string;
	export_metadata_fields?: string;
}

function scheduledEntityTypeSupportsExportMetadataFields(entityType: SCHEDULED_ENTITY_TYPE): boolean {
	return entityType === SCHEDULED_ENTITY_TYPE.CREDIT_USAGE || entityType === SCHEDULED_ENTITY_TYPE.USAGE_ANALYTICS;
}

const ExportDrawer: FC<ExportDrawerProps> = ({ isOpen, onOpenChange, connectionId, connection, exportTask, onSave }) => {
	// Check if this is a Flexprice-managed connection
	const isFlexpriceManaged = connection?.sync_config?.s3?.is_flexprice_managed || false;

	const [formData, setFormData] = useState<ExportFormData>({
		entity_type: SCHEDULED_ENTITY_TYPE.EVENTS,
		interval: SCHEDULED_TASK_INTERVAL.HOURLY,
		enabled: true,
		bucket: '',
		region: 'us-east-1',
		key_prefix: 'flexprice-exports',
		compression: 'none',
		encryption: 'AES256',
		export_metadata_fields: [],
		endpoint_url: '',
		use_path_style: true,
	});

	const [errors, setErrors] = useState<ValidationErrors>({});
	const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
	const [expandedColumnNames, setExpandedColumnNames] = useState<Set<number>>(new Set());

	// Initialize form data when editing
	useEffect(() => {
		if (exportTask) {
			const fields = exportTask.job_config.export_metadata_fields ?? [];
			setFormData({
				entity_type: exportTask.entity_type,
				interval: exportTask.interval,
				enabled: exportTask.enabled,
				bucket: exportTask.job_config.bucket,
				region: exportTask.job_config.region,
				key_prefix: exportTask.job_config.key_prefix,
				compression: exportTask.job_config.compression || 'none',
				encryption: exportTask.job_config.encryption || 'AES256',
				export_metadata_fields: fields.map((f) => ({
					entity_type: f.entity_type,
					field_key: f.field_key,
					column_name: f.column_name ?? '',
				})),
				endpoint_url: exportTask.job_config.endpoint_url || '',
				use_path_style: exportTask.job_config.use_path_style ?? true,
			});
			// Pre-expand column name rows that already have a value
			setExpandedColumnNames(new Set(fields.map((f, i) => (f.column_name ? i : -1)).filter((i) => i >= 0)));
		} else {
			setFormData({
				entity_type: SCHEDULED_ENTITY_TYPE.EVENTS,
				interval: SCHEDULED_TASK_INTERVAL.HOURLY,
				enabled: true,
				bucket: '',
				region: 'us-east-1',
				key_prefix: 'flexprice-exports',
				compression: 'none',
				encryption: 'AES256',
				export_metadata_fields: [],
				endpoint_url: '',
				use_path_style: true,
			});
			setExpandedColumnNames(new Set());
		}
		setErrors({});
		setIsMetadataExpanded(false);
	}, [exportTask, isOpen]);

	const handleChange = (field: keyof ExportFormData, value: string | number | boolean) => {
		setFormData((prev) => {
			const updated = { ...prev, [field]: value };

			// Automatically set use_path_style to true when endpoint_url is filled
			if (field === 'endpoint_url' && typeof value === 'string' && value.trim()) {
				updated.use_path_style = true;
			}

			// When export entity type changes, clamp any metadata rows whose entity_type
			// is no longer allowed (e.g. wallet → customer when switching to Usage Analytics)
			if (field === 'entity_type') {
				const allowed = ALLOWED_METADATA_ENTITY_TYPES[value as SCHEDULED_ENTITY_TYPE] ?? [];
				updated.export_metadata_fields = prev.export_metadata_fields.map((f) =>
					allowed.includes(f.entity_type) ? f : { ...f, entity_type: allowed[0] ?? EXPORT_METADATA_ENTITY_TYPE.CUSTOMER },
				);
			}

			return updated;
		});
		// Clear error when user starts typing
		if (errors[field as keyof ValidationErrors]) {
			setErrors((prev) => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
		}
	};

	const addMetadataField = () => {
		const allowed = ALLOWED_METADATA_ENTITY_TYPES[formData.entity_type] ?? [];
		const defaultEntityType = allowed[0] ?? EXPORT_METADATA_ENTITY_TYPE.CUSTOMER;
		setFormData((prev) => ({
			...prev,
			export_metadata_fields: [...prev.export_metadata_fields, { entity_type: defaultEntityType, field_key: '', column_name: '' }],
		}));
	};

	const removeMetadataField = (index: number) => {
		setFormData((prev) => ({
			...prev,
			export_metadata_fields: prev.export_metadata_fields.filter((_, i) => i !== index),
		}));
		setExpandedColumnNames((prev) => {
			const next = new Set<number>();
			prev.forEach((i) => {
				if (i < index) next.add(i);
				else if (i > index) next.add(i - 1);
			});
			return next;
		});
	};

	const toggleColumnName = (index: number) => {
		setExpandedColumnNames((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
		if (expandedColumnNames.has(index)) {
			updateMetadataField(index, 'column_name', '');
		}
	};

	const updateMetadataField = (index: number, key: keyof MetadataField, value: string) => {
		setFormData((prev) => ({
			...prev,
			export_metadata_fields: prev.export_metadata_fields.map((f, i) => (i === index ? { ...f, [key]: value } : f)),
		}));
		if (errors.export_metadata_fields) {
			setErrors((prev) => ({ ...prev, export_metadata_fields: undefined }));
		}
	};

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {};

		// For Flexprice Managed, we don't need to validate bucket, region, key_prefix
		if (!isFlexpriceManaged) {
			if (!formData.bucket.trim()) {
				newErrors.bucket = 'S3 bucket name is required';
			}

			if (!formData.region.trim()) {
				newErrors.region = 'AWS region is required';
			}

			if (!formData.key_prefix.trim()) {
				newErrors.key_prefix = 'Key prefix is required';
			}
		}

		if (scheduledEntityTypeSupportsExportMetadataFields(formData.entity_type)) {
			const hasEmptyFieldKey = formData.export_metadata_fields.some((f) => !f.field_key.trim());
			if (hasEmptyFieldKey) {
				newErrors.export_metadata_fields = 'All metadata fields must have a field key';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const buildExportMetadataFields = () => {
		if (!scheduledEntityTypeSupportsExportMetadataFields(formData.entity_type)) return undefined;
		if (formData.export_metadata_fields.length === 0) return undefined;
		return formData.export_metadata_fields.map((f) => ({
			entity_type: f.entity_type,
			field_key: f.field_key.trim(),
			...(f.column_name.trim() ? { column_name: f.column_name.trim() } : {}),
		}));
	};

	const { mutate: createExport, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const jobConfig: any = {
				compression: formData.compression,
				encryption: formData.encryption,
			};

			const metadataFields = buildExportMetadataFields();
			if (metadataFields) {
				jobConfig.export_metadata_fields = metadataFields;
			}

			// Only include bucket/region/key_prefix for customer-owned S3
			if (!isFlexpriceManaged) {
				jobConfig.bucket = formData.bucket;
				jobConfig.region = formData.region;
				jobConfig.key_prefix = formData.key_prefix;

				// Only include endpoint_url and use_path_style if endpoint_url is filled
				if (formData.endpoint_url.trim()) {
					jobConfig.endpoint_url = formData.endpoint_url;
					jobConfig.use_path_style = formData.use_path_style;
				}
			}

			const payload: CreateScheduledTaskPayload = {
				connection_id: connectionId,
				entity_type: formData.entity_type,
				interval: formData.interval,
				enabled: formData.enabled,
				job_config: jobConfig,
			};

			return await TaskApi.createScheduledTask(payload);
		},
		onSuccess: (response) => {
			toast.success('Export task created successfully');
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			const apiMessage = error.message || 'Failed to create export task';
			toast.error(apiMessage);

			const raw = (error as HttpRejectedError).cause;
			const code = raw && typeof raw === 'object' && raw !== null && 'code' in raw ? (raw as { code?: string }).code : undefined;
			if (code === 'validation_error' && typeof apiMessage === 'string' && apiMessage.toLowerCase().includes('export metadata field')) {
				setErrors((prev) => ({ ...prev, export_metadata_fields: apiMessage }));
				setIsMetadataExpanded(true);
			}
		},
	});

	const { mutate: updateExport, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const jobConfig: any = {
				compression: formData.compression,
				encryption: formData.encryption,
			};

			const metadataFields = buildExportMetadataFields();
			if (metadataFields) {
				jobConfig.export_metadata_fields = metadataFields;
			}

			// Only include bucket/region/key_prefix for customer-owned S3
			if (!isFlexpriceManaged) {
				jobConfig.bucket = formData.bucket;
				jobConfig.region = formData.region;
				jobConfig.key_prefix = formData.key_prefix;

				// Only include endpoint_url and use_path_style if endpoint_url is filled
				if (formData.endpoint_url.trim()) {
					jobConfig.endpoint_url = formData.endpoint_url;
					jobConfig.use_path_style = formData.use_path_style;
				}
			}

			const payload: CreateScheduledTaskPayload = {
				connection_id: connectionId,
				entity_type: formData.entity_type,
				interval: formData.interval,
				enabled: formData.enabled,
				job_config: jobConfig,
			};

			return await TaskApi.updateScheduledTask(exportTask!.id, payload);
		},
		onSuccess: (response) => {
			toast.success('Export task updated successfully');
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			const apiMessage = error.message || 'Failed to update export task';
			toast.error(apiMessage);

			const raw = (error as HttpRejectedError).cause;
			const code = raw && typeof raw === 'object' && raw !== null && 'code' in raw ? (raw as { code?: string }).code : undefined;
			if (code === 'validation_error' && typeof apiMessage === 'string' && apiMessage.toLowerCase().includes('export metadata field')) {
				setErrors((prev) => ({ ...prev, export_metadata_fields: apiMessage }));
				setIsMetadataExpanded(true);
			}
		},
	});

	const handleSave = () => {
		if (validateForm()) {
			if (exportTask) {
				updateExport();
			} else {
				createExport();
			}
		}
	};

	const isPending = isCreating || isUpdating;

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={exportTask ? 'Edit Export Task' : 'Create Export Task'}
			description="Configure the export settings for your S3 data pipeline. Click save when you're done."
			size='lg'>
			<div className='space-y-4 mt-4'>
				{/* Entity Type */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>Entity Type</label>
					<Select
						value={formData.entity_type}
						onChange={(value) => handleChange('entity_type', value as SCHEDULED_ENTITY_TYPE)}
						error={errors.entity_type}
						options={[
							{ value: SCHEDULED_ENTITY_TYPE.EVENTS, label: 'Events' },
							{ value: SCHEDULED_ENTITY_TYPE.INVOICE, label: 'Invoice' },
							{ value: SCHEDULED_ENTITY_TYPE.CREDIT_TOPUPS, label: 'Credit Topups' },
							{ value: SCHEDULED_ENTITY_TYPE.CREDIT_USAGE, label: 'Credit Usage' },
							{ value: SCHEDULED_ENTITY_TYPE.USAGE_ANALYTICS, label: 'Usage Analytics' },
						]}
					/>
					<p className='text-xs text-gray-500 mt-1'>Select the type of data to export</p>
				</div>

				{/* Interval */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>Export Interval</label>
					<Select
						value={formData.interval}
						onChange={(value) => handleChange('interval', value as SCHEDULED_TASK_INTERVAL)}
						error={errors.interval}
						options={[
							{ value: SCHEDULED_TASK_INTERVAL.HOURLY, label: 'Hourly' },
							{ value: SCHEDULED_TASK_INTERVAL.DAILY, label: 'Daily' },
						]}
					/>
					<p className='text-xs text-gray-500 mt-1'>How often to run the export</p>
				</div>

				{/* S3 Configuration - Only show for customer-owned S3 */}
				{!isFlexpriceManaged && (
					<>
						{/* S3 Bucket */}
						<Input
							label='S3 Bucket Name'
							placeholder='Enter S3 bucket name'
							value={formData.bucket}
							onChange={(value) => handleChange('bucket', value)}
							error={errors.bucket}
							description='The name of your S3 bucket'
						/>

						{/* AWS Region */}
						<Input
							label='AWS Region'
							placeholder='Enter AWS region'
							value={formData.region}
							onChange={(value) => handleChange('region', value)}
							error={errors.region}
							description='The AWS region where your S3 bucket is located'
						/>

						{/* Key Prefix */}
						<Input
							label='Key Prefix'
							placeholder='Enter key prefix'
							value={formData.key_prefix}
							onChange={(value) => handleChange('key_prefix', value)}
							error={errors.key_prefix}
							description='The prefix for files in your S3 bucket'
						/>
					</>
				)}

				{/* Compression */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>Compression</label>
					<Select
						value={formData.compression}
						onChange={(value) => handleChange('compression', value)}
						options={[
							{ value: 'none', label: 'None' },
							{ value: 'gzip', label: 'GZIP' },
						]}
					/>
					<p className='text-xs text-gray-500 mt-1'>Compression format for exported files</p>
				</div>

				{/* Encryption */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>Encryption</label>
					<Select
						value={formData.encryption}
						onChange={(value) => handleChange('encryption', value)}
						options={[{ value: 'AES256', label: 'AES256' }]}
					/>
					<p className='text-xs text-gray-500 mt-1'>Encryption method for exported files</p>
				</div>

				{/* Additional metadata fields (credit usage & usage analytics exports) */}
				{scheduledEntityTypeSupportsExportMetadataFields(formData.entity_type) && (
					<div className='rounded-md border border-gray-200 bg-gray-50'>
						<button
							type='button'
							onClick={() => {
								const next = !isMetadataExpanded;
								setIsMetadataExpanded(next);
								if (next && formData.export_metadata_fields.length === 0) {
									addMetadataField();
								}
							}}
							className='w-full flex items-center px-3 py-2.5 text-left hover:bg-gray-100 rounded-md transition-colors gap-2'>
							<div className='text-gray-500 shrink-0'>
								{isMetadataExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
							</div>
							<div className='min-w-0'>
								<div className='text-sm font-medium text-gray-900 inline-flex items-center gap-1.5'>
									Additional Metadata Fields
									<span className='text-xs font-normal text-gray-500'>(Optional)</span>
									<Tooltip
										delayDuration={0}
										side='right'
										content={
											<div className='max-w-[280px] text-sm'>
												Export custom metadata fields as additional CSV columns. If the same field key exists on multiple entity types, use{' '}
												<span className='font-medium'>Column Name</span> to give each a unique header.
											</div>
										}>
										<span className='inline-flex items-center text-blue-500 hover:text-blue-600'>
											<Info className='h-3.5 w-3.5' />
										</span>
									</Tooltip>
								</div>
								<div className='text-xs text-gray-500'>
									{formData.export_metadata_fields.length > 0
										? `${formData.export_metadata_fields.length} field${formData.export_metadata_fields.length > 1 ? 's' : ''} configured`
										: 'Click to add metadata fields to export'}
								</div>
							</div>
						</button>

						{isMetadataExpanded && (
							<div className='px-3 pb-3 space-y-1.5'>
								{formData.export_metadata_fields.length > 0 && (
									<div className='grid grid-cols-[120px_1fr_32px] gap-x-2'>
										<span className='text-xs font-medium text-gray-500'>Entity Type</span>
										<span className='text-xs font-medium text-gray-500'>Field Key *</span>
										<span />
									</div>
								)}

								{formData.export_metadata_fields.map((field, index) => {
									const allowedTypes = ALLOWED_METADATA_ENTITY_TYPES[formData.entity_type] ?? [];
									const entityTypeOptions = allowedTypes.map((t: EXPORT_METADATA_ENTITY_TYPE) => ({
										value: t,
										label: t.charAt(0).toUpperCase() + t.slice(1),
									}));
									return (
										<div key={index} className='space-y-1'>
											<div className='grid grid-cols-[120px_1fr_32px] gap-x-2 items-center'>
												<Select
													value={field.entity_type}
													onChange={(value) => updateMetadataField(index, 'entity_type', value)}
													options={entityTypeOptions}
												/>
												<Input
													placeholder='e.g. account_id'
													value={field.field_key}
													onChange={(value) => updateMetadataField(index, 'field_key', value)}
												/>
												<button
													type='button'
													onClick={() => removeMetadataField(index)}
													className='self-center p-1 text-gray-400 hover:text-red-500 transition-colors rounded'>
													<Trash2 className='h-4 w-4' />
												</button>
											</div>
											{expandedColumnNames.has(index) ? (
												<div className='pl-[128px] pr-[40px]'>
													<Input
														placeholder='CSV column header, e.g. Account ID'
														value={field.column_name}
														onChange={(value) => updateMetadataField(index, 'column_name', value)}
													/>
												</div>
											) : (
												<div className='pl-[128px]'>
													<button
														type='button'
														onClick={() => toggleColumnName(index)}
														className='text-xs text-gray-400 hover:text-blue-600 transition-colors'>
														+ set column name
													</button>
												</div>
											)}
										</div>
									);
								})}

								{errors.export_metadata_fields && <p className='text-xs text-red-500'>{errors.export_metadata_fields}</p>}

								<button
									type='button'
									onClick={addMetadataField}
									className='inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium pt-0.5'>
									<Plus className='h-4 w-4' />
									Add Metadata Field
								</button>
							</div>
						)}
					</div>
				)}

				{/* Endpoint URL (Optional) - only for customer-owned S3 */}
				{!isFlexpriceManaged && (
					<Input
						label='Endpoint URL (Optional)'
						placeholder='Enter custom S3 endpoint URL'
						value={formData.endpoint_url}
						onChange={(value) => handleChange('endpoint_url', value)}
						description='Custom endpoint URL for S3-compatible storage (e.g., MinIO, DigitalOcean Spaces)'
					/>
				)}

				{/* Flexprice Managed Info */}
				{isFlexpriceManaged && (
					<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
						<h4 className='font-medium text-blue-900 mb-2'>Flexprice Managed Storage</h4>
						<p className='text-sm text-blue-800'>
							Your exports will be automatically stored in Flexprice-managed S3 buckets. No additional export configuration required.
							Download the exported files from the respective task runs table.
						</p>
					</div>
				)}

				{/* Enabled */}
				<div className='flex items-center space-x-2'>
					<input
						type='checkbox'
						id='enabled'
						checked={formData.enabled}
						onChange={(e) => handleChange('enabled', e.target.checked)}
						className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
					/>
					<label htmlFor='enabled' className='text-sm font-medium text-gray-700'>
						Enable this export task
					</label>
				</div>

				<Spacer className='!h-4' />
				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						Cancel
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending}>
						{exportTask ? 'Update' : 'Create'}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default ExportDrawer;
