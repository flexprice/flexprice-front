import { describe, expect, it } from 'vitest';
import { generateExternalId } from './generateExternalId';

describe('generateExternalId', () => {
	it('joins tenant and environment ids with an underscore', () => {
		expect(generateExternalId('tenant_abc', 'env_xyz')).toBe('tenant_abc_env_xyz');
	});
});
