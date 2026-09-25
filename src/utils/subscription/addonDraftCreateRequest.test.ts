import { describe, expect, it } from 'vitest';
import { PRICE_TYPE } from '@/models/Price';
import type { Price } from '@/models/Price';
import { ADDON_CHANGE_TIMING } from '@/types/dto/Addon';
import { addonDraftFromCreateRequest, addonDraftToCreateRequest } from './addonDraftCreateRequest';
import { createAddonDraft } from './buildAddonBulkModifyRequest';

const fixedPrice = { id: 'price_fixed', type: PRICE_TYPE.FIXED, amount: '10' } as Price;

describe('addonDraftToCreateRequest', () => {
	it('omits start_date and empty commitments for an untouched draft', () => {
		expect(addonDraftToCreateRequest(createAddonDraft('addon_1', 'k1'), [])).toEqual({
			addon_id: 'addon_1',
			start_date: undefined,
			metadata: {},
			line_item_commitments: undefined,
			override_line_items: undefined,
		});
	});

	it('carries the chosen start date, overrides and the edited row metadata', () => {
		const date = new Date('2026-10-05T00:00:00.000Z');
		const draft = {
			...createAddonDraft('addon_1', 'k1'),
			startTiming: ADDON_CHANGE_TIMING.CUSTOM,
			customStartDate: date,
			overriddenPrices: { price_fixed: { price_id: 'price_fixed', quantity: 2 } },
		};
		expect(addonDraftToCreateRequest(draft, [fixedPrice], { addon_id: 'addon_1', metadata: { a: 1 } } as never)).toMatchObject({
			start_date: date.toISOString(),
			metadata: { a: 1 },
			override_line_items: [{ price_id: 'price_fixed', quantity: '2' }],
		});
	});
});

describe('addonDraftFromCreateRequest', () => {
	it('round-trips start date and quantity override', () => {
		const date = new Date('2026-10-05T00:00:00.000Z');
		const request = addonDraftToCreateRequest(
			{
				...createAddonDraft('addon_1', 'k1'),
				startTiming: ADDON_CHANGE_TIMING.CUSTOM,
				customStartDate: date,
				overriddenPrices: { price_fixed: { price_id: 'price_fixed', quantity: 2 } },
			},
			[fixedPrice],
		);
		const draft = addonDraftFromCreateRequest(request, 'k2');
		expect(draft.startTiming).toBe(ADDON_CHANGE_TIMING.CUSTOM);
		expect(draft.customStartDate?.toISOString()).toBe(date.toISOString());
		expect(addonDraftToCreateRequest(draft, [fixedPrice])).toEqual(request);
	});

	it('starts immediately when the entry has no start date', () => {
		expect(addonDraftFromCreateRequest({ addon_id: 'addon_1' } as never, 'k1').startTiming).toBe(ADDON_CHANGE_TIMING.IMMEDIATE);
	});
});
