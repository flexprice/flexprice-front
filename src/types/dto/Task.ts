import {
	ImportTask,
	Pagination,
	Metadata,
	ScheduledTask,
	ScheduledEntityType,
	ScheduledTaskInterval,
	ExportMetadataEntityType,
} from '@/models';

export interface AddTaskPayload {
	entity_type: string;
	file_type: string;
	task_type: string;
	file_name?: string;
	metadata?: Metadata;
	// Legacy: pre-signed/hosted URL flow. Kept for non-csvbox providers.
	file_url?: string;
	// Backend derives the S3 key from `upload_id` + the authenticated tenant/env,
	// so nothing else about the object is sent from the client.
	file_provider?: 'csvbox';
	upload_id?: string;
}

export interface GetTasksPayload {
	created_by?: string;
	end_time?: string;
	expand?: string;
	limit?: number;
	offset?: number;
	order?: string;
	sort?: string;
	start_time?: string;
	status?: string;
	task_status?: string;
	task_type?: string;
}

export interface GetTasksResponse {
	items: ImportTask[];
	pagination: Pagination;
}

// Scheduled Task DTOs
export interface GetScheduledTasksPayload {
	connection_id?: string;
	limit?: number;
	offset?: number;
}

export interface GetScheduledTasksResponse {
	items: ScheduledTask[];
	pagination: Pagination;
}

export interface CreateScheduledTaskPayload {
	connection_id: string;
	entity_type: ScheduledEntityType;
	interval: ScheduledTaskInterval;
	enabled: boolean;
	job_config: {
		bucket: string;
		region: string;
		key_prefix: string;
		compression?: string;
		encryption?: string;
		max_file_size_mb?: number;
		export_metadata_fields?: Array<{
			entity_type: ExportMetadataEntityType;
			field_key: string;
			column_name?: string;
		}>;
		endpoint_url?: string;
		use_path_style?: boolean;
	};
}

export interface UpdateScheduledTaskPayload {
	enabled: boolean;
}

export interface ForceRunPayload {
	start_time?: string;
	end_time?: string;
	/** Wallet ledger exports only; empty means every customer. */
	customer_external_ids?: string[];
}

export interface DownloadTaskFileResponse {
	download_url: string;
}
