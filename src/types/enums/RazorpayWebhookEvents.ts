/**
 * Enum for Razorpay webhook events used in the application
 * This provides type safety and prevents typos when working with webhook events
 */
export enum RazorpayWebhookEvents {
	// Payment events
	PAYMENT_CAPTURED = 'payment.captured',
	PAYMENT_FAILED = 'payment.failed',

	// Payment link events (https://razorpay.com/docs/webhooks/payment-links/)
	// Note: Razorpay has no payment.link.failed event; failed link payments use PAYMENT_FAILED
	PAYMENT_LINK_PAID = 'payment.link.paid',
	PAYMENT_LINK_EXPIRED = 'payment.link.expired',
	PAYMENT_LINK_CANCELLED = 'payment.link.cancelled',
}

/**
 * Helper function to get default webhook events
 * @returns Array of default Razorpay webhook events
 */
export const getDefaultRazorpayWebhookEvents = (): RazorpayWebhookEvents[] => [
	RazorpayWebhookEvents.PAYMENT_CAPTURED,
	RazorpayWebhookEvents.PAYMENT_FAILED,
	RazorpayWebhookEvents.PAYMENT_LINK_PAID,
];
