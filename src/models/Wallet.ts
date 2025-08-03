import { BaseModel } from './base';
import { Meter } from './Meter';

export interface Wallet extends BaseModel {
	readonly balance: number;
	readonly name: string;
	readonly currency: string;
	readonly customer_id: string;
	readonly metadata: Record<string, any>;
	readonly wallet_status: WALLET_STATUS;
	readonly conversion_rate: number;
	readonly meter: Meter;
	readonly alert_enabled?: boolean;
	readonly alert_config?: {
		threshold: {
			type: 'amount' | 'percentage';
			value: string;
		};
	};
}

export enum WALLET_STATUS {
	ACTIVE = 'active',
	FROZEN = 'frozen',
	CLOSED = 'closed',
}

export enum WALLET_TX_REFERENCE_TYPE {
	PAYMENT = 'PAYMENT',
	EXTERNAL = 'EXTERNAL',
	REQUEST = 'REQUEST',
}

export enum WALLET_TRANSACTION_REASON {
	INVOICE_PAYMENT = 'INVOICE_PAYMENT',
	FREE_CREDIT_GRANT = 'FREE_CREDIT_GRANT',
	SUBSCRIPTION_CREDIT_GRANT = 'SUBSCRIPTION_CREDIT_GRANT',
	PURCHASED_CREDIT_INVOICED = 'PURCHASED_CREDIT_INVOICED',
	PURCHASED_CREDIT_DIRECT = 'PURCHASED_CREDIT_DIRECT',
	INVOICE_REFUND = 'INVOICE_REFUND',
	CREDIT_EXPIRED = 'CREDIT_EXPIRED',
	WALLET_TERMINATION = 'WALLET_TERMINATION',
	CREDIT_NOTE = 'CREDIT_NOTE',
}

export enum WALLET_TRANSACTION_TYPE {
	CREDIT = 'credit',
	DEBIT = 'debit',
}

export enum WALLET_TYPE {
	PROMOTIONAL = 'PROMOTIONAL',
	PRE_PAID = 'PRE_PAID',
}

export enum WALLET_AUTO_TOPUP_TRIGGER {
	DISABLED = 'disabled',
	BALANCE_BELOW_THRESHOLD = 'balance_below_threshold',
}
