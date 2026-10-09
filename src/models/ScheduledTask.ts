import { BaseModel } from './base';

export enum SCHEDULED_ENTITY_TYPE {
	EVENTS = 'events',
	INVOICE = 'invoice',
	CREDIT_TOPUPS = 'credit_topups',
	CREDIT_DEBITS = 'credit_debits',
	CREDIT_USAGE = 'credit_usage',
	USAGE_ANALYTICS = 'usage_analytics',
}

export enum SCHEDULED_TASK_INTERVAL {
	HOURLY = 'hourly',
	DAILY = 'daily',
}

export enum EXPORT_METADATA_ENTITY_TYPE {
	CUSTOMER = 'customer',
	WALLET = 'wallet',
}

/** Mirrors backend allowedMetadataEntityTypes map */
export const ALLOWED_METADATA_ENTITY_TYPES: Record<SCHEDULED_ENTITY_TYPE, EXPORT_METADATA_ENTITY_TYPE[]> = {
	[SCHEDULED_ENTITY_TYPE.CREDIT_USAGE]: [EXPORT_METADATA_ENTITY_TYPE.CUSTOMER, EXPORT_METADATA_ENTITY_TYPE.WALLET],
	[SCHEDULED_ENTITY_TYPE.USAGE_ANALYTICS]: [EXPORT_METADATA_ENTITY_TYPE.CUSTOMER],
	[SCHEDULED_ENTITY_TYPE.EVENTS]: [],
	[SCHEDULED_ENTITY_TYPE.INVOICE]: [],
	[SCHEDULED_ENTITY_TYPE.CREDIT_TOPUPS]: [],
	[SCHEDULED_ENTITY_TYPE.CREDIT_DEBITS]: [],
};

export type ScheduledEntityType = SCHEDULED_ENTITY_TYPE;
export type ScheduledTaskInterval = SCHEDULED_TASK_INTERVAL;
export type ExportMetadataEntityType = EXPORT_METADATA_ENTITY_TYPE;

export interface ScheduledTask extends BaseModel {
	readonly connection_id: string;
	readonly entity_type: ScheduledEntityType;
	readonly interval: ScheduledTaskInterval;
	readonly enabled: boolean;
	readonly job_config: ScheduledTaskJobConfig;
	readonly last_run_at?: string;
	readonly next_run_at?: string;
	readonly last_run_status?: string;
}

export interface ScheduledTaskJobConfig {
	bucket: string;
	region: string;
	key_prefix: string;
	compression?: string;
	encryption?: string;
	max_file_size_mb?: number;
	export_metadata_fields?: Array<{
		entity_type: EXPORT_METADATA_ENTITY_TYPE;
		field_key: string;
		column_name?: string;
	}>;
	endpoint_url?: string;
	use_path_style?: boolean;
}
