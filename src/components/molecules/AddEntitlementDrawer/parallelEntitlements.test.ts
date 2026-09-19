import { describe, expect, it } from 'vitest';
import { ENTITLEMENT_AGGREGATION_MODE } from '@/models/Entitlement';
import { blocksAnotherEntitlement } from './parallelEntitlements';

describe('blocksAnotherEntitlement', () => {
	// entitlement_uniq_v2 is unique on (tenant, env, entity, feature) only WHERE
	// aggregation_mode <> 'parallel', so parallel rows may repeat on a feature.
	it('lets a parallel entitlement share a feature', () => {
		expect(blocksAnotherEntitlement({ aggregation_mode: ENTITLEMENT_AGGREGATION_MODE.PARALLEL })).toBe(false);
	});

	it('blocks a second additive entitlement', () => {
		expect(blocksAnotherEntitlement({ aggregation_mode: ENTITLEMENT_AGGREGATION_MODE.ADDITIVE })).toBe(true);
	});

	it('treats an unset mode as additive, which is the server default', () => {
		expect(blocksAnotherEntitlement({})).toBe(true);
	});
});
