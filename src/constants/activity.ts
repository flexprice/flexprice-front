/** Entity types offered in the filter: the v1 set, each with known actions (the API needs entity_type + entity_id together). */
export const ACTIVITY_ENTITY_TYPES = [
	'customer',
	'subscription',
	'invoice',
	'wallet',
	'wallet_transaction',
	'entitlement_grant',
	'plan',
	'price',
	'payment',
	'checkout_session',
] as const;

/** Types that carry a customer, so they can appear on a customer's own timeline (plans and prices cannot). */
export const ACTIVITY_CUSTOMER_ENTITY_TYPES = ACTIVITY_ENTITY_TYPES.filter((t) => t !== 'plan' && t !== 'price');

export const ACTIVITY_ACTIONS = [
	'customer.created',
	'customer.updated',
	'customer.deleted',
	'subscription.created',
	'subscription.updated',
	'subscription.paused',
	'subscription.resumed',
	'subscription.cancelled',
	'subscription.plan_changed',
	'invoice.created',
	'invoice.updated',
	'invoice.finalized',
	'invoice.voided',
	'invoice.paid',
	'wallet.created',
	'wallet.updated',
	'wallet_transaction.created',
	'entitlement_grant.created',
	'plan.created',
	'plan.updated',
	'plan.prices_synced',
	'price.created',
	'price.updated',
	'price.archived',
	'payment.created',
	'payment.updated',
	'checkout_session.created',
	'checkout_session.updated',
] as const;

export const ACTIVITY_ACTOR_TYPES = ['user', 'api_key', 'system', 'customer_portal'] as const;
