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

export enum FilterFieldType {
	// enum
	INPUT = 'INPUT',
	SELECT = 'SELECT',
	CHECKBOX = 'CHECKBOX',
	DATEPICKER = 'DATEPICKER',
	RADIO = 'RADIO',
	COMBOBOX = 'COMBOBOX',
	SWITCH = 'SWITCH',
}

export interface FilterField {
	field: string;
	label: string;
	fieldType: FilterFieldType;
	operators: FilterOperator[];
	options?: string[];
	enumValues?: string[];
	dataType?: string;
}

export interface FilterCondition {
	id: string; // Unique ID for each filter
	field: string;
	operator: FilterOperator;
	fieldType: FilterFieldType;
	stringValue?: string;
	numberValue?: number;
	arrayValue?: Array<any>;
	dateValue?: Date;
	booleanValue?: boolean;
	dataType?: string;
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
export const ALLOWED_OPERATORS_PER_TYPE: Record<FilterFieldType, FilterOperator[]> = {
	[FilterFieldType.INPUT]: [
		FilterOperator.EQUAL,
		FilterOperator.NOT_EQUAL,
		FilterOperator.CONTAINS,
		FilterOperator.NOT_CONTAINS,
		FilterOperator.STARTS_WITH,
		FilterOperator.ENDS_WITH,
	],
	[FilterFieldType.SELECT]: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL],
	[FilterFieldType.CHECKBOX]: [FilterOperator.IS_TRUE, FilterOperator.IS_FALSE],
	[FilterFieldType.DATEPICKER]: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL, FilterOperator.BEFORE, FilterOperator.AFTER],
	[FilterFieldType.RADIO]: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL],
	[FilterFieldType.COMBOBOX]: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL, FilterOperator.CONTAINS],
	[FilterFieldType.SWITCH]: [FilterOperator.IS_TRUE, FilterOperator.IS_FALSE],
};
