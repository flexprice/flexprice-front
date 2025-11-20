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
	};
}

export interface UpdateConnectionPayload {
	name: string;
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
	};
}
