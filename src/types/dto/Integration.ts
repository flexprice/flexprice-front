import { Integration } from '@/models/Integration';
import { Pagination } from '@supabase/supabase-js';

export interface CreateIntegrationRequest {
	provider: string;
	credentials: {
		key: string;
	};
	name: string;
}

export interface LinkedinIntegrationResponse {
	providers: string[];
}

export interface IntegrationResponse {
	items: Integration[];
	pagination: Pagination;
}
