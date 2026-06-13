import type { LineItem } from '@/models/Subscription';
import { SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE } from '@/models/Subscription';
import { ENTITY_STATUS } from '@/models/base';
import type { SubscriptionLineItemListItem } from '@/types/dto/Subscription';

/** Map line-item search result to dashboard `LineItem` (table overrides, dialogs). */
export function subscriptionLineItemListItemToLineItem(item: SubscriptionLineItemListItem): LineItem {
	const extra = item as SubscriptionLineItemListItem & {
		subscription_phase_id?: string;
		environment_id?: string;
		tenant_id?: string;
		created_by?: string;
		updated_by?: string;
		status?: ENTITY_STATUS;
	};

	const end = item.end_date?.trim().length ? item.end_date : '';
	return {
		id: item.id,
		created_at: item.created_at,
		updated_at: item.updated_at,
		created_by: extra.created_by ?? '',
		updated_by: extra.updated_by ?? '',
		tenant_id: extra.tenant_id ?? '',
		status: extra.status ?? ENTITY_STATUS.PUBLISHED,
		environment_id: extra.environment_id ?? '',
		subscription_id: item.subscription_id,
		customer_id: item.customer_id,
		plan_id: extra.entity_type === SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.PLAN ? extra.entity_id : undefined,
		price_id: item.price_id,
		meter_id: item.meter_id ?? '',
		display_name: item.display_name,
		plan_display_name: item.plan_display_name ?? '',
		meter_display_name: item.meter_display_name ?? '',
		price_type: item.price_type,
		billing_period: item.billing_period,
		currency: item.currency,
		quantity: item.quantity ?? 0,
		start_date: item.start_date,
		end_date: end,
		metadata: item.metadata ?? {},
		price: item.price as LineItem['price'],
		subscription_phase_id: extra.subscription_phase_id,
		entity_type: item.entity_type,
		entity_id: item.entity_id,
		commitment_amount: item.commitment_amount,
		commitment_quantity: item.commitment_quantity,
		commitment_type: item.commitment_type,
		commitment_overage_factor: item.commitment_overage_factor,
		commitment_true_up_enabled: item.commitment_true_up_enabled,
		commitment_windowed: item.commitment_windowed,
		commitment_duration: item.commitment_duration,
		commitment_time_buckets: item.commitment_time_buckets,
	} as LineItem;
}
