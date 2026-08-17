import { describe, expect, it } from 'vitest';
import { ENTITY_STATUS } from '@/models';
import { FEATURE_TYPE } from '@/models/Feature';
import { getFeatureListStatus, getFeatureTypeTone } from './featureListDisplay';

describe('featureListDisplay', () => {
	it('maps boolean to success, metered to warning, and everything else to neutral', () => {
		expect(getFeatureTypeTone(FEATURE_TYPE.BOOLEAN)).toBe('success');
		expect(getFeatureTypeTone(FEATURE_TYPE.METERED)).toBe('warning');
		expect(getFeatureTypeTone(FEATURE_TYPE.STATIC)).toBe('neutral');
		expect(getFeatureTypeTone(FEATURE_TYPE.CONFIG)).toBe('info');
	});

	it('maps published features to Active', () => {
		expect(getFeatureListStatus(ENTITY_STATUS.PUBLISHED)).toBe('Active');
		expect(getFeatureListStatus(ENTITY_STATUS.ARCHIVED)).toBe('Inactive');
	});
});
