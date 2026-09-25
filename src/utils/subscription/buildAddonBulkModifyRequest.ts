import { SUBSCRIPTION_MODIFY_TYPE } from '@/models';
import { Price } from '@/models/Price';
import { ADDON_CADENCE, ADDON_CHANGE_AT, ADDON_PRORATION_BEHAVIOR, ADDON_CHANGE_TIMING } from '@/types/dto/Addon';
import type { ExecuteSubscriptionModifyRequest, SubModifyAddonAdd, SubModifyAddonRemove } from '@/types/dto/Subscription';
import { LineItemCommitmentsMap } from '@/types/dto/LineItemCommitmentConfig';
import { ExtendedPriceOverride, getLineItemOverrides } from '@/utils/common/price_override_helpers';
import { sanitizeAddonLineItemCommitmentsForApi } from '@/utils/subscription/addon_commitment_helpers';
import { sanitizeAddonOverrideLineItemsForApi } from '@/utils/subscription/addonQuantity';

/** Backend cap on `addon_bulk_params` entries (adds + removes) per request. */
export const MAX_ADDON_BULK_ENTRIES = 20;

/** One addon staged in the add/modify addons dialog, before it is sent. */
export interface AddonDraft {
	/** Client-only id; the same addon cannot be staged twice, but keys keep React lists stable. */
	key: string;
	addonId: string;
	overriddenPrices: Record<string, ExtendedPriceOverride>;
	lineItemCommitments: LineItemCommitmentsMap;
	cadence: ADDON_CADENCE | '';
	prorationBehavior: ADDON_PRORATION_BEHAVIOR | '';
	startTiming: ADDON_CHANGE_TIMING;
	/** Only read when `startTiming` is CUSTOM. */
	customStartDate?: Date;
}

export const createAddonDraft = (addonId: string, key: string): AddonDraft => ({
	key,
	addonId,
	overriddenPrices: {},
	lineItemCommitments: {},
	cadence: '',
	prorationBehavior: '',
	startTiming: ADDON_CHANGE_TIMING.IMMEDIATE,
});

/** An existing addon marked for removal in the modify addons dialog. */
export interface AddonRemovalDraft {
	addonAssociationId: string;
	endTiming: ADDON_CHANGE_TIMING;
	/** Only read when `endTiming` is CUSTOM. */
	customEndDate?: Date;
	prorationBehavior: ADDON_PRORATION_BEHAVIOR;
}

/** Same defaults the single-addon cancel dialog used: end at period end, no proration. */
export const createAddonRemovalDraft = (addonAssociationId: string): AddonRemovalDraft => ({
	addonAssociationId,
	endTiming: ADDON_CHANGE_TIMING.END_OF_PERIOD,
	prorationBehavior: ADDON_PRORATION_BEHAVIOR.NONE,
});

/** A custom start needs a date; the named timings never carry one. */
export const isAddonDraftMissingCustomDate = (draft: AddonDraft): boolean =>
	draft.startTiming === ADDON_CHANGE_TIMING.CUSTOM && !draft.customStartDate;

export const isAddonRemovalMissingCustomDate = (removal: AddonRemovalDraft): boolean =>
	removal.endTiming === ADDON_CHANGE_TIMING.CUSTOM && !removal.customEndDate;

/**
 * The backend takes either `change_at` or a date, never both. Custom is UI-only: it sends just
 * the chosen date (under `dateField`); the named timings send just `change_at`.
 */
function buildTiming(
	timing: ADDON_CHANGE_TIMING,
	customDate: Date | undefined,
	dateField: 'start_date' | 'effective_date',
): { change_at?: ADDON_CHANGE_AT; start_date?: string; effective_date?: string } {
	switch (timing) {
		case ADDON_CHANGE_TIMING.CUSTOM:
			return customDate ? { [dateField]: customDate.toISOString() } : {};
		case ADDON_CHANGE_TIMING.END_OF_PERIOD:
			return { change_at: ADDON_CHANGE_AT.END_OF_PERIOD };
		default:
			return { change_at: ADDON_CHANGE_AT.IMMEDIATE };
	}
}

/** Build one `addon_bulk_params.removes` entry. */
export function buildAddonBulkRemove(removal: AddonRemovalDraft): SubModifyAddonRemove {
	return {
		addon_association_id: removal.addonAssociationId,
		...buildTiming(removal.endTiming, removal.customEndDate, 'effective_date'),
		proration_behavior: removal.prorationBehavior,
	};
}

/**
 * Build one `addon_bulk_params.adds` entry. `prices` must be the addon's prices already
 * filtered to the subscription (currency + cadence), the same list the dialog shows.
 */
export function buildAddonBulkAdd(draft: AddonDraft, prices: Price[]): SubModifyAddonAdd {
	const override_line_items = sanitizeAddonOverrideLineItemsForApi(getLineItemOverrides(prices, draft.overriddenPrices), prices);
	const line_item_commitments = sanitizeAddonLineItemCommitmentsForApi(draft.lineItemCommitments, prices);

	return {
		addon_id: draft.addonId,
		...buildTiming(draft.startTiming, draft.customStartDate, 'start_date'),
		...(draft.cadence ? { cadence: draft.cadence } : {}),
		...(draft.prorationBehavior ? { proration_behavior: draft.prorationBehavior } : {}),
		...(line_item_commitments ? { line_item_commitments } : {}),
		...(override_line_items ? { override_line_items } : {}),
	};
}

export function buildAddonBulkModifyRequest(
	drafts: AddonDraft[],
	pricesByAddonId: Record<string, Price[]>,
	removals: AddonRemovalDraft[] = [],
): ExecuteSubscriptionModifyRequest {
	return {
		type: SUBSCRIPTION_MODIFY_TYPE.ADDON,
		addon_bulk_params: {
			...(drafts.length > 0 ? { adds: drafts.map((draft) => buildAddonBulkAdd(draft, pricesByAddonId[draft.addonId] ?? [])) } : {}),
			...(removals.length > 0 ? { removes: removals.map(buildAddonBulkRemove) } : {}),
		},
	};
}
