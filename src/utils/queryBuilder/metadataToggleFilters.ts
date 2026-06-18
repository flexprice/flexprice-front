import { DataType, FilterCondition, FilterOperator } from '@/types/common/QueryBuilder';
import { METADATA_TYPED_FILTER_FIELD, TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { mergeMetadataPairsFromFilters } from '@/utils/queryBuilder/metadataPairs';

export interface MetadataToggleQuickFilterOption {
	value: string;
	label: string;
}

export interface MetadataToggleQuickFilterConfig {
	/** Metadata key to filter on. Default: `org_type`. */
	metadataKey?: string;
	options: MetadataToggleQuickFilterOption[];
	/** Optional label for a button that clears the metadata quick filter. */
	allLabel?: string;
}

const getMetadataFilterRaw = (filter: FilterCondition | TypedBackendFilter | undefined): string | undefined => {
	if (!filter) return undefined;
	if ('valueString' in filter) return filter.valueString;
	return (filter as TypedBackendFilter).value?.string;
};

export const getActiveMetadataValue = (
	filters: FilterCondition[] | TypedBackendFilter[] | undefined,
	metadataKey: string,
	allowedValues: Set<string>,
): string | undefined => {
	for (const filter of filters ?? []) {
		if (filter.field !== METADATA_TYPED_FILTER_FIELD) continue;
		const match = mergeMetadataPairsFromFilters(
			[{ field: filter.field, valueString: getMetadataFilterRaw(filter) }],
			METADATA_TYPED_FILTER_FIELD,
		).find((pair) => pair.key === metadataKey && allowedValues.has(pair.value));
		if (match) return match.value;
	}
	return undefined;
};

export const updateMetadataToggleFilters = (
	filters: FilterCondition[],
	config: MetadataToggleQuickFilterConfig,
	toggledValue?: string,
): FilterCondition[] => {
	const metadataKey = config.metadataKey ?? 'org_type';
	const allowedValues = new Set(config.options.map((option) => option.value));
	const nonMetadataFilters = filters.filter((filter) => filter.field !== METADATA_TYPED_FILTER_FIELD);
	const allPairs = mergeMetadataPairsFromFilters(filters, METADATA_TYPED_FILTER_FIELD);
	const otherPairs = allPairs.filter((pair) => pair.key !== metadataKey);
	const activeValue = allPairs.find((pair) => pair.key === metadataKey && allowedValues.has(pair.value))?.value;

	if (toggledValue == null) {
		if (!activeValue) return filters;
		const nextPairs = otherPairs;
		if (nextPairs.length === 0) return nonMetadataFilters;
		return [
			...nonMetadataFilters,
			{
				field: METADATA_TYPED_FILTER_FIELD,
				operator: FilterOperator.EQUAL,
				valueString: JSON.stringify(nextPairs),
				dataType: DataType.STRING,
				id: filters.find((filter) => filter.field === METADATA_TYPED_FILTER_FIELD)?.id ?? `metadata-toggle-${metadataKey}`,
			},
		];
	}

	if (!allowedValues.has(toggledValue)) return filters;

	const isActive = activeValue === toggledValue;
	const nextPairs = isActive ? otherPairs : [...otherPairs, { key: metadataKey, value: toggledValue }];
	if (nextPairs.length === 0) return nonMetadataFilters;

	const existingMetadataFilter = filters.find((filter) => filter.field === METADATA_TYPED_FILTER_FIELD);
	return [
		...nonMetadataFilters,
		{
			field: METADATA_TYPED_FILTER_FIELD,
			operator: FilterOperator.EQUAL,
			valueString: JSON.stringify(nextPairs),
			dataType: DataType.STRING,
			id: existingMetadataFilter?.id ?? `metadata-toggle-${metadataKey}`,
		},
	];
};
