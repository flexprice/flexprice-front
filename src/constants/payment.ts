// =============================================================================
// PAYMENT FEATURE CONSTANTS
// =============================================================================

// =============================================================================
// PAYMENT ENUMS
// =============================================================================

export enum PAYMENT_STATUS {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	INITIATED = 'INITIATED',
	SUCCEEDED = 'SUCCEEDED',
	FAILED = 'FAILED',
	REFUNDED = 'REFUNDED',
	PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
	OVERPAID = 'OVERPAID',
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
}

// =============================================================================
// PAYMENT FORMATTERS
// =============================================================================

export const formatPaymentStatus = (status: string): string => {
	switch (status.toUpperCase()) {
		case PAYMENT_STATUS.PENDING:
			return 'Pending';
		case PAYMENT_STATUS.PROCESSING:
			return 'Processing';
		case PAYMENT_STATUS.INITIATED:
			return 'Initiated';
		case PAYMENT_STATUS.SUCCEEDED:
			return 'Succeeded';
		case PAYMENT_STATUS.FAILED:
			return 'Failed';
		case PAYMENT_STATUS.REFUNDED:
			return 'Refunded';
		case PAYMENT_STATUS.PARTIALLY_REFUNDED:
			return 'Partially Refunded';
		case PAYMENT_STATUS.OVERPAID:
			return 'Overpaid';
		default:
			return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
	}
};

export const formatPaymentMethodType = (type: string): string => {
	switch (type.toUpperCase()) {
		case PAYMENT_METHOD_TYPE.CARD:
			return 'Credit Card';
		case PAYMENT_METHOD_TYPE.ACH:
			return 'ACH Transfer';
		case PAYMENT_METHOD_TYPE.OFFLINE:
			return 'Offline Payment';
		case PAYMENT_METHOD_TYPE.CREDITS:
			return 'Credits';
		case PAYMENT_METHOD_TYPE.PAYMENT_LINK:
			return 'Payment Link';
		case PAYMENT_METHOD_TYPE.UPI:
			return 'UPI';
		default:
			return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
	}
};
