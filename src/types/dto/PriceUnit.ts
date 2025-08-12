import { Decimal } from 'decimal.js';
import { QueryFilter, TimeRangeFilter } from './base';
import { FilterCondition } from '../common/QueryBuilder';
import { ENTITY_STATUS } from '@/models/base';

export interface CreatePriceUnitRequest {
	name: string;
	code: string;
	symbol: string;
	base_currency: string;
	conversion_rate: Decimal;
	precision: number;
}

export interface UpdatePriceUnitRequest {
	name?: string;
	symbol?: string;
	precision?: number;
	conversion_rate?: Decimal;
}

export interface PriceUnitResponse {
	id: string;
	name: string;
	code: string;
	symbol: string;
	base_currency: string;
	conversion_rate: Decimal;
	precision: number;
	status: ENTITY_STATUS;
	created_at: string;
	updated_at: string;
}

export interface PriceUnitFilter extends QueryFilter, TimeRangeFilter {
	filters?: FilterCondition[];
	tenant_id?: string;
	environment_id?: string;
}
