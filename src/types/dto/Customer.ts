import Customer from '@/models/Customer';
import { CustomerEntitlement } from '@/models/CustomerEntitlement';
import CustomerUsage from '@/models/CustomerUsage';
import { PaginationType } from '@/models/Pagination';
import { Subscription, BILLING_CYCLE } from '@/models/Subscription';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';
import { BILLING_PERIOD } from '@/constants/constants';
import { BILLING_CADENCE } from '@/models/Invoice';
import { INVOICE_CADENCE } from '@/models/Invoice';

export interface FilterCondition {
	field: string;
	operator: string;
	value: string;
}

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

// Subscription
export interface SubscriptionPhaseLineItem {
	price_id: string;
	quantity?: number;
	override_amount?: string;
}

export interface SubscriptionPhase {
	billing_cadence: BILLING_CADENCE;
	billing_period: BILLING_PERIOD;
	billing_period_count: number;
	currency: string;
	invoice_cadence: INVOICE_CADENCE;
	plan_id: string;
	start_date: Date;
	end_date: Date | null;
	lookup_key: string;
	trial_end: Date | null;
	trial_start: Date | null;
	billing_cycle?: BILLING_CYCLE;
	line_items?: SubscriptionPhaseLineItem[];
	credit_grants?: CreditGrant[];
}

export interface CreditGrant {
	amount: string;
	currency: string;
	cadence: BILLING_CADENCE;
	period: BILLING_PERIOD;
	period_count: number;
	expiry_date_utc?: Date;
	priority?: number;
}

export interface GetCustomerByFiltersPayload extends PaginationType {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
}
