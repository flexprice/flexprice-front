import { AlertSetting, AlertSettingsConfig, ALERT_ENTITY_TYPE } from '@/models';
import { QueryFilter } from './base';

export interface CreateAlertSettingsRequest {
	entity_type: ALERT_ENTITY_TYPE;
	entity_id: string;
	parent_entity_type?: ALERT_ENTITY_TYPE;
	parent_entity_id?: string;
	config: AlertSettingsConfig;
}

export interface UpdateAlertSettingsRequest {
	config: AlertSettingsConfig;
}

export type AlertSettingResponse = AlertSetting;

export interface AlertSettingsFilter extends QueryFilter {
	entity_type?: ALERT_ENTITY_TYPE;
	entity_id?: string;
	entity_ids?: string[];
	parent_entity_type?: ALERT_ENTITY_TYPE;
	parent_entity_id?: string;
	parent_entity_ids?: string[];
	enabled?: boolean;
}

export type SearchAlertSettingsRequest = AlertSettingsFilter;

export interface SearchAlertSettingsResponse {
	items: AlertSettingResponse[];
	pagination?: { total?: number; limit?: number; offset?: number };
}
