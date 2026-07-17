import { Connection, CONNECTION_PROVIDER_TYPE } from '@/models';

export interface GetConnectionsPayload {
	status?: string;
	provider_type?: CONNECTION_PROVIDER_TYPE;
	limit?: number;
	offset?: number;
}

export interface GetConnectionsResponse {
	connections: Connection[];
	total: number;
	limit: number;
	offset: number;
}

export interface CreateConnectionPayload {
	name: string;
	provider_type: CONNECTION_PROVIDER_TYPE;
	metadata?: Record<string, string>;
	encrypted_secret_data:
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.STRIPE;
				account_id?: string;
				publishable_key?: string;
				secret_key?: string;
				webhook_secret?: string;
		  }
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.RAZORPAY;
				key_id?: string;
				secret_key?: string;
				webhook_secret?: string;
		  }
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.S3;
				aws_access_key_id?: string;
				aws_secret_access_key?: string;
				aws_session_token?: string;
		  }
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.HUBSPOT;
				access_token?: string;
				client_secret?: string;
		  }
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.CHARGEBEE;
				api_key?: string;
				site?: string;
				webhook_username?: string;
				webhook_password?: string;
		  }
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.QUICKBOOKS;
				client_id?: string;
				client_secret?: string;
				auth_code?: string;
				redirect_uri?: string;
				realm_id?: string;
				environment?: 'sandbox' | 'production';
				income_account_id?: string;
		  }
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.ZOHO_BOOKS;
				client_id?: string;
				client_secret?: string;
				organization_id?: string;
				organization_name?: string;
				accounts_server?: string;
				location?: string;
				webhook_secret?: string;
		  }
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.NOMOD;
				api_key?: string;
				webhook_secret?: string;
		  }
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.MOYASAR;
				publishable_key?: string;
				secret_key?: string;
				webhook_secret?: string;
		  }
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.PADDLE;
				api_key?: string;
				webhook_secret?: string;
				client_side_token?: string;
		  }
		| {
				role_arn?: string;
				external_id?: string;
		  }
		| {
				api_key?: string;
				webhook_secret?: string;
		  };
	sync_config?: {
		plan?: {
			inbound: boolean;
			outbound: boolean;
		};
		subscription?: {
			inbound: boolean;
			outbound: boolean;
		};
		invoice?: {
			inbound: boolean;
			outbound: boolean;
		};
		deal?: {
			inbound: boolean;
			outbound: boolean;
		};
		quote?: {
			inbound: boolean;
			outbound: boolean;
		};
	};
}

export interface UpdateConnectionPayload {
	name: string;
	metadata?: Record<string, string>;
	encrypted_secret_data?:
		| {
				provider_type: CONNECTION_PROVIDER_TYPE.QUICKBOOKS;
				realm_id?: string;
				environment?: 'sandbox' | 'production';
				income_account_id?: string;
		  }
		| Record<string, any>;
	sync_config?: {
		plan?: {
			inbound: boolean;
			outbound: boolean;
		};
		subscription?: {
			inbound: boolean;
			outbound: boolean;
		};
		invoice?: {
			inbound: boolean;
			outbound: boolean;
		};
		deal?: {
			inbound: boolean;
			outbound: boolean;
		};
		quote?: {
			inbound: boolean;
			outbound: boolean;
		};
	};
}
