import { BaseModel } from './base';

export enum SCHEDULED_ENTITY_TYPE {
	EVENTS = 'events',
	INVOICE = 'invoice',
	CREDIT_TOPUPS = 'credit_topups',
}

export enum SCHEDULED_TASK_INTERVAL {
	HOURLY = 'hourly',
	DAILY = 'daily',
}

export type ScheduledEntityType = SCHEDULED_ENTITY_TYPE;
export type ScheduledTaskInterval = SCHEDULED_TASK_INTERVAL;

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
	endpoint_url?: string;
	use_path_style?: boolean;
}
