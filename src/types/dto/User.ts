export interface CreateUserRequest {
	name: string;
	email: string;
	password: string;
}

export interface UpdateTenantPayload {
	billing_details: {
		address: {
			address_line1: string;
			address_line2: string;
			address_city: string;
			address_state: string;
			address_postal_code: string;
			address_country: string;
		};
		email?: string;
		help_email?: string;
		phone?: string;
	};
}
