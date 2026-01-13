import { SelectOption } from '@/components/atoms/Select/SearchableSelect';

/**
 * DataType - Matches backend DataType exactly
 * Backend: DataTypeString = "string", DataTypeNumber = "number", DataTypeDate = "date", DataTypeArray = "array"
 */
export enum DataType {
	STRING = 'string',
	NUMBER = 'number',
	DATE = 'date',
	ARRAY = 'array',
}

/**
 * FilterOperator enum - Matches backend FilterOperatorType exactly
 * Backend values: "eq", "contains", "not_contains", "gt", "lt", "in", "not_in", "before", "after"
 *
 * NOTE: Only operators that exist in backend are included.
 * Backend TODO operators (not yet implemented): STARTS_WITH, ENDS_WITH
 */
export enum FilterOperator {
	// equal
	EQUAL = 'eq',

	// string
	CONTAINS = 'contains',
	NOT_CONTAINS = 'not_contains',
	// TODO: Backend has these commented as TODO
	// STARTS_WITH = 'starts_with',
	// ENDS_WITH = 'ends_with',

	// number
	GREATER_THAN = 'gt',
	LESS_THAN = 'lt',

	// array
	IN = 'in',
	NOT_IN = 'not_in',

	// date
	BEFORE = 'before',
	AFTER = 'after',
}

export enum FilterFieldType {
	// enum
	INPUT = 'INPUT',
	SELECT = 'SELECT',
	CHECKBOX = 'CHECKBOX',
	DATEPICKER = 'DATEPICKER',
	RADIO = 'RADIO',
	COMBOBOX = 'COMBOBOX',
	SWITCH = 'SWITCH',
	MULTI_SELECT = 'MULTI_SELECT',
	ASYNC_SELECT = 'ASYNC_SELECT',
	ASYNC_MULTI_SELECT = 'ASYNC_MULTI_SELECT',
}

// Ultra-simple config - just provide searchFn
export interface AsyncSearchConfig<T = any> {
	// Required: Your search function (handles empty query automatically)
	searchFn: (query: string) => Promise<Array<SelectOption & { data: T }>>;

	// Optional: Override defaults
	debounceTime?: number; // Default: 300ms
	initialOptions?: SelectOption[]; // Default: fetch with empty query
}

export interface FilterField {
	field: string;
	label: string;
	fieldType: FilterFieldType;
	operators: FilterOperator[];
	options?: { value: string; label: string }[];
	enumValues?: string[];
	dataType: DataType;

	// NEW: For async fields - just add this!
	asyncConfig?: AsyncSearchConfig;
}

/**
 * FilterCondition - Frontend representation (for UI)
 * This is converted to BackendFilterCondition when sending to API
 */
export interface FilterCondition {
	id: string;
	field: string;
	operator: FilterOperator;
	dataType?: DataType;

	// values option (frontend uses separate fields for convenience)
	valueString?: string;
	valueNumber?: number;
	valueArray?: Array<string>;
	valueDate?: Date;

	// future use
	valueBoolean?: boolean;
}

// !INFO: only for future use
// !INFO: currently only keep operators which we have implemented on backend
export interface FilterGroup {
	id: string;
	conditions: FilterCondition[];
	operator: FilterOperator;
}

// Allowed operators per field type - only includes backend-supported operators
export const ALLOWED_OPERATORS_PER_TYPE: Record<FilterFieldType, FilterOperator[]> = {
	[FilterFieldType.INPUT]: [FilterOperator.EQUAL, FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS],
	[FilterFieldType.SELECT]: [FilterOperator.EQUAL],
	[FilterFieldType.CHECKBOX]: [FilterOperator.EQUAL],
	[FilterFieldType.DATEPICKER]: [FilterOperator.BEFORE, FilterOperator.AFTER],
	[FilterFieldType.RADIO]: [FilterOperator.EQUAL],
	[FilterFieldType.COMBOBOX]: [FilterOperator.EQUAL, FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS],
	[FilterFieldType.SWITCH]: [FilterOperator.EQUAL],
	[FilterFieldType.MULTI_SELECT]: [FilterOperator.IN, FilterOperator.NOT_IN],
	[FilterFieldType.ASYNC_SELECT]: [FilterOperator.EQUAL],
	[FilterFieldType.ASYNC_MULTI_SELECT]: [FilterOperator.IN, FilterOperator.NOT_IN],
};

// Default operators per data type - matches backend supported operators
export const DEFAULT_OPERATORS_PER_DATA_TYPE: Record<DataType, FilterOperator[]> = {
	[DataType.STRING]: [FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS, FilterOperator.EQUAL],
	[DataType.NUMBER]: [FilterOperator.EQUAL, FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN],
	[DataType.DATE]: [FilterOperator.BEFORE, FilterOperator.AFTER],
	[DataType.ARRAY]: [FilterOperator.IN, FilterOperator.NOT_IN],
};

/**
 * SortDirection - Matches backend SortDirection exactly
 * Backend: SortDirectionAsc = "asc", SortDirectionDesc = "desc"
 */
export enum SortDirection {
	ASC = 'asc',
	DESC = 'desc',
}

export interface SortOption {
	field: string;
	label: string;
	direction?: SortDirection;
}
