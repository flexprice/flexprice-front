import { describe, expect, it } from 'vitest';
import { SUBSCRIPTION_MODIFY_TYPE } from '@/models';
import { PRICE_TYPE } from '@/models/Price';
import type { Price } from '@/models/Price';
import { ADDON_CADENCE, ADDON_CHANGE_AT, ADDON_PRORATION_BEHAVIOR, ADDON_CHANGE_TIMING } from '@/types/dto/Addon';
import {
	buildAddonBulkAdd,
	buildAddonBulkModifyRequest,
	buildAddonBulkRemove,
	createAddonDraft,
	createAddonRemovalDraft,
	isAddonDraftMissingCustomDate,
	isAddonRemovalMissingCustomDate,
} from './buildAddonBulkModifyRequest';

const makePrice = (overrides: Partial<Price> & Pick<Price, 'id' | 'type'>): Price =>
	({
		amount: '10',
		min_quantity: undefined,
		...overrides,
	}) as Price;

describe('buildAddonBulkAdd', () => {
	it('sends only addon_id and change_at for an untouched draft', () => {
		expect(buildAddonBulkAdd(createAddonDraft('addon_1', 'k1'), [])).toEqual({
			addon_id: 'addon_1',
			change_at: ADDON_CHANGE_AT.IMMEDIATE,
		});
	});

	it('sends end_of_period without a start_date', () => {
		const draft = { ...createAddonDraft('addon_1', 'k1'), startTiming: ADDON_CHANGE_TIMING.END_OF_PERIOD, customStartDate: new Date() };
		const add = buildAddonBulkAdd(draft, []);
		expect(add.change_at).toBe(ADDON_CHANGE_AT.END_OF_PERIOD);
		expect(add.start_date).toBeUndefined();
	});

	it('sends only start_date for a custom date, never change_at', () => {
		const date = new Date('2026-10-05T00:00:00.000Z');
		const draft = { ...createAddonDraft('addon_1', 'k1'), startTiming: ADDON_CHANGE_TIMING.CUSTOM, customStartDate: date };
		expect(buildAddonBulkAdd(draft, [])).toEqual({ addon_id: 'addon_1', start_date: date.toISOString() });
	});

	it('includes cadence, proration and quantity overrides when set', () => {
		const price = makePrice({ id: 'price_fixed', type: PRICE_TYPE.FIXED });
		const draft = {
			...createAddonDraft('addon_1', 'k1'),
			cadence: ADDON_CADENCE.ONETIME,
			prorationBehavior: ADDON_PRORATION_BEHAVIOR.NONE,
			overriddenPrices: { price_fixed: { price_id: 'price_fixed', quantity: 3 } },
		};
		expect(buildAddonBulkAdd(draft, [price])).toMatchObject({
			cadence: ADDON_CADENCE.ONETIME,
			proration_behavior: ADDON_PRORATION_BEHAVIOR.NONE,
			override_line_items: [{ price_id: 'price_fixed', quantity: '3' }],
		});
	});

	it('drops overrides for prices outside the filtered list', () => {
		const draft = { ...createAddonDraft('addon_1', 'k1'), overriddenPrices: { price_other: { price_id: 'price_other', quantity: 3 } } };
		expect(buildAddonBulkAdd(draft, []).override_line_items).toBeUndefined();
	});
});

describe('buildAddonBulkModifyRequest', () => {
	it('wraps every draft as an add under type addon', () => {
		const request = buildAddonBulkModifyRequest([createAddonDraft('addon_1', 'k1'), createAddonDraft('addon_2', 'k2')], {});
		expect(request.type).toBe(SUBSCRIPTION_MODIFY_TYPE.ADDON);
		expect(request.addon_bulk_params?.adds?.map((a) => a.addon_id)).toEqual(['addon_1', 'addon_2']);
		expect(request.addon_bulk_params?.removes).toBeUndefined();
	});
});

describe('isAddonDraftMissingCustomDate', () => {
	it('flags only custom timing without a date', () => {
		const draft = createAddonDraft('addon_1', 'k1');
		expect(isAddonDraftMissingCustomDate(draft)).toBe(false);
		expect(isAddonDraftMissingCustomDate({ ...draft, startTiming: ADDON_CHANGE_TIMING.CUSTOM })).toBe(true);
		expect(isAddonDraftMissingCustomDate({ ...draft, startTiming: ADDON_CHANGE_TIMING.CUSTOM, customStartDate: new Date() })).toBe(false);
	});
});

describe('buildAddonBulkRemove', () => {
	it('defaults to end of period with no proration', () => {
		expect(buildAddonBulkRemove(createAddonRemovalDraft('assoc_1'))).toEqual({
			addon_association_id: 'assoc_1',
			change_at: ADDON_CHANGE_AT.END_OF_PERIOD,
			proration_behavior: ADDON_PRORATION_BEHAVIOR.NONE,
		});
	});

	it('sends only effective_date for a custom date, never change_at', () => {
		const date = new Date('2026-10-06T00:00:00.000Z');
		const removal = { ...createAddonRemovalDraft('assoc_1'), endTiming: ADDON_CHANGE_TIMING.CUSTOM, customEndDate: date };
		const remove = buildAddonBulkRemove(removal);
		expect(remove.effective_date).toBe(date.toISOString());
		expect(remove.change_at).toBeUndefined();
	});

	it('flags a custom end without a date', () => {
		expect(isAddonRemovalMissingCustomDate({ ...createAddonRemovalDraft('assoc_1'), endTiming: ADDON_CHANGE_TIMING.CUSTOM })).toBe(true);
		expect(isAddonRemovalMissingCustomDate(createAddonRemovalDraft('assoc_1'))).toBe(false);
	});
});

describe('buildAddonBulkModifyRequest with removals', () => {
	it('sends adds and removes together, omitting an empty side', () => {
		const onlyRemoves = buildAddonBulkModifyRequest([], {}, [createAddonRemovalDraft('assoc_1')]);
		expect(onlyRemoves.addon_bulk_params?.adds).toBeUndefined();
		expect(onlyRemoves.addon_bulk_params?.removes).toHaveLength(1);

		const both = buildAddonBulkModifyRequest([createAddonDraft('addon_1', 'k1')], {}, [createAddonRemovalDraft('assoc_1')]);
		expect(both.addon_bulk_params?.adds).toHaveLength(1);
		expect(both.addon_bulk_params?.removes).toHaveLength(1);
	});
});
