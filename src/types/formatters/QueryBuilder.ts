import { SortDirection, SortOption } from '@/components/molecules/QueryBuilder';
import { FilterCondition, DataType, FilterOperator } from '../common/QueryBuilder';

// Backend filter format with type-specific value fields
export interface TypedBackendFilter {
	field: string;
	operator: FilterOperator;
	dataType: DataType;
	value_string?: string;
	value_number?: number;
	value_boolean?: boolean;
	value_date?: string; // ISO string format
	value_array?: Array<string | number>;
}

export interface TypedBackendQueryPayload {
	filters: TypedBackendFilter[];
}

// Backend sort format
export interface TypedBackendSort {
	field: string;
	direction: 'ASC' | 'DESC';
	label?: string; // Optional label for UI display
}

export interface TypedBackendSortPayload {
	sorts: TypedBackendSort[];
}

export const sanitizeFilterConditions = (conditions: FilterCondition[]) => {
	return conditions.filter((condition) => {
		// Check if required base fields are present
		if (!condition.field || !condition.operator) {
			return false;
		}

		// If dataType is not specified, we can't validate the value
		if (!condition.dataType) {
			return false;
		}

		// Validate based on dataType
		switch (condition.dataType) {
			case DataType.STRING:
				// For string type, stringValue should be defined and not empty
				return condition.valueString !== undefined && condition.valueString.trim() !== '';

			case DataType.NUMBER:
				// For number type, numberValue should be defined and be a valid number
				return condition.valueNumber !== undefined && !isNaN(condition.valueNumber);

			case DataType.DATE:
				// For date type, dateValue should be defined and be a valid date
				return condition.valueDate !== undefined && !isNaN(condition.valueDate.getTime());

			case DataType.ARRAY:
				// For array type, arrayValue should be defined and not empty
				return condition.valueArray !== undefined && Array.isArray(condition.valueArray) && condition.valueArray.length > 0;

			default:
				// Unknown data type
				return false;
		}
	});
};

export const sanitizeSortConditions = (conditions: SortOption[]) => {
	return Array.isArray(conditions)
		? conditions.filter(
				(condition) =>
					condition?.field?.trim() &&
					condition?.label?.trim() &&
					(!condition.direction || [SortDirection.ASC, SortDirection.DESC].includes(condition.direction)),
			)
		: [];
};

export const convertFilterConditionToQuery = (conditions: FilterCondition[]): TypedBackendQueryPayload => {
	const sanitizedConditions = sanitizeFilterConditions(conditions);

	return {
		filters: sanitizedConditions.map((condition): TypedBackendFilter => {
			const baseFilter: TypedBackendFilter = {
				field: condition.field,
				operator: condition.operator,
				dataType: condition.dataType!,
			};

			// Handle special operators that don't need values
			if ([FilterOperator.EQUAL, FilterOperator.NOT_EQUAL].includes(condition.operator)) {
				return baseFilter;
			}

			// Extract the appropriate value based on dataType
			switch (condition.dataType) {
				case DataType.STRING:
					return {
						...baseFilter,
						value_string: condition.valueString,
					};

				case DataType.NUMBER:
					return {
						...baseFilter,
						value_number: condition.valueNumber,
					};

				case DataType.DATE:
					return {
						...baseFilter,
						value_date: condition.valueDate?.toISOString(),
					};

				case DataType.ARRAY:
					return {
						...baseFilter,
						value_array: condition.valueArray,
					};

				default:
					console.warn(`Unsupported dataType: ${condition.dataType}`);
					return baseFilter;
			}
		}),
	};
};

// Helper function to validate the backend query payload
export const validateBackendQueryPayload = (payload: TypedBackendQueryPayload): boolean => {
	if (!Array.isArray(payload.filters)) return false;

	return payload.filters.every((filter) => {
		// Check required fields
		if (!filter.field || !filter.operator || !filter.dataType) return false;

		// For operators that don't need values
		if ([FilterOperator.EQUAL, FilterOperator.NOT_EQUAL].includes(filter.operator)) {
			return true;
		}

		// Check if appropriate value field is present based on dataType
		switch (filter.dataType) {
			case DataType.STRING:
				return filter.value_string !== undefined && filter.value_string !== null;
			case DataType.NUMBER:
				return filter.value_number !== undefined && filter.value_number !== null;
			case DataType.DATE:
				return filter.value_date !== undefined && filter.value_date !== null;
			case DataType.ARRAY:
				return Array.isArray(filter.value_array) && filter.value_array.length > 0;
			default:
				return false;
		}
	});
};

export const convertSortOptionsToQuery = (sortOptions: SortOption[]): TypedBackendSortPayload => {
	const sanitizedSorts = sanitizeSortConditions(sortOptions);

	return {
		sorts: sanitizedSorts.map(
			(sort): TypedBackendSort => ({
				field: sort.field,
				direction: sort.direction || SortDirection.ASC,
				label: sort.label,
			}),
		),
	};
};

// Helper function to validate the backend sort payload
export const validateBackendSortPayload = (payload: TypedBackendSortPayload): boolean => {
	if (!Array.isArray(payload.sorts)) return false;

	return payload.sorts.every((sort) => {
		// Check required fields
		if (!sort.field || !sort.direction) return false;

		// Validate direction
		if (!['ASC', 'DESC'].includes(sort.direction)) return false;

		return true;
	});
};

// Combined function to convert both filters and sorts
export interface TypedBackendQueryWithSortPayload {
	filters: TypedBackendFilter[];
	sorts: TypedBackendSort[];
}

export const convertToBackendPayload = (filters: FilterCondition[], sortOptions: SortOption[]): TypedBackendQueryWithSortPayload => {
	const filterPayload = convertFilterConditionToQuery(filters);
	const sortPayload = convertSortOptionsToQuery(sortOptions);

	return {
		filters: filterPayload.filters,
		sorts: sortPayload.sorts,
	};
};
