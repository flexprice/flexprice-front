import { describe, expect, it } from 'vitest';
import { DataType, FilterCondition, FilterOperator } from '@/types/common/QueryBuilder';
import { METADATA_TYPED_FILTER_FIELD } from '@/types/formatters/QueryBuilder';
import { parseTenantAllowlist } from '@/config/customerOrgTypeFilter';
import { mergeMetadataPairsFromFilters } from '@/utils/queryBuilder/metadataPairs';
import { getActiveMetadataValue, updateMetadataToggleFilters } from '@/utils/queryBuilder/metadataToggleFilters';

const orgTypeConfig = {
	metadataKey: 'org_type',
	options: [
		{ value: 'parent', label: 'Parent' },
		{ value: 'child', label: 'Child' },
	],
};

const metadataFilter = (pairs: { key: string; value: string }[], id = 'metadata-1'): FilterCondition => ({
	id,
	field: METADATA_TYPED_FILTER_FIELD,
	operator: FilterOperator.EQUAL,
	dataType: DataType.STRING,
	valueString: JSON.stringify(pairs),
});

describe('updateMetadataToggleFilters', () => {
	it('adds org_type when toggling parent on', () => {
		const next = updateMetadataToggleFilters([], orgTypeConfig, 'parent');
		expect(next).toHaveLength(1);
		expect(next[0].valueString).toBe(JSON.stringify([{ key: 'org_type', value: 'parent' }]));
	});

	it('clears org_type when toggling the active value off', () => {
		const filters = [metadataFilter([{ key: 'org_type', value: 'parent' }])];
		const next = updateMetadataToggleFilters(filters, orgTypeConfig, 'parent');
		expect(next).toHaveLength(0);
	});

	it('switches from parent to child', () => {
		const filters = [metadataFilter([{ key: 'org_type', value: 'parent' }])];
		const next = updateMetadataToggleFilters(filters, orgTypeConfig, 'child');
		expect(next[0].valueString).toBe(JSON.stringify([{ key: 'org_type', value: 'child' }]));
	});

	it('preserves other metadata keys', () => {
		const filters = [
			metadataFilter([
				{ key: 'tier', value: 'gold' },
				{ key: 'org_type', value: 'parent' },
			]),
		];
		const next = updateMetadataToggleFilters(filters, orgTypeConfig, 'child');
		expect(next[0].valueString).toBe(
			JSON.stringify([
				{ key: 'tier', value: 'gold' },
				{ key: 'org_type', value: 'child' },
			]),
		);
	});

	it('consolidates multiple metadata pseudo-filters into one', () => {
		const filters = [
			metadataFilter([{ key: 'tier', value: 'gold' }], 'metadata-1'),
			metadataFilter([{ key: 'org_type', value: 'parent' }], 'metadata-2'),
			{ id: 'name', field: 'name', operator: FilterOperator.CONTAINS, dataType: DataType.STRING, valueString: 'acme' },
		];
		const next = updateMetadataToggleFilters(filters, orgTypeConfig, 'child');
		expect(next.filter((filter) => filter.field === METADATA_TYPED_FILTER_FIELD)).toHaveLength(1);
		expect(next[0].field).toBe('name');
		expect(next[1].valueString).toBe(
			JSON.stringify([
				{ key: 'tier', value: 'gold' },
				{ key: 'org_type', value: 'child' },
			]),
		);
	});

	it('clears org_type via the all/clear path', () => {
		const filters = [
			metadataFilter([
				{ key: 'org_type', value: 'child' },
				{ key: 'tier', value: 'gold' },
			]),
		];
		const next = updateMetadataToggleFilters(filters, orgTypeConfig);
		expect(next).toHaveLength(1);
		expect(next[0].valueString).toBe(JSON.stringify([{ key: 'tier', value: 'gold' }]));
	});
});

describe('getActiveMetadataValue', () => {
	it('reads org_type from any metadata pseudo-filter row', () => {
		const filters = [
			metadataFilter([{ key: 'tier', value: 'gold' }], 'metadata-1'),
			metadataFilter([{ key: 'org_type', value: 'child' }], 'metadata-2'),
		];
		expect(getActiveMetadataValue(filters, 'org_type', new Set(['parent', 'child']))).toBe('child');
	});
});

describe('mergeMetadataPairsFromFilters', () => {
	it('merges duplicate keys with later filters winning', () => {
		const pairs = mergeMetadataPairsFromFilters(
			[
				metadataFilter([{ key: 'org_type', value: 'parent' }]),
				metadataFilter([
					{ key: 'org_type', value: 'child' },
					{ key: 'tier', value: 'gold' },
				]),
			],
			METADATA_TYPED_FILTER_FIELD,
		);
		expect(pairs).toEqual([
			{ key: 'org_type', value: 'child' },
			{ key: 'tier', value: 'gold' },
		]);
	});
});

describe('parseTenantAllowlist', () => {
	it('parses comma-separated tenant IDs', () => {
		expect(parseTenantAllowlist(' tenant-a, tenant-b ')).toEqual(new Set(['tenant-a', 'tenant-b']));
	});

	it('parses JSON array tenant IDs', () => {
		expect(parseTenantAllowlist('["tenant-a","tenant-b"]')).toEqual(new Set(['tenant-a', 'tenant-b']));
	});

	it('returns empty set for blank input', () => {
		expect(parseTenantAllowlist('')).toEqual(new Set());
		expect(parseTenantAllowlist(undefined)).toEqual(new Set());
	});
});
