import { describe, expect, it } from 'vitest';
import { resolveSsoTenantId } from './resolveSsoTenantId';

describe('resolveSsoTenantId', () => {
	it('prefers the URL param over the env tenant', () => {
		expect(resolveSsoTenantId('tenant_url', 'tenant_env')).toBe('tenant_url');
	});

	it('falls back to the env tenant when no param (single-tenant deployment)', () => {
		expect(resolveSsoTenantId(null, 'tenant_env')).toBe('tenant_env');
		expect(resolveSsoTenantId('', 'tenant_env')).toBe('tenant_env');
		expect(resolveSsoTenantId('   ', 'tenant_env')).toBe('tenant_env');
	});

	it('returns undefined when neither is set (button hidden)', () => {
		expect(resolveSsoTenantId(null, undefined)).toBeUndefined();
		expect(resolveSsoTenantId('  ', '  ')).toBeUndefined();
		expect(resolveSsoTenantId(undefined, '')).toBeUndefined();
	});

	it('trims surrounding whitespace on the resolved value', () => {
		expect(resolveSsoTenantId('  tenant_url  ', undefined)).toBe('tenant_url');
		expect(resolveSsoTenantId(null, '  tenant_env  ')).toBe('tenant_env');
	});
});
