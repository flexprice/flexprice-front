import { Metadata, Pagination, Payment, PAYMENT_DESTINATION_TYPE, PAYMENT_METHOD_TYPE } from '@/models';

export interface GetAllPaymentsPayload {
	currency?: string;
	destination_id?: string;
	destination_type?: string;
	end_time?: string;
	expand?: string;
	limit: number;
	offset: number;
	order?: 'asc' | 'desc';
	payment_gateway?: string;
	payment_ids?: string[];
	payment_method_type?: string;
	payment_status?: string;
	sort?: string;
	start_time?: string;
	status?: 'published' | 'deleted' | 'archived' | string;
}

export interface GetAllPaymentsResponse {
	items: Payment[];
	pagination: Pagination;
}

export interface MoyasarSetupIntentResponse {
	status: string;
	customer_id: string;
	checkout_token: string;
}

export interface RecordPaymentPayload {
	amount: number;
	currency: string;
	destination_id: string;
	destination_type: PAYMENT_DESTINATION_TYPE;
	idempotency_key?: string;
	metadata?: Metadata;
	payment_method_id?: string;
	payment_method_type: PAYMENT_METHOD_TYPE;
	payment_gateway?: string;
	process_payment?: boolean;
	recorded_at?: Date;
}
