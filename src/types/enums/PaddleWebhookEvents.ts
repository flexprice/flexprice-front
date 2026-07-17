/**
 * Enum for Paddle webhook events used in the application
 * This provides type safety and prevents typos when working with webhook events
 */
export enum PaddleWebhookEvents {
	// Transaction events
	TRANSACTIONS_COMPLETED = 'transaction.completed',

	// Subscription events
	SUBSCRIPTION_ACTIVATED = 'subscription.activated',
}

/**
 * Helper function to get default webhook events
 * @returns Array of default Paddle webhook events
 */
export const getDefaultPaddleWebhookEvents = (): PaddleWebhookEvents[] => [
	PaddleWebhookEvents.TRANSACTIONS_COMPLETED,
	PaddleWebhookEvents.SUBSCRIPTION_ACTIVATED,
];
