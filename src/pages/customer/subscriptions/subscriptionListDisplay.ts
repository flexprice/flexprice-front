import { SubscriptionResponse } from '@/types/dto/Subscription';
import type { StatusChipStatus } from '@/components/atoms/StatusChip';
import { SUBSCRIPTION_STATUS } from '@/models/Subscription';

export type SubscriptionListRow = SubscriptionResponse;

export interface SubscriptionListStatus {
	status: StatusChipStatus;
	kind: 'active' | 'trial' | 'cancelled' | 'incomplete' | 'draft' | 'inactive';
}

export function getSubscriptionListStatus(status: string): SubscriptionListStatus {
	switch (status) {
		case SUBSCRIPTION_STATUS.ACTIVE:
			return { status: 'Active', kind: 'active' };
		case SUBSCRIPTION_STATUS.TRIALING:
			return { status: 'Trial', kind: 'trial' };
		case SUBSCRIPTION_STATUS.CANCELLED:
			return { status: 'Cancelled', kind: 'cancelled' };
		case SUBSCRIPTION_STATUS.INCOMPLETE:
			return { status: 'Pending', kind: 'incomplete' };
		case SUBSCRIPTION_STATUS.DRAFT:
			return { status: 'Draft', kind: 'draft' };
		default:
			return { status: 'Inactive', kind: 'inactive' };
	}
}
