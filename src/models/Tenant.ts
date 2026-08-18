import { ENTITY_STATUS, Metadata } from './base';

export interface TenantAddress {
	readonly address_line1: string;
	readonly address_line2: string;
	readonly address_city: string;
	readonly address_state: string;
	readonly address_postal_code: string;
	readonly address_country: string;
}

export interface TenantBillingDetails {
	readonly address: TenantAddress;
	readonly email: string;
	readonly help_email: string;
	readonly phone: string;
}

export interface Tenant {
	readonly name: string;
	readonly billing_details: TenantBillingDetails;
	readonly status: ENTITY_STATUS;
	readonly metadata: Metadata;
}

export enum TenantMetadataKey {
	ONBOARDING_COMPLETED = 'onboarding_completed',
}

/** Values stored against a `TenantMetadataKey`. Metadata is a string map, so `'true'` is a string. */
export enum TenantMetadataFlag {
	True = 'true',
	False = 'false',
}
