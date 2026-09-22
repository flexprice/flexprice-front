import { BaseModel, Metadata } from './base';

export enum TAX_RATE_TYPE {
	PERCENTAGE = 'percentage',
	FIXED = 'fixed',
}

export enum TAX_RATE_STATUS {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	DELETED = 'DELETED',
}

export enum TAX_RATE_SCOPE {
	INTERNAL = 'INTERNAL',
	EXTERNAL = 'EXTERNAL',
	ONETIME = 'ONETIME',
}

export enum TAXRATE_ENTITY_TYPE {
	CUSTOMER = 'customer',
	SUBSCRIPTION = 'subscription',
	INVOICE = 'invoice',
	TENANT = 'tenant',
}

export enum TAX_BEHAVIOR {
	INCLUSIVE = 'inclusive',
	EXCLUSIVE = 'exclusive',
}

export interface TaxRate extends BaseModel {
	readonly name: string;
	readonly description: string;
	readonly code: string;
	readonly tax_rate_status: TAX_RATE_STATUS;
	readonly tax_rate_type: TAX_RATE_TYPE;
	readonly scope: TAX_RATE_SCOPE;
	readonly percentage_value?: number;
	readonly fixed_value?: number;
	readonly metadata?: Metadata;
}

export interface TaxAssociation extends BaseModel {
	readonly id: string;
	readonly tax_rate_id: string;
	readonly entity_type: TAXRATE_ENTITY_TYPE;
	readonly entity_id: string;
	readonly priority: number;
	readonly auto_apply: boolean;
	readonly currency: string;
	// Absent on tenant/customer-level rows until they are copied down to a subscription.
	readonly tax_behavior?: TAX_BEHAVIOR;
	readonly metadata?: Metadata;
	readonly environment_id: string;
}

export interface TaxApplied extends BaseModel {
	readonly id: string;
	readonly tax_rate_id: string;
	readonly entity_type: TAXRATE_ENTITY_TYPE;
	readonly entity_id: string;
	readonly tax_association_id?: string;
	readonly taxable_amount: string; // decimal.Decimal represented as string
	readonly tax_amount: string; // decimal.Decimal represented as string
	readonly tax_behavior: TAX_BEHAVIOR;
	readonly currency: string;
	readonly applied_at: string; // time.Time represented as ISO string
	readonly environment_id: string;
	readonly metadata?: Metadata;
	readonly idempotency_key?: string;
}
