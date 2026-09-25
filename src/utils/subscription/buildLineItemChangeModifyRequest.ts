import { SUBSCRIPTION_MODIFY_TYPE } from '@/models';
import type { ExecuteSubscriptionModifyRequest, LineItemChange } from '@/types/dto/Subscription';

export interface BuildLineItemChangeModifyRequestParams {
	lineItemId: string;
	/** Decimal quantity as string (API JSON); omit to keep the current quantity. */
	quantity?: string;
	/** Decimal per-unit price as string (API JSON); omit to keep the current price. */
	amount?: string;
	/** ISO 8601; omit for effective immediately. */
	effectiveDateIso?: string;
}

export function buildLineItemChangeModifyRequest({
	lineItemId,
	quantity,
	amount,
	effectiveDateIso,
}: BuildLineItemChangeModifyRequestParams): ExecuteSubscriptionModifyRequest {
	const lineItem: LineItemChange = { id: lineItemId };
	if (quantity !== undefined) {
		lineItem.quantity = quantity;
	}
	if (amount !== undefined) {
		lineItem.amount = amount;
	}
	if (effectiveDateIso) {
		lineItem.effective_date = effectiveDateIso;
	}
	return {
		type: SUBSCRIPTION_MODIFY_TYPE.LINE_ITEM_CHANGE,
		line_item_change_params: {
			line_items: [lineItem],
		},
	};
}
