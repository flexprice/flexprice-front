import Customer from '@/models/Customer';
import { CustomerEntitlement } from '@/models/CustomerEntitlement';
import CustomerUsage from '@/models/CustomerUsage';
import { PaginationType } from '@/models/Pagination';
import { Subscription, BILLING_CYCLE } from '@/models/Subscription';

export interface GetCustomerResponse {
	items: Customer[];
	pagination: PaginationType;
}

export interface GetCustomerSubscriptionsResponse {
	items: Subscription[];
	pagination: PaginationType;
}

export interface GetCustomerEntitlementsResponse {
	customer_id: string;
	features: CustomerEntitlement[];
}

export interface GetCustomerEntitlementPayload {
	customer_id: string;
	feature_id?: string;
}

export interface CreateCustomerSubscriptionPayload {
	customer_id: string;
	billing_cadence: 'RECURRING';
	billing_period: string;
	billing_period_count: number;
	currency: string;
	invoice_cadence: 'ARREAR';
	plan_id: string;
	start_date: string;
	end_date: string | null;
	lookup_key: string;
	trial_end: string | null;
	trial_start: string | null;
	billing_cycle?: BILLING_CYCLE;
}

export interface GetUsageSummaryResponse {
	customer_id: string;
	features: CustomerUsage[];
	pagination: PaginationType;
	period: {
		end_time: string;
		period: string;
		start_time: string;
	};
}

export interface GetCustomerByQueryPayload {
	external_id?: string;
	name?: string;
	limit?: number;
	offset?: number;
}
