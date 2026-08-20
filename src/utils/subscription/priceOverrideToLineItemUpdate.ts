import type { UpdateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import type { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';

/**
 * Converts price override form data into subscription line item update payload.
 */
export function convertPriceOverrideToLineItemUpdate(
	_priceId: string,
	override: Partial<ExtendedPriceOverride>,
): UpdateSubscriptionLineItemRequest {
	const updateData: UpdateSubscriptionLineItemRequest = {};

	if (override.amount != null && override.amount !== '') {
		const parsed = parseFloat(String(override.amount));
		if (Number.isFinite(parsed)) {
			updateData.amount = parsed;
		}
	}

	if (override.billing_model && override.billing_model !== 'SLAB_TIERED') {
		updateData.billing_model = override.billing_model;
	}

	if (override.tier_mode) {
		updateData.tier_mode = override.tier_mode;
	}

	if (override.tiers) {
		updateData.tiers = override.tiers;
	}

	if (override.transform_quantity) {
		updateData.transform_quantity = override.transform_quantity;
	}

	if (override.bucket_size) {
		updateData.bucket_size = override.bucket_size;
	}

	if (override.effective_from) {
		updateData.effective_from = override.effective_from;
	}

	return updateData;
}
