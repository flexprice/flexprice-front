import { describe, expect, it } from 'vitest';
import { SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { getSubscriptionListStatus } from './subscriptionListDisplay';

describe('subscriptionListDisplay', () => {
	it('maps Figma statuses onto StatusChip names', () => {
		expect(getSubscriptionListStatus(SUBSCRIPTION_STATUS.ACTIVE)).toEqual({ status: 'Active', kind: 'active' });
		expect(getSubscriptionListStatus(SUBSCRIPTION_STATUS.TRIALING)).toEqual({ status: 'Trial', kind: 'trial' });
		expect(getSubscriptionListStatus(SUBSCRIPTION_STATUS.CANCELLED)).toEqual({ status: 'Cancelled', kind: 'cancelled' });
	});
});
