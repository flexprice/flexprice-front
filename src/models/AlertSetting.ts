import { BaseModel } from './base';

export interface SpendAlertThreshold {
	threshold: string;
	condition: 'above' | 'below';
}

export interface AlertSettingsConfig {
	critical?: SpendAlertThreshold | null;
	warning?: SpendAlertThreshold | null;
	info?: SpendAlertThreshold | null;
	alert_enabled?: boolean;
}

export enum SpendAlertLevel {
	CRITICAL = 'critical',
	WARNING = 'warning',
	INFO = 'info',
}

export enum ALERT_ENTITY_TYPE {
	SUBSCRIPTION = 'subscription',
	SUBSCRIPTION_LINE_ITEM = 'subscription_line_item',
	GROUP = 'group',
}

export interface AlertSetting extends BaseModel {
	readonly entity_type: ALERT_ENTITY_TYPE;
	readonly entity_id: string;
	readonly parent_entity_type?: ALERT_ENTITY_TYPE;
	readonly parent_entity_id?: string;
	readonly enabled: boolean;
	readonly config: AlertSettingsConfig;
}
