import { SortDirection, SortOption } from '@/types/common/QueryBuilder';
import { FilterCondition, DataType, FilterOperator } from '../common/QueryBuilder';

// Simplified backend filter format with discriminated union for values
export interface TypedBackendFilter {
	field: string;
	operator: string;
	data_type: string;
	value: {
		string?: string;
		number?: number;
		boolean?: boolean;
		date?: string;
		array?: string[];
	};
}

export interface TypedBackendQueryPayload {
	filters: TypedBackendFilter[];
}

// Backend sort format
export interface TypedBackendSort {
	field: string;
	direction: SortDirection;
}

export interface TypedBackendSortPayload {
	sorts: TypedBackendSort[];
}

// Combined validation and sanitization for filter conditions
export const sanitizeFilterConditions = (conditions: FilterCondition[]): TypedBackendFilter[] => {
	return conditions
		.filter((condition) => {
			if (!condition.field || !condition.operator || !condition.dataType) {
				return false;
			}

			switch (condition.dataType) {
				case DataType.STRING:
					return condition.valueString?.trim() !== '';
				case DataType.NUMBER:
					return condition.valueNumber !== undefined && !isNaN(condition.valueNumber);
				case DataType.DATE:
					return condition.valueDate instanceof Date && !isNaN(condition.valueDate.getTime());
				case DataType.ARRAY:
					return Array.isArray(condition.valueArray) && condition.valueArray.length > 0;
				default:
					return false;
			}
		})
		.map((condition) => {
			const operatorMap: Record<FilterOperator, string> = {
				[FilterOperator.EQUAL]: 'eq',
				[FilterOperator.NOT_EQUAL]: 'neq',
				[FilterOperator.CONTAINS]: 'contains',
				[FilterOperator.NOT_CONTAINS]: 'not_contains',
				[FilterOperator.STARTS_WITH]: 'starts_with',
				[FilterOperator.ENDS_WITH]: 'ends_with',
				[FilterOperator.GREATER_THAN]: 'gt',
				[FilterOperator.LESS_THAN]: 'lt',
				[FilterOperator.IS_ANY_OF]: 'in',
				[FilterOperator.IS_NOT_ANY_OF]: 'not_in',
				[FilterOperator.BEFORE]: 'before',
				[FilterOperator.AFTER]: 'after',
			};

			const baseFilter: TypedBackendFilter = {
				field: condition.field,
				operator: operatorMap[condition.operator] || condition.operator.toString().toLowerCase(),
				data_type: condition.dataType?.toString().toLowerCase() || '',
				value: {},
			};

			switch (condition.dataType) {
				case DataType.STRING:
					return { ...baseFilter, value: { string: condition.valueString } };
				case DataType.NUMBER:
					return { ...baseFilter, value: { number: condition.valueNumber } };
				case DataType.DATE:
					return { ...baseFilter, value: { date: condition.valueDate?.toISOString() } };
				case DataType.ARRAY:
					return { ...baseFilter, value: { array: condition.valueArray } };
				default:
					return baseFilter;
			}
		});
};

export const sanitizeSortConditions = (conditions: SortOption[]): TypedBackendSort[] => {
	return Array.isArray(conditions)
		? conditions
				.filter(
					(condition) =>
						condition?.field?.trim() && (!condition.direction || [SortDirection.ASC, SortDirection.DESC].includes(condition.direction)),
				)
				.map((sort) => ({
					field: sort.field,
					direction: sort.direction || SortDirection.ASC,
				}))
		: [];
};

export const convertFilterConditionToQuery = (conditions: FilterCondition[]): TypedBackendQueryPayload => ({
	filters: sanitizeFilterConditions(conditions),
});

export const convertSortOptionsToQuery = (sortOptions: SortOption[]): TypedBackendSortPayload => ({
	sorts: sanitizeSortConditions(sortOptions),
});

// Combined interface for queries with both filters and sorts
export interface TypedBackendQueryWithSortPayload {
	filters: TypedBackendFilter[];
	sorts: TypedBackendSort[];
}

export const convertFiltersAndSortToBackendPayload = (
	filters: FilterCondition[],
	sortOptions: SortOption[],
): TypedBackendQueryWithSortPayload => {
	const sanitizedFilters = sanitizeFilterConditions(filters);
	const sanitizedSortOptions = sanitizeSortConditions(sortOptions);

	return {
		filters: sanitizedFilters,
		sorts: sanitizedSortOptions,
	};
};
