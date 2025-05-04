export enum DataType {
	STRING = 'STRING',
	NUMBER = 'NUMBER',
	// BOOLEAN = 'BOOLEAN',
	DATE = 'DATE',
	ARRAY = 'ARRAY',
}

export enum FilterOperator {
	// equal
	EQUAL = 'EQUAL',
	NOT_EQUAL = 'NOT_EQUAL',

	// is

	// string
	CONTAINS = 'CONTAINS',
	NOT_CONTAINS = 'NOT_CONTAINS',
	STARTS_WITH = 'STARTS_WITH',
	ENDS_WITH = 'ENDS_WITH',

	// number
	GREATER_THAN = 'GREATER_THAN',
	LESS_THAN = 'LESS_THAN',

	// array
	IS_ANY_OF = 'IS_ANY_OF',
	IS_NOT_ANY_OF = 'IS_NOT_ANY_OF',
	BEFORE = 'BEFORE',
	AFTER = 'AFTER',
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
}

export interface FilterField {
	field: string;
	label: string;
	fieldType: FilterFieldType;
	operators: FilterOperator[];
	options?: { value: string; label: string }[];
	enumValues?: string[];
	dataType: DataType;
}

export interface FilterCondition {
	id: string;
	field: string;
	operator: FilterOperator;
	dataType?: DataType;

	// values option
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
	[FilterFieldType.CHECKBOX]: [FilterOperator.EQUAL],
	[FilterFieldType.DATEPICKER]: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL, FilterOperator.BEFORE, FilterOperator.AFTER],
	[FilterFieldType.RADIO]: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL],
	[FilterFieldType.COMBOBOX]: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL, FilterOperator.CONTAINS],
	[FilterFieldType.SWITCH]: [FilterOperator.EQUAL],
	[FilterFieldType.MULTI_SELECT]: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
};

// !ALERT: Add more operators for each data type
// !ALERT: currently only keep operators which we have implemented on backend
export const DEFAULT_OPERATORS_PER_DATA_TYPE: Record<DataType, FilterOperator[]> = {
	[DataType.STRING]: [FilterOperator.CONTAINS, FilterOperator.EQUAL],
	[DataType.NUMBER]: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL, FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN],
	[DataType.DATE]: [FilterOperator.EQUAL, FilterOperator.BEFORE, FilterOperator.AFTER],
	[DataType.ARRAY]: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
};

// sorting
export enum SortDirection {
	ASC = 'asc',
	DESC = 'desc',
}

export interface SortOption {
	field: string;
	label: string;
	direction?: SortDirection;
}
