import { BaseModel, Metadata } from './base';

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
}

export default Customer;
