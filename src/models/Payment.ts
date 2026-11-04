import { PAYMENT_STATUS } from '@/constants';
import { BaseModel, Metadata } from './base';

export interface Payment extends BaseModel {
	readonly amount: number;
	readonly attempts: Attempt[];
	readonly invoice_number: string;
	readonly currency: string;
	readonly destination_id: string;
	readonly destination_type: PAYMENT_DESTINATION_TYPE;
	readonly error_message: string;
	readonly failed_at: string;
	readonly idempotency_key: string;
	readonly metadata: Metadata;
	readonly payment_method_id: string;
	readonly payment_method_type: PAYMENT_METHOD_TYPE;
	readonly payment_status: PAYMENT_STATUS;
	readonly refunded_at: string;
	readonly succeeded_at: string;
	readonly track_attempts: boolean;
	readonly payment_gateway?: string;
	readonly gateway_payment_id?: string;
	readonly gateway_tracking_id?: string;
	readonly gateway_metadata?: Metadata;
	readonly payment_url?: string;
	readonly session_id?: string;
}

export interface Attempt extends BaseModel {
	readonly attempt_number: number;
	readonly error_message: string;
	readonly metadata: Metadata;
	readonly payment_id: string;
}

export enum PAYMENT_METHOD_TYPE {
	CARD = 'CARD',
	ACH = 'ACH',
	OFFLINE = 'OFFLINE',
	CREDITS = 'CREDITS',
	PAYMENT_LINK = 'PAYMENT_LINK',
	UPI = 'UPI',
}

export enum PAYMENT_DESTINATION_TYPE {
	INVOICE = 'INVOICE',
	SUBSCRIPTION = 'SUBSCRIPTION',
}
