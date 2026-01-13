import { Pagination, Feature, FEATURE_TYPE, Metadata, Meter, AlertSettings, ENTITY_STATUS } from '@/models';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';
import { MeterFilter, CreateMeterRequest } from './Meter';

// ============================================
// Feature Request Types
// ============================================

export interface CreateFeatureRequest {
	name: string;
	description?: string;
	lookup_key?: string;
	type: FEATURE_TYPE;
	meter_id?: string;
	meter?: CreateMeterRequest;
	metadata?: Metadata;
	unit_singular?: string;
	unit_plural?: string;
	alert_settings?: AlertSettings;
}

export interface UpdateFeatureRequest {
	name?: string;
	description?: string;
	metadata?: Metadata;
	unit_singular?: string;
	unit_plural?: string;
	filters?: MeterFilter[];
	alert_settings?: AlertSettings;
}

// ============================================
// Feature Response Types
// ============================================

export interface FeatureResponse extends Feature {
	meter?: Meter;
}

export interface ListFeaturesResponse {
	items: FeatureResponse[];
	pagination: Pagination;
}

// ============================================
// Feature Filter Types
// ============================================

export interface FeatureFilter {
	limit?: number;
	offset?: number;
	expand?: string;
	order?: string;
	sort?: string;
	// Feature-specific filter fields
	feature_ids?: string[];
	meter_ids?: string[];
	lookup_key?: string;
	lookup_keys?: string[];
	name_contains?: string;
	status?: ENTITY_STATUS;
	start_time?: string;
	end_time?: string;
}

// ============================================
// Legacy Payload Types (for backwards compatibility)
// ============================================

export interface GetFeaturesPayload {
	end_time?: string;
	expand?: string;
	feature_ids?: string[];
	meter_ids?: string[];
	limit?: number;
	lookup_key?: string;
	lookup_keys?: string[];
	offset?: number;
	order?: string;
	sort?: string;
	name_contains?: string;
	start_time?: string;
	status?: ENTITY_STATUS;
}

export interface GetFeaturesResponse {
	items: Feature[];
	pagination: Pagination;
}

export interface GetFeatureByFilterPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
}

// Legacy update payload
export interface UpdateFeaturePayload extends Partial<Feature> {
	filters?: MeterFilter[];
}
