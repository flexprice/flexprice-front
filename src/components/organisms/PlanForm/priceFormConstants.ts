import type { SelectOption } from '@/components/atoms';
import { BILLING_MODEL } from '@/models/Price';
import { PERCENTAGE_BILLING_MODEL } from '@/utils/common/percentage_price_helpers';

/**
 * Enum for internal price states to avoid typos and provide better type safety
 */
export enum PriceInternalState {
	NEW = 'new',
	EDIT = 'edit',
	SAVED = 'saved',
}

// TODO: Remove disabled once the feature is released
export const billingModels: SelectOption[] = [
	{
		value: BILLING_MODEL.FLAT_FEE,
		label: 'Flat Fee',
		description: 'Charge a fixed amount for each unit of usage.',
	},
	{
		value: BILLING_MODEL.PACKAGE,
		label: 'Package',
		description: 'Charge by package, bundle or group of units.',
	},
	{
		value: BILLING_MODEL.TIERED,
		label: 'Volume Tiered',
		description: 'All units price based on final tier reached.',
	},
	{
		value: 'SLAB_TIERED',
		label: 'Slab Tiered',
		description: 'Tiers apply progressively as quantity increases.',
	}, // Maps to TIERED with SLAB tier_mode
	{
		value: PERCENTAGE_BILLING_MODEL,
		label: 'Percentage Fee',
		description: 'Charge a percentage of the billable value.',
	}, // Maps to FLAT_FEE with the decimal equivalent + a percentage metadata marker
];
