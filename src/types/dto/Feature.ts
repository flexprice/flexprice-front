import { PaginationType } from '@/models/Pagination';
import { TypedBackendFilter } from '../formatters/QueryBuilder';

import { TypedBackendSort } from '../formatters/QueryBuilder';
import Feature from '@/models/Feature';

export interface GetFeaturesPayload {
	end_time?: string;
	expand?: string;
	feature_ids?: string[];
	limit?: number;
	lookup_key?: string;
	offset?: number;
	order?: string;
	sort?: string;
	start_time?: string;
	status?: string;
}

export interface GetFeaturesResponse extends PaginationType {
	items: Feature[];
	pagination: PaginationType;
}

export interface GetFeatureByFilterPayload extends PaginationType {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
}
