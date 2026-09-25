import { Price } from '@/models/Price';
import { AddAddonToSubscriptionRequest, ADDON_CHANGE_TIMING } from '@/types/dto/Addon';
import { getLineItemOverrides, overrideLineItemsToMap } from '@/utils/common/price_override_helpers';
import { sanitizeAddonOverrideLineItemsForApi } from '@/utils/subscription/addonQuantity';
import { AddonDraft, createAddonDraft } from '@/utils/subscription/buildAddonBulkModifyRequest';

/**
 * Staged addon → `addons[]` entry of the create-subscription form. Commitments stay raw: the
 * create page enriches them against the filtered prices when it submits.
 */
export function addonDraftToCreateRequest(
	draft: AddonDraft,
	prices: Price[],
	base?: AddAddonToSubscriptionRequest,
): AddAddonToSubscriptionRequest {
	const hasCommitments = Object.keys(draft.lineItemCommitments).length > 0;
	return {
		addon_id: draft.addonId,
		start_date: draft.startTiming === ADDON_CHANGE_TIMING.CUSTOM ? draft.customStartDate?.toISOString() : undefined,
		metadata: base?.metadata || {},
		line_item_commitments: hasCommitments ? draft.lineItemCommitments : undefined,
		override_line_items: sanitizeAddonOverrideLineItemsForApi(getLineItemOverrides(prices, draft.overriddenPrices), prices),
	};
}

/** Existing `addons[]` entry → a draft, for editing it in the addon modal. */
export function addonDraftFromCreateRequest(addon: AddAddonToSubscriptionRequest, key: string): AddonDraft {
	const startDate = addon.start_date ? new Date(addon.start_date) : undefined;
	const hasStartDate = !!startDate && !isNaN(startDate.getTime());
	return {
		...createAddonDraft(addon.addon_id, key),
		overriddenPrices: overrideLineItemsToMap(addon.override_line_items),
		lineItemCommitments: addon.line_item_commitments ?? {},
		...(hasStartDate ? { startTiming: ADDON_CHANGE_TIMING.CUSTOM, customStartDate: startDate } : {}),
	};
}
