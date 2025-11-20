/**
 * Enum for Chargebee webhook events used in the application
 * This provides type safety and prevents typos when working with webhook events
 */
export enum ChargebeeWebhookEvents {
	// Payment events
	PAYMENT_SUCCEEDED = 'payment_succeeded',
}

/**
 * Helper function to get default webhook events
 * @returns Array of default Chargebee webhook events
 */
export const getDefaultChargebeeWebhookEvents = (): ChargebeeWebhookEvents[] => [ChargebeeWebhookEvents.PAYMENT_SUCCEEDED];
