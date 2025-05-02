import { Plan } from '@/models/Plan';
import { BaseEntityStatus } from '../common';
import Feature from '@/models/Feature';
import { Entitlement } from '@/models/Entitlement';
import { PaginationType } from '@/models/Pagination';

export interface EntitlementFilters {
	end_time?: string;
	expand?: string;
	feature_ids?: string[];
	feature_type?: 'metered' | 'boolean' | 'static';
	is_enabled?: boolean;
	limit?: number;
	offset?: number;
	order?: 'asc' | 'desc';
	plan_ids?: string[];
	sort?: string;
	start_time?: string;
	status?: BaseEntityStatus;
}

export interface ExtendedEntitlement extends Entitlement {
	plan: Plan;
	feature: Feature;
}

export interface EntitlementResponse {
	items: ExtendedEntitlement[] | Entitlement[];
	pagination: PaginationType;
}
