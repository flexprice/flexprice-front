import { Entitlement, ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import { Pagination } from '@/models/Pagination';
import { Plan } from '@/models/Plan';
import Addon from '@/models/Addon';
import Feature from '@/models/Feature';
import { BILLING_PERIOD } from '@/models/Price';
import { FEATURE_TYPE } from '@/models/Feature';
import { ENTITY_STATUS } from '@/models/base';

export interface EntitlementFilters {
	end_time?: string;
	expand?: string;
	feature_ids?: string[];
	feature_type?: 'metered' | 'boolean' | 'static';
	is_enabled?: boolean;
	limit?: number;
	offset?: number;
	order?: 'asc' | 'desc';
	entity_type?: ENTITLEMENT_ENTITY_TYPE;
	entity_ids?: string[];
	sort?: string;
	start_time?: string;
	status?: ENTITY_STATUS;
}

export interface EntitlementResponse extends Entitlement {
	feature: Feature;
	plan?: Plan;
	addon?: Addon;
}

export interface EntitlementResponse {
	items: EntitlementResponse[];
	pagination: Pagination;
}

export interface CreateEntitlementRequest {
	plan_id?: string;
	feature_id: string;
	feature_type: FEATURE_TYPE;
	is_enabled?: boolean;
	usage_limit?: number | null;
	usage_reset_period?: BILLING_PERIOD;
	is_soft_limit?: boolean;
	static_value?: string;
	entity_type: ENTITLEMENT_ENTITY_TYPE;
	entity_id: string;
}

export interface CreateBulkEntitlementRequest {
	items: CreateEntitlementRequest[];
}

export interface CreateBulkEntitlementResponse {
	items: EntitlementResponse[];
}
