import { ENTITY_STATUS } from '@/models/base';

export interface QueryFilter {
	limit?: number;
	offset?: number;
	status?: ENTITY_STATUS;
	sort?: string | any;
	order?: string;
	expand?: string;
}

export interface TimeRangeFilter {
	start_time?: string;
	end_time?: string;
}
