import type { FxRate, FxRateScope } from '@/models/FxRate';
import type { TypedBackendFilter } from '@/types/formatters/QueryBuilder';

export interface CreateFxRateRequest {
	scope: FxRateScope;
	scope_id?: string;
	from_currency: string;
	to_currency: string;
	rate: string;
	start_date?: string;
	end_date?: string;
}

/** Only the fields present are changed; a date cannot be cleared once set. */
export interface UpdateFxRateRequest {
	rate?: string;
	start_date?: string;
	end_date?: string;
}

export interface FxRateFilter {
	scope?: FxRateScope;
	scope_id?: string;
	from_currency?: string;
	to_currency?: string;
	filters?: TypedBackendFilter[];
	limit: number;
	offset: number;
}

export interface ListFxRatesResponse {
	items: FxRate[];
	pagination: { total: number; limit: number; offset: number };
}
