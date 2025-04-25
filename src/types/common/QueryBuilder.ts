export enum FilterOperator {
	// equal
	EQUAL = 'EQUAL',
	NOT_EQUAL = 'NOT_EQUAL',

	// string
	CONTAINS = 'CONTAINS',
	NOT_CONTAINS = 'NOT_CONTAINS',
	STARTS_WITH = 'STARTS_WITH',
	ENDS_WITH = 'ENDS_WITH',

	// number
	GREATER_THAN = 'GREATER_THAN',
	LESS_THAN = 'LESS_THAN',
	BETWEEN = 'BETWEEN',

	// date
	OVERLAPS = 'OVERLAPS',
	CONTAINED_BY = 'CONTAINED_BY',

	// array
	IN = 'IN',
	NOT_IN = 'NOT_IN',
	CONTAINS_ANY = 'CONTAINS_ANY',
	CONTAINS_ALL = 'CONTAINS_ALL',
	BEFORE = 'BEFORE',
	AFTER = 'AFTER',

	// boolean
	TRUE = 'TRUE',
	FALSE = 'FALSE',
	IS_NULL = 'IS_NULL',
	IS_NOT_NULL = 'IS_NOT_NULL',
	IS_EMPTY = 'IS_EMPTY',
	IS_NOT_EMPTY = 'IS_NOT_EMPTY',
	IS_TRUE = 'IS_TRUE',
	IS_FALSE = 'IS_FALSE',
}

export enum FilterDataType {
	STRING = 'STRING',
	NUMBER = 'NUMBER',
	ARRAY = 'ARRAY',
	DATE = 'DATE',
	DATERANGE = 'DATERANGE',
	BOOLEAN = 'BOOLEAN',
}

export interface FilterField {
	field: string;
	label: string;
	dataType: FilterDataType;
	operators: FilterOperator[];
	options?: string[];
}

export interface FilterCondition {
	id: string; // Unique ID for each filter
	field: string;
	operator: FilterOperator;
	dataType: FilterDataType;
	stringValue?: string;
	numberValue?: number;
	arrayValue?: Array<string | number>;
	dateValue?: string;
	dateRangeValue?: [string, string];
	booleanValue?: boolean;
}

// !INFO: only for future use
// !INFO: currently only keep operators which we have implemented on backend
export interface FilterGroup {
	id: string;
	conditions: FilterCondition[];
	operator: FilterOperator;
}

// !ALERT: Add more operators for each data type
// !ALERT: Add more data types
// !ALERT: currently only keep operators which we have implemented on backend
export const ALLOWED_OPERATORS_PER_TYPE: Record<FilterDataType, string[]> = {
	[FilterDataType.STRING]: [
		FilterOperator.EQUAL,
		FilterOperator.NOT_EQUAL,
		FilterOperator.CONTAINS,
		FilterOperator.NOT_CONTAINS,
		FilterOperator.STARTS_WITH,
		FilterOperator.ENDS_WITH,
	],
	[FilterDataType.NUMBER]: [FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN, FilterOperator.BETWEEN],
	[FilterDataType.ARRAY]: [FilterOperator.IN, FilterOperator.NOT_IN, FilterOperator.CONTAINS_ANY, FilterOperator.CONTAINS_ALL],
	[FilterDataType.DATE]: [FilterOperator.OVERLAPS, FilterOperator.CONTAINED_BY],
	[FilterDataType.DATERANGE]: [FilterOperator.OVERLAPS, FilterOperator.CONTAINED_BY],
	[FilterDataType.BOOLEAN]: [
		FilterOperator.TRUE,
		FilterOperator.FALSE,
		FilterOperator.IS_NULL,
		FilterOperator.IS_NOT_NULL,
		FilterOperator.IS_EMPTY,
		FilterOperator.IS_NOT_EMPTY,
		FilterOperator.IS_TRUE,
		FilterOperator.IS_FALSE,
	],
};
