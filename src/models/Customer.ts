import { BaseModel, Metadata } from './base';

export enum TAX_TREATMENT {
	TAXABLE = 'taxable',
	EXEMPT = 'exempt',
}

export interface Customer extends BaseModel {
	address_city: string;
	address_country: string;
	address_line1: string;
	address_line2: string;
	address_postal_code: string;
	address_state: string;
	email: string;
	external_id: string;
	metadata: Metadata;
	name: string;
	environment_id: string;
	timezone?: string;
	/** Lowercase ISO code invoices are issued in; absent means bill in the subscription's currency. */
	billing_currency?: string;
	// Exempt customers are never charged tax. Defaults to taxable.
	tax_treatment?: TAX_TREATMENT;
}

export default Customer;
